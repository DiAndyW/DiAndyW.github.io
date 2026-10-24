'use client';

import { useEffect, useState } from 'react';
import { forcedWindowState, readWeatherData, timeOfDay, weatherPreset, WEATHER_REFRESH_MS, type WeatherData, type WindowState } from './weather';

export function useRoomWeather(): WindowState {
    const [state, setState] = useState<WindowState>(() => ({ weather: 'rainy', time: timeOfDay(new Date()) }));
    useEffect(() => {
        const forced = forcedWindowState(window.location.search, process.env.NODE_ENV === 'development');
        if (forced) { setState(forced); return; }
        let live = true;
        let data: WeatherData | null = null;
        let requestedAt = -Infinity;
        let pending = false;
        let controller: AbortController | null = null;
        const tick = () => {
            const now = new Date();
            const usable = readWeatherData(data, now.getTime());
            const next: WindowState = { weather: usable ? weatherPreset(usable.code) : 'rainy', time: timeOfDay(now, usable ?? undefined) };
            if (live) setState((old) => old.weather === next.weather && old.time === next.time ? old : next);
        };
        const refresh = async () => {
            if (pending || document.visibilityState === 'hidden') return;
            pending = true;
            requestedAt = Date.now();
            controller = new AbortController();
            const timeout = window.setTimeout(() => controller?.abort(), 10_000);
            try {
                const res = await fetch('/api/weather', { signal: controller.signal, cache: 'no-store' });
                const next = res.ok ? readWeatherData(await res.json()) : null;
                if (live) data = next;
            } catch {
                if (live) data = null;
            } finally {
                clearTimeout(timeout);
                pending = false;
                if (live) tick();
            }
        };
        const onReturn = () => {
            if (document.visibilityState === 'hidden') return;
            tick();
            if (Date.now() - requestedAt >= WEATHER_REFRESH_MS) void refresh();
        };
        tick();
        void refresh();
        const clock = window.setInterval(tick, 1000);
        const weather = window.setInterval(() => void refresh(), WEATHER_REFRESH_MS);
        document.addEventListener('visibilitychange', onReturn);
        window.addEventListener('focus', onReturn);
        return () => {
            live = false;
            controller?.abort();
            clearInterval(clock); clearInterval(weather);
            document.removeEventListener('visibilitychange', onReturn);
            window.removeEventListener('focus', onReturn);
        };
    }, []);
    return state;
}
