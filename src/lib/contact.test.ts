import { test, type TestContext } from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from './contact.ts';

const config = { apiKey: 'test-key', from: 'Portfolio <contact@example.com>', to: 'private@example.com', trustProxy: true };
const valid = { name: '  Jane Doe  ', email: '  jane@example.net  ', message: '  Hello Andy!\nLet’s talk.  ', website: '' };
function request(body: unknown = valid, headers: Record<string, string> = {}) {
    return new Request('https://portfolio.example/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.example', 'x-forwarded-for': '203.0.113.4', ...headers },
        body: JSON.stringify(body),
    });
}

// Exercise the real SDK while replacing only its external HTTP transport.
function sharedHandler(t: TestContext, options: Parameters<typeof createContactHandler>[0], dependencies: { fetch: typeof fetch }) {
    t.mock.method(globalThis, 'fetch', (url: Parameters<typeof fetch>[0], init?: RequestInit) =>
        dependencies.fetch(String(url).replace(/\/$/, ''), init));
    return createContactHandler(options, dependencies);
}

const noSend: typeof fetch = async () => { throw new Error('Unexpected email delivery'); };

test('delivers a trimmed plain-text message to the configured recipient, never the visitor-supplied destination', async () => {
    let sent: Record<string, unknown> | undefined;
    const handler = createContactHandler(config, { fetch: async (url, options) => {
        assert.equal(url, 'https://api.resend.com/emails');
        assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer test-key');
        sent = JSON.parse(String(options?.body));
        return Response.json({ id: 'delivery-id' });
    } });
    const response = await handler(request({ ...valid, to: 'attacker@example.net' }));
    assert.equal(response.status, 200);
    assert.deepEqual(sent, {
        from: 'Portfolio <contact@example.com>', to: ['private@example.com'], reply_to: 'jane@example.net',
        subject: 'Portfolio contact: Jane Doe', text: 'From: Jane Doe <jane@example.net>\n\nHello Andy!\nLet’s talk.',
    });
    assert.deepEqual(await response.json(), { ok: true });
});

test('rejects malformed fields and header injection without sending', async () => {
    const handler = createContactHandler(config, { fetch: noSend });
    for (const body of [null, [], {}, { ...valid, name: '  ' }, { ...valid, name: 'a'.repeat(101) },
        { ...valid, email: 'invalid' }, { ...valid, email: 'a@b.com\r\nBcc: x@y.com' },
        { ...valid, name: 'Jane\nBcc: x@y.com' }, { ...valid, email: 'a'.repeat(250) + '@b.com' },
        { ...valid, message: ' ' }, { ...valid, message: 'a'.repeat(5001) }, { ...valid, website: {} },
        { ...valid, message: 42 }]) {
        assert.equal((await handler(request(body))).status, 400);
    }
});

test('blocks foreign and missing origins and non-JSON requests', async () => {
    const handler = createContactHandler(config, { fetch: noSend });
    assert.equal((await handler(request(valid, { Origin: 'https://evil.example' }))).status, 403);
    assert.equal((await handler(request(valid, { Origin: '' }))).status, 403);
    assert.equal((await handler(request(valid, { 'Content-Type': 'text/plain' }))).status, 415);
});

test('limits actual body size even without Content-Length and rejects broken JSON', async () => {
    const handler = createContactHandler(config, { fetch: noSend });
    assert.equal((await handler(request({ ...valid, extra: 'x'.repeat(17000) }))).status, 413);
    const broken = new Request('https://portfolio.example/api/contact', {
        method: 'POST', headers: { Origin: 'https://portfolio.example', 'Content-Type': 'application/json' }, body: '{',
    });
    assert.equal((await handler(broken)).status, 400);
});

test('honeypot submissions are discarded without exposing whether spam was detected', async () => {
    const handler = createContactHandler(config, { fetch: noSend });
    const response = await handler(request({ ...valid, website: 'https://spam.example' }));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { ok: true });
});

test('fails honestly when delivery is not configured and keeps private errors out of responses', async () => {
    assert.equal((await createContactHandler({}, { fetch: noSend })(request())).status, 503);
    for (const send of [
        async () => Response.json({ message: 'private@example.com test-key' }, { status: 403 }),
        async () => { throw new Error('private@example.com test-key'); },
        async () => Response.json({ unexpected: 'provider changed' }),
    ]) {
        const response = await createContactHandler(config, { fetch: send })(request());
        assert.equal(response.status, 502);
        assert.doesNotMatch(await response.text(), /private@example.com|test-key/);
    }
});

test('throttles repeated attempts per client, allows another client and resets after fifteen minutes', async () => {
    let now = 1000;
    const handler = createContactHandler(config, { now: () => now, fetch: async () => Response.json({ id: 'sent' }) });
    for (let i = 0; i < 3; i++) assert.equal((await handler(request())).status, 200);
    const limited = await handler(request());
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('Retry-After'), '900');
    assert.equal((await handler(request(valid, { 'x-forwarded-for': '203.0.113.5' }))).status, 200);
    now += 900_000;
    assert.equal((await handler(request())).status, 200);
});


test('changing email addresses never resets the client quota', async () => {
    const handler = createContactHandler(config, { fetch: async () => Response.json({ id: 'sent' }) });
    for (let i = 0; i < 4; i++) {
        assert.equal((await handler(request({ ...valid, email: `visitor${i}@example.net` }))).status, i < 3 ? 200 : 429);
    }
});

test('untrusted forwarded headers cannot create fresh client quotas', async () => {
    const handler = createContactHandler({ ...config, trustProxy: false }, { fetch: async () => Response.json({ id: 'sent' }) });
    for (let i = 0; i < 4; i++) {
        assert.equal((await handler(request(valid, { 'x-forwarded-for': `203.0.113.${i}` }))).status, i < 3 ? 200 : 429);
    }
});

test('site-wide cap bounds delivery even when clients rotate IPs and emails', async () => {
    const handler = createContactHandler(config, { fetch: async () => Response.json({ id: 'sent' }) });
    for (let i = 0; i < 21; i++) {
        assert.equal((await handler(request({ ...valid, email: `visitor${i}@example.net` }, { 'x-forwarded-for': `203.0.113.${i}` }))).status, i < 20 ? 200 : 429);
    }
});

test('production refuses delivery without a shared rate limiter', async () => {
    const response = await createContactHandler({ ...config, requireSharedLimiter: true }, { fetch: noSend })(request());
    assert.equal(response.status, 503);
});

test('shared limiter failures and malformed responses fail closed without email delivery', async (t) => {
    for (const result of [Response.json({ error: 'secret' }), Response.json({ result: null }), Response.json({ result: [-1] }), new Response('', { status: 503 })]) {
        const handler = sharedHandler(t, { ...config, redisUrl: 'https://redis.example', redisToken: 'redis-secret' }, {
            fetch: async (url) => { assert.equal(url, 'https://redis.example'); return result; },
        });
        const response = await handler(request());
        assert.equal(response.status, 503);
        assert.doesNotMatch(await response.text(), /secret/);
    }
});

test('shared limiter denial is honored across fresh handlers before calling the mail provider', async (t) => {
    for (let i = 0; i < 2; i++) {
        const handler = sharedHandler(t, { ...config, redisUrl: 'https://redis.example', redisToken: 'redis-secret' }, {
            fetch: async (url, options) => {
                assert.equal(url, 'https://redis.example');
                assert.equal(new Headers(options?.headers).get('Authorization'), 'Bearer redis-secret');
                const command = JSON.parse(String(options?.body));
                assert.equal(command[0], 'eval');
                assert.equal(command[2], 3);
                assert.doesNotMatch(String(options?.body), /jane@example.net|203\.0\.113\.4/);
                return Response.json({ result: [0, 120] });
            },
        });
        const response = await handler(request());
        assert.equal(response.status, 429);
        assert.equal(response.headers.get('Retry-After'), '120');
    }
});


test('daily cap survives shorter-window expiry and resets after a day', async () => {
    let now = 0;
    const handler = createContactHandler(config, { now: () => now, fetch: async () => Response.json({ id: 'sent' }) });
    for (let window = 0; window < 5; window++) {
        for (let client = 0; client < 20; client++) {
            assert.equal((await handler(request(valid, { 'x-forwarded-for': `203.0.113.${client}` }))).status, 200);
        }
        now += 900_000;
    }
    const limited = await handler(request());
    assert.equal(limited.status, 429);
    assert.equal(limited.headers.get('Retry-After'), '81900');
    now = 86_400_000;
    assert.equal((await handler(request())).status, 200);
});

test('concurrent requests reserve quota before waiting for delivery', async () => {
    let sent = 0;
    const handler = createContactHandler(config, { fetch: async () => {
        sent++;
        await new Promise(resolve => setTimeout(resolve, 5));
        return Response.json({ id: 'sent' });
    } });
    const responses = await Promise.all(Array.from({ length: 10 }, () => handler(request())));
    assert.equal(sent, 3);
    assert.equal(responses.filter(r => r.status === 429).length, 7);
});

test('a successful shared reservation sends once with the correct quotas and does not cache the check', async (t) => {
    let sent = 0;
    const handler = sharedHandler(t, { ...config, requireSharedLimiter: true, redisUrl: 'https://redis.example', redisToken: 'redis-secret' }, {
        fetch: async (url, options) => {
            if (url === 'https://redis.example') {
                const command = JSON.parse(String(options?.body));
                assert.deepEqual(command.slice(-6), [3, 900, 20, 900, 100, 86400]);
                assert.equal(options?.cache, 'no-store');
                return Response.json({ result: [1, 0] });
            }
            assert.equal(url, 'https://api.resend.com/emails');
            sent++;
            return Response.json({ id: 'sent' });
        },
    });
    assert.equal((await handler(request())).status, 200);
    assert.equal(sent, 1);
});

test('missing Redis credentials, network failures and insecure Redis URLs never fall back to delivery', async (t) => {
    for (const redis of [
        { redisUrl: 'https://redis.example' }, { redisToken: 'secret' },
        { redisUrl: 'http://redis.example', redisToken: 'secret' },
        { redisUrl: 'https://redis.example', redisToken: 'secret' },
    ]) {
        const handler = sharedHandler(t, { ...config, ...redis }, { fetch: noSend });
        assert.equal((await handler(request())).status, 503);
    }
});

test('SDK transport failures do not retry an ambiguous quota reservation', async (t) => {
    let reservations = 0;
    t.mock.method(globalThis, 'fetch', async () => {
        reservations++;
        throw new Error('Connection lost after Redis may have reserved quota');
    });
    const handler = createContactHandler({ ...config, redisUrl: 'https://redis.example', redisToken: 'secret' }, { fetch: noSend });
    assert.equal((await handler(request())).status, 503);
    assert.equal(reservations, 1);
});
