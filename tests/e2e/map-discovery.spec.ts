import { expect, test } from '@playwright/test';

test('opens Discovery and recenters around a revealed skill', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Load sample' }).click();

    await page.getByRole('button', { name: 'Discovery' }).click();

    await expect(
        page.getByRole('heading', { name: 'Search Skills related to React.' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Product UI' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Release practice' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Web fundamentals' })).toBeVisible();

    await page.getByRole('button', { name: 'Expand toward Goals' }).click();
    await expect(page.getByRole('button', { name: 'Expand toward Detail' })).toBeEnabled();

    await page.getByRole('button', { name: 'Product UI' }).click();
    await expect(
        page.getByRole('heading', { name: 'Search Skills related to Product UI.' }),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'React' })).toBeVisible();
});

test('restores the sample board after a reload', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Load sample' }).click();
    await expect(page.getByRole('heading', { name: 'Ship a useful product' })).toBeVisible();

    await page.reload();

    await expect(page.getByRole('heading', { name: 'Ship a useful product' })).toBeVisible();
    await expect(page.getByText('4 in library')).toBeVisible();
});
