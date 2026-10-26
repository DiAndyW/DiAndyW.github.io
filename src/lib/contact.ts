export interface ContactConfig {
    apiKey?: string;
    from?: string;
    to?: string;
}

const MAX_BODY_BYTES = 16_384;
const WINDOW_MS = 15 * 60_000;
const EMAIL = /^[^\s@\x00-\x1f\x7f]+@[^\s@\x00-\x1f\x7f]+\.[^\s@\x00-\x1f\x7f]+$/;

function reply(status: number, error?: string, headers: Record<string, string> = {}) {
    return Response.json(error ? { error } : { ok: true }, {
        status, headers: { 'Cache-Control': 'no-store', ...headers },
    });
}

export function createContactHandler(config: ContactConfig, dependencies: { fetch?: typeof fetch; now?: () => number } = {}) {
    const send = dependencies.fetch ?? fetch;
    const now = dependencies.now ?? Date.now;
    // Best-effort per-instance throttle. Serverless instances do not share this map.
    const attempts = new Map<string, { count: number; expires: number }>();

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

        const time = now();
        for (const [key, entry] of attempts) if (entry.expires <= time) attempts.delete(key);
        const client = request.headers.get('x-forwarded-for')?.split(',')[0].trim() || 'unknown';
        const entry = attempts.get(client);
        if ((entry && entry.count >= 3) || (!entry && attempts.size >= 1000)) {
            return reply(429, 'Too many messages. Please try again later.', {
                'Retry-After': String(Math.ceil(((entry?.expires ?? time + WINDOW_MS) - time) / 1000)),
            });
        }
        attempts.set(client, { count: (entry?.count ?? 0) + 1, expires: entry?.expires ?? time + WINDOW_MS });

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
