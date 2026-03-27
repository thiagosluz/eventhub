import { test, expect } from '@playwright/test';

test('landing page has title and CTA', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/EventHub/);

  // Check for the main heading
  await expect(page.getByText('Simplifique a gestão do seu próximo evento.')).toBeVisible();

  // Check for the CTA button
  await expect(page.getByRole('link', { name: 'Começar Agora Gratuitamente' })).toBeVisible();
});
