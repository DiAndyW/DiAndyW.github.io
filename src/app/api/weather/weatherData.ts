import { LA, laClock, type WeatherData } from '../../../components/interests/weather.ts';

export function weatherURL() {
    const url = new URL('https://api.open-meteo.com/v1/forecast');
    url.search = new URLSearchParams({ latitude: String(LA.latitude), longitude: String(LA.longitude),
        current: 'weather_code', daily: 'sunrise,sunset', timezone: 'America/Los_Angeles', timeformat: 'unixtime', forecast_days: '1' }).toString();
    return url.toString();
}
const record = (v: unknown): Record<string, unknown> => v && typeof v === 'object' ? v as Record<string, unknown> : {};
const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
export function shapeWeather(payload: unknown, now = Date.now()): WeatherData | null {
    const root = record(payload), current = record(root.current), daily = record(root.daily);
    if (!finite(current.time) || !finite(current.weather_code) || !Number.isInteger(current.weather_code)) return null;
    const observedAt = current.time * 1000;
    if (now - observedAt > 2 * 60 * 60_000 || observedAt - now > 10 * 60_000) return null;
    const dates = Array.isArray(daily.time) ? daily.time : [];
    const rises = Array.isArray(daily.sunrise) ? daily.sunrise : [];
    const sets = Array.isArray(daily.sunset) ? daily.sunset : [];
    const date = laClock(new Date(now)).date;
    const i = dates.findIndex((d) => finite(d) && laClock(new Date(d * 1000)).date === date);
    const rise = rises[i], set = sets[i];
    if (!finite(rise) || !finite(set) || rise >= set || set - rise > 86400) return null;
    if (laClock(new Date(rise * 1000)).date !== date || laClock(new Date(set * 1000)).date !== date) return null;
    return { code: current.weather_code, observedAt, date, sunrise: rise * 1000, sunset: set * 1000 };
}
