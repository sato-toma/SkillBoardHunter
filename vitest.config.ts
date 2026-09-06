import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: false,
        environment: 'jsdom',
        exclude: ['tests/e2e/**'],
        include: ['src/**/*.{test,spec}.{ts,tsx}'],
        setupFiles: ['./tests/setup.ts'],
    },
});
