import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createContactHandler } from './contact.ts';

const config = { apiKey: 'test-key', from: 'Portfolio <contact@example.com>', to: 'private@example.com' };
const valid = { name: '  Jane Doe  ', email: '  jane@example.net  ', message: '  Hello Andy!\nLet’s talk.  ', website: '' };
function request(body: unknown = valid, headers: Record<string, string> = {}) {
    return new Request('https://portfolio.example/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Origin: 'https://portfolio.example', 'x-forwarded-for': '203.0.113.4', ...headers },
        body: JSON.stringify(body),
    });
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
