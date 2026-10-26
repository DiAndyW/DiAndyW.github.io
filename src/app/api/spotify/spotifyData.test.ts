import test from 'node:test';
import assert from 'node:assert/strict';
import { spotifyJSON, SpotifyError } from './spotifyData.ts';

test('rate limits preserve Retry-After without exposing upstream bodies', async () => {
    await assert.rejects(spotifyJSON(new Response('{"error":"private"}', { status: 429, headers: { 'Retry-After': '1200' } })), (error: unknown) => {
        assert.ok(error instanceof SpotifyError);
        assert.equal(error.retryAfter, 1200);
        assert.equal(error.message.includes('private'), false);
        return true;
    });
});

test('rejects failed artist requests before shaping them and accepts success', async () => {
    await assert.rejects(spotifyJSON(new Response('{}', { status: 403 })), SpotifyError);
    assert.deepEqual(await spotifyJSON(new Response('{"id":"artist"}')), { id: 'artist' });
});
