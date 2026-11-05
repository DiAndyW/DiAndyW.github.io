import { createHash } from 'node:crypto';
import { isIP } from 'node:net';
import { Redis } from '@upstash/redis';

export interface ContactConfig {
    apiKey?: string;
    from?: string;
    to?: string;
    // Enable only behind a proxy that overwrites x-forwarded-for (Vercel).
    trustProxy?: boolean;
    requireSharedLimiter?: boolean;
    redisUrl?: string;
    redisToken?: string;
}

const MAX_BODY_BYTES = 16_384;
// One atomic reservation across all instances; denied attempts do not extend windows.
const RESERVE = `
local retry = 0
for i = 1, #KEYS do
    if tonumber(redis.call('GET', KEYS[i]) or '0') >= tonumber(ARGV[i * 2 - 1]) then
        retry = math.max(retry, redis.call('TTL', KEYS[i]))
        if retry < 1 then retry = 1 end
    end
end
if retry > 0 then return {0, retry} end
for i = 1, #KEYS do
    local count = redis.call('INCR', KEYS[i])
    if count == 1 then redis.call('EXPIRE', KEYS[i], ARGV[i * 2]) end
end
return {1, 0}
`;

function clientKey(request: Request, trustProxy?: boolean) {
    const forwarded = trustProxy ? request.headers.get('x-forwarded-for')?.trim() : undefined;
    // Reject lists/malformed addresses rather than trusting a visitor-controlled prefix.
    if (!forwarded || !isIP(forwarded)) return 'unknown';
    const normalized = isIP(forwarded) === 6 ? new URL(`http://[${forwarded}]/`).hostname : forwarded;
    return createHash('sha256').update(normalized).digest('hex');
}
const EMAIL = /^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/;

function reply(status: number, error?: string, headers: Record<string, string> = {}) {
    return Response.json(error ? { error } : { ok: true }, {
        status, headers: { 'Cache-Control': 'no-store', ...headers },
    });
}

export function createContactHandler(config: ContactConfig, dependencies: { fetch?: typeof fetch; now?: () => number } = {}) {
    const send = dependencies.fetch ?? fetch;
    const now = dependencies.now ?? Date.now;
    // Development-only fallback; production requires the shared store.
    const attempts = new Map<string, { count: number; expires: number }>();
    let redis: Redis | undefined;

    return async (request: Request): Promise<Response> => {
        if (request.headers.get('origin') !== new URL(request.url).origin) {
            return reply(403, 'Please send your message from this website.');
        }
        if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') {
            return reply(415, 'Please submit the contact form.');
        }

        let data: Record<string, unknown>;
        try {
            const reader = request.body?.getReader();
            if (!reader) return reply(400, 'Please fill in all fields.');
            const chunks: Uint8Array[] = [];
            let size = 0;
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    size += value.byteLength;
                    if (size > MAX_BODY_BYTES) {
                        await reader.cancel();
                        return reply(413, 'Your message is too long.');
                    }
                    chunks.push(value);
                }
            } finally {
                reader.releaseLock();
            }
            const body = new Uint8Array(size);
            let offset = 0;
            for (const chunk of chunks) {
                body.set(chunk, offset);
                offset += chunk.byteLength;
            }
            const parsed: unknown = JSON.parse(new TextDecoder().decode(body));
            if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reply(400, 'Please fill in all fields.');
            data = parsed as Record<string, unknown>;
        } catch {
            return reply(400, 'Please submit a valid message.');
        }

        if (data.website !== undefined && typeof data.website !== 'string') return reply(400, 'Please submit a valid message.');
        if (typeof data.website === 'string' && data.website.trim()) return reply(200);
        const name = typeof data.name === 'string' ? data.name.trim() : '';
        const email = typeof data.email === 'string' ? data.email.trim() : '';
        const message = typeof data.message === 'string' ? data.message.trim() : '';
        if (!name || name.length > 100 || /[\x00-\x1f\x7f]/.test(name) || !EMAIL.test(email) || email.length > 254 || !message || message.length > 5000) {
            return reply(400, 'Check your name, email, and message.');
        }
        if (!config.apiKey?.trim() || !config.from?.trim() || !config.to?.trim()) {
            return reply(503, 'Messages are temporarily unavailable. Please reach out on LinkedIn.');
        }

        const unavailable = () => reply(503, 'Messages are temporarily unavailable. Please reach out on LinkedIn.');
        const client = clientKey(request, config.trustProxy);
        // Hash-tag keeps all keys in the same Redis cluster slot. No email/IP is stored.
        const quotas = [
            { key: `{portfolio-contact}:client:${client}`, limit: 3, seconds: 900 },
            { key: '{portfolio-contact}:quarter-hour', limit: 20, seconds: 900 },
            { key: '{portfolio-contact}:day', limit: 100, seconds: 86400 },
        ];
        let retryAfter = 0;
        if (config.redisUrl && config.redisToken) {
            try {
                if (new URL(config.redisUrl).protocol !== 'https:') return unavailable();
                redis ??= new Redis({
                    url: config.redisUrl,
                    token: config.redisToken,
                    // A lost response may still mean the reservation succeeded.
                    retry: { retries: 0 },
                    signal: () => AbortSignal.timeout(5_000),
                    cache: 'no-store',
                    enableAutoPipelining: false,
                    enableTelemetry: false,
                });
                const result: unknown = await redis.eval(RESERVE, quotas.map(q => q.key),
                    quotas.flatMap(q => [q.limit, q.seconds]));
                if (!Array.isArray(result) || result.length !== 2 ||
                    ![0, 1].includes(result[0]) || !Number.isInteger(result[1]) ||
                    (result[0] === 1 ? result[1] !== 0 : result[1] < 1 || result[1] > 86400)) return unavailable();
                if (result[0] === 0) retryAfter = result[1];
            } catch {
                return unavailable();
            }
        } else {
            if (config.requireSharedLimiter || config.redisUrl || config.redisToken) return unavailable();
            const time = now();
            for (const [key, entry] of attempts) if (entry.expires <= time) attempts.delete(key);
            for (const quota of quotas) {
                const entry = attempts.get(quota.key);
                if (entry && entry.count >= quota.limit) {
                    retryAfter = Math.max(retryAfter, Math.ceil((entry.expires - time) / 1000));
                }
            }
            if (!retryAfter) {
                for (const quota of quotas) {
                    const entry = attempts.get(quota.key);
                    attempts.set(quota.key, { count: (entry?.count ?? 0) + 1, expires: entry?.expires ?? time + quota.seconds * 1000 });
                }
            }
        }
        if (retryAfter) return reply(429, 'Too many messages. Please try again later.', { 'Retry-After': String(retryAfter) });

        try {
            const response = await send('https://api.resend.com/emails', {
                method: 'POST',
                headers: { Authorization: `Bearer ${config.apiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    from: config.from, to: [config.to], reply_to: email,
                    subject: `Portfolio contact: ${name}`,
                    text: `From: ${name} <${email}>\n\n${message}`,
                }),
                signal: AbortSignal.timeout(10_000),
            });
            if (!response.ok) return reply(502, 'Your message could not be sent. Please try again.');
            const result: unknown = await response.json();
            if (!result || typeof result !== 'object' || !('id' in result) || typeof result.id !== 'string' || !result.id) {
                return reply(502, 'Your message could not be sent. Please try again.');
            }
            return reply(200);
        } catch {
            return reply(502, 'Your message could not be sent. Please try again.');
        }
    };
}
