import { NextResponse } from 'next/server';
import { shapeWeather, weatherURL } from './weatherData';

export async function GET() {
    try {
        // Next's server data cache is shared by visitors; no API key or per-browser persistence.
        const res = await fetch(weatherURL(), { next: { revalidate: 900 }, signal: AbortSignal.timeout(8000) });
        const data = res.ok ? shapeWeather(await res.json()) : null;
        if (data) return NextResponse.json(data);
    } catch {
        // The client keeps rainy weather and its locally calculated LA time when unavailable.
    }
    return NextResponse.json({ error: 'Weather unavailable' }, { status: 503 });
}
