import { action, Action } from 'easy-peasy';

export type ThemeMode = 'dark' | 'light';

const STORAGE_KEY = 'luna::theme';

const getInitialMode = (): ThemeMode => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored === 'light' || stored === 'dark') {
            return stored;
        }
    } catch (e) {
        // Ignore storage access errors (e.g. privacy mode).
    }
    return 'dark';
};

export const applyTheme = (mode: ThemeMode) => {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    root.classList.toggle('luna-light', mode === 'light');
    root.classList.toggle('luna-dark', mode === 'dark');
    root.setAttribute('data-theme', mode);
};

export interface ThemeStore {
    mode: ThemeMode;
    setMode: Action<ThemeStore, ThemeMode>;
    toggle: Action<ThemeStore>;
}

const theme: ThemeStore = {
    mode: getInitialMode(),
    setMode: action((state, payload) => {
        state.mode = payload;
        try {
            localStorage.setItem(STORAGE_KEY, payload);
        } catch (e) {
            // no-op
        }
        applyTheme(payload);
    }),
    toggle: action((state) => {
        const next: ThemeMode = state.mode === 'dark' ? 'light' : 'dark';
        state.mode = next;
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {
            // no-op
        }
        applyTheme(next);
    }),
};

export default theme;
