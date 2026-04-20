import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Public Feedback Flow', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    
    // Mock public activity info
    await page.route(url => url.pathname.includes('/public/activities/act-123/feedback-info'), async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'act-123',
          title: 'Palestra de Teste E2E',
          eventName: 'Evento Teste',
          tenantName: 'Empresa Teste',
          speakers: [{ name: 'Palestrante 1' }]
        }),
      });
    });

    // Mock feedback submission
    await page.route(url => url.pathname.includes('/public/activities/act-123/feedbacks'), async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ success: true }),
        });
      } else {
        await route.continue();
      }
    });
  });

  test('should submit feedback successfully', async ({ page }) => {
    // 1. Go to the public feedback page
    await page.goto('/f/act-123');

    // 2. Verify activity info is displayed
    await expect(page.getByText('Palestra de Teste E2E')).toBeVisible();
    await expect(page.getByText('Evento Teste')).toBeVisible();

    // 2.1. Check for share button
    const shareBtn = page.getByTitle('Compartilhar');
    await expect(shareBtn).toBeVisible();
    await shareBtn.click(); // Should at least copy to clipboard in headless environment

    // 3. Select 5 stars
    // The stars are buttons. We can click the 5th star.
    const stars = page.locator('button > svg');
    await stars.nth(4).click();

    // 4. Fill comment
    await page.locator('textarea').fill('Excelente apresentação!');

    // 5. Submit
    await page.getByRole('button', { name: 'Enviar Avaliação' }).click();

    // 6. Verify success screen
    await expect(page.getByText('Obrigado!')).toBeVisible();
    await expect(page.getByText('Sua avaliação foi enviada')).toBeVisible();
  });

  test('should show error if rating is missing', async ({ page }) => {
    await page.goto('/f/act-123');
    
    // Submit without selecting stars
    await page.getByRole('button', { name: 'Enviar Avaliação' }).click();

    // Verify toast error (mocking toast or just checking for text)
    // react-hot-toast usually renders a div with role="status"
    await expect(page.getByText('Por favor, selecione uma nota')).toBeVisible();
  });
});
