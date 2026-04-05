import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Public Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
  });

  test('should navigate through main public pages', async ({ page }) => {
    // 1. Start at home
    await page.goto('/');
    await expect(page).toHaveTitle(/EventHub/);

    // 2. Go to Register (via CTA)
    await page.getByRole('link', { name: 'Começar Agora' }).first().click();
    await expect(page).toHaveURL(/\/auth\/register/);

    // 3. Go to Login from Register
    await page.getByRole('link', { name: 'Entre agora' }).click();
    await expect(page).toHaveURL(/\/auth\/login/);

    // 4. Check login page content (since we are now at /auth/login)
    await expect(page.getByRole('heading', { name: 'Bem-vindo de volta' })).toBeVisible();

    // 5. Go back to Home via Logo (if current page has one)
    await page.getByRole('link', { name: /EventHub/ }).first().click();
    await expect(page).toHaveURL(/\/$/);
  });
});
