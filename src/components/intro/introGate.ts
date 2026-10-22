export const INTRO_STORAGE_KEY = 'introSeen';

// Set on window by IntroGlobe once its animation actually starts.
export const INTRO_STARTED_FLAG = '__introStarted';

// If the page JS hasn't started the intro by then (slow network), drop it rather than hold a dark screen.
export const INTRO_START_DEADLINE_MS = 2000;

// Runs inline in <head> before first paint. Marks <html data-intro="play"> when the intro should show:
// first visit this session, tab in the foreground, and no reduced-motion preference.
// Any storage error means skip it.
export const INTRO_GATE_SCRIPT = `(function () {
    try {
        if (document.visibilityState !== 'visible') return;
        var s = window.sessionStorage;
        if (s.getItem('${INTRO_STORAGE_KEY}')) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        s.setItem('${INTRO_STORAGE_KEY}', '1');
        document.documentElement.dataset.intro = 'play';
        window.setTimeout(function () {
            if (!window['${INTRO_STARTED_FLAG}']) delete document.documentElement.dataset.intro;
        }, ${INTRO_START_DEADLINE_MS});
    } catch (e) {}
})();`;
