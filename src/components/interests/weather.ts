export type Weather = 'clear' | 'cloudy' | 'rainy';
export type DayTime = 'dawn' | 'day' | 'dusk' | 'night';
export type WindowState = { weather: Weather; time: DayTime };
export type SolarTimes = { date: string; sunrise: number; sunset: number };
export type WeatherData = SolarTimes & { code: number; observedAt: number };
export const WEATHER_REFRESH_MS = 15 * 60_000;
export const LA = { latitude: 34.0522, longitude: -118.2437 } as const;

export function weatherPreset(code: number): Weather {
    if (code === 0 || code === 1) return 'clear';
    if ([2, 3, 45, 48].includes(code)) return 'cloudy';
    return 'rainy';
}

const clock = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});
export function laClock(now: Date) {
    const p = Object.fromEntries(clock.formatToParts(now).map(({ type, value }) => [type, value]));
    return { date: `${p.year}-${p.month}-${p.day}`, minutes: Number(p.hour) * 60 + Number(p.minute) };
}

// NOAA's fractional-year solar approximation, at LA's coordinates.
// https://gml.noaa.gov/grad/solcalc/solareqns.PDF Used before the API arrives
// and after its daily sunrise/sunset expire. Civil date always comes from Intl, including DST.
export function solarTimes(now: Date): SolarTimes {
    const { date } = laClock(now);
    const midnight = Date.parse(`${date}T00:00:00Z`);
    const d = new Date(midnight);
    const day = (midnight - Date.UTC(d.getUTCFullYear(), 0, 0)) / 86_400_000;
    const gamma = 2 * Math.PI / 365 * (day - 1);
    const eq = 229.18 * (0.000075 + 0.001868 * Math.cos(gamma) - 0.032077 * Math.sin(gamma)
        - 0.014615 * Math.cos(2 * gamma) - 0.040849 * Math.sin(2 * gamma));
    const dec = 0.006918 - 0.399912 * Math.cos(gamma) + 0.070257 * Math.sin(gamma)
        - 0.006758 * Math.cos(2 * gamma) + 0.000907 * Math.sin(2 * gamma)
        - 0.002697 * Math.cos(3 * gamma) + 0.00148 * Math.sin(3 * gamma);
    const lat = LA.latitude * Math.PI / 180;
    const hourAngle = Math.acos(Math.cos(90.833 * Math.PI / 180) / (Math.cos(lat) * Math.cos(dec)) - Math.tan(lat) * Math.tan(dec)) * 180 / Math.PI;
    const noon = 720 - 4 * LA.longitude - eq;
    return { date, sunrise: midnight + (noon - hourAngle * 4) * 60_000, sunset: midnight + (noon + hourAngle * 4) * 60_000 };
}

export function timeOfDay(now: Date, supplied?: SolarTimes): DayTime {
    const sun = supplied?.date === laClock(now).date ? supplied : solarTimes(now);
    const t = now.getTime();
    const half = 30 * 60_000;
    if (t < sun.sunrise - half) return 'night';
    if (t < sun.sunrise + half) return 'dawn';
    if (t < sun.sunset - half) return 'day';
    if (t < sun.sunset + half) return 'dusk';
    return 'night';
}

export function roomDescription(state?: WindowState) {
    const room = 'An illustrated room with a record player, a computer, a bowl of food on a small table, and an orange cat on a green rug.';
    if (!state) return `${room} Through the window it's a rainy night.`;
    const when = { dawn: 'at dawn', day: 'during the day', dusk: 'at dusk', night: 'at night' };
    return `${room} Through the window it's ${state.weather} ${when[state.time]} in Los Angeles.`;
}

export function readWeatherData(value: unknown, now = Date.now()): WeatherData | null {
    if (!value || typeof value !== 'object') return null;
    const d = value as WeatherData;
    if (![d.code, d.observedAt, d.sunrise, d.sunset].every((n) => typeof n === 'number' && Number.isFinite(n))) return null;
    if (!Number.isInteger(d.code) || typeof d.date !== 'string' || d.date !== laClock(new Date(now)).date) return null;
    if (now - d.observedAt > 2 * 3600_000 || d.observedAt - now > 10 * 60_000 || d.sunrise >= d.sunset) return null;
    if (laClock(new Date(d.sunrise)).date !== d.date || laClock(new Date(d.sunset)).date !== d.date) return null;
    return { code: d.code, observedAt: d.observedAt, date: d.date, sunrise: d.sunrise, sunset: d.sunset };
}
export function forcedWindowState(search: string, development: boolean): WindowState | null {
    if (!development) return null;
    const params = new URLSearchParams(search);
    const weather = params.get('roomWeather'), time = params.get('roomTime');
    return ['clear', 'cloudy', 'rainy'].includes(weather ?? '') && ['dawn', 'day', 'dusk', 'night'].includes(time ?? '')
        ? { weather: weather as Weather, time: time as DayTime } : null;
}
