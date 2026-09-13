import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { LicensesView } from './LicensesView';

const sbom = {
    bomFormat: 'CycloneDX',
    specVersion: '1.5',
    components: [
        {
            group: '@reduxjs',
            name: 'toolkit',
            version: '2.12.0',
            scope: 'required',
            licenses: [{ license: { id: 'MIT' } }],
        },
    ],
};

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('LicensesView', () => {
    it('renders packages and license identifiers from the SBOM', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => sbom }));

        render(<LicensesView />);

        expect(await screen.findByText('@reduxjs/toolkit')).toBeTruthy();
        expect(screen.getByText('2.12.0')).toBeTruthy();
        expect(screen.getByText('MIT')).toBeTruthy();
        expect(screen.getByText('1 packages · CycloneDX 1.5')).toBeTruthy();
    });

    it('shows an error when the SBOM cannot be loaded', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('offline')));

        render(<LicensesView />);

        await waitFor(() => {
            expect(screen.getByText('The package inventory is unavailable.')).toBeTruthy();
        });
    });
});
