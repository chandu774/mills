import '@testing-library/jest-dom';

// Isolate unit tests from live external network Supabase credentials
(import.meta.env as any).VITE_SUPABASE_URL = '';
(import.meta.env as any).VITE_SUPABASE_ANON_KEY = '';

// Mock window.matchMedia if not present in test environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
