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

test('creates a link by dragging a node port to another node', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Load sample' }).click();
    await page.getByRole('button', { name: 'Edit links' }).click();

    const source = page.locator('.skill-map-node-wrap').filter({ hasText: 'React' });
    const target = page.locator('.skill-map-node-wrap').filter({ hasText: 'Web fundamentals' });
    const sourcePort = source.getByTitle('Drag to create a link');
    const sourceBox = await sourcePort.boundingBox();
    const sourceNodeBox = await source.locator('.skill-map-node').boundingBox();
    const targetBox = await target.locator('.skill-map-node').boundingBox();
    if (!sourceBox || !sourceNodeBox || !targetBox)
        throw new Error('Link drag targets are not visible');
    const sourcePortBox = await sourcePort.boundingBox();
    if (!sourcePortBox) throw new Error('Link port is not visible');
    expect(
        Math.abs(sourcePortBox.x + sourcePortBox.width / 2 - sourceNodeBox.x - sourceNodeBox.width),
    ).toBeLessThan(2);

    const lineCountBefore = await page.locator('.skill-map-edges line').count();
    await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2);
    await page.mouse.up();

    await expect(page.locator('.skill-map-edges line')).toHaveCount(lineCountBefore + 1);
});
