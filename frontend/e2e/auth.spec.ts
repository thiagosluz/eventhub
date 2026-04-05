import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
  });

  test('should login successfully as organizer', async ({ page }) => {
    // Mock successful login API call
    // Using a more specific pattern and checking for POST method
    await page.route(url => url.pathname.endsWith('/auth/login'), async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: { id: 1, email: 'organizer@example.com', name: 'Organizer', role: 'ORGANIZER' },
            access_token: 'fake-jwt-token'
          }),
        });
      } else {
        await route.continue();
      }
    });

    // 1. Go to login page
    await page.goto('/auth/login');

    // 2. Fill the form
    await page.locator('#email').fill('organizer@example.com');
    await page.locator('#password').fill('password123');

    // 3. Submit
    await page.getByRole('button', { name: 'Entrar na Conta' }).click();

    // 4. Verify redirection to dashboard
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('should show error with invalid credentials', async ({ page }) => {
    // Mock failed login API call
    await page.route(url => url.pathname.endsWith('/auth/login'), async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Credenciais inválidas' }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/auth/login');
    await page.locator('#email').fill('wrong@example.com');
    await page.locator('#password').fill('wrongpass');
    await page.getByRole('button', { name: 'Entrar na Conta' }).click();

    // Expect error message
    // The error message in the UI might be different, let's check what it is
    // Usually it shows "Falha ao entrar" or similar
    await expect(page.getByText(/Falha ao entrar|Credenciais inválidas/)).toBeVisible();
  });
});
