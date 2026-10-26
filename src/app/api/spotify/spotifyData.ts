export class SpotifyError extends Error {
    status: number;
    retryAfter: number;

    constructor(status: number, retryAfter = 60) {
        super(`Spotify request failed (${status})`);
        this.status = status;
        this.retryAfter = retryAfter;
    }
}

export async function spotifyJSON(response: Response) {
    if (!response.ok) {
        const seconds = Number(response.headers.get('Retry-After'));
        throw new SpotifyError(response.status, Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : 60);
    }
    return response.json();
}
