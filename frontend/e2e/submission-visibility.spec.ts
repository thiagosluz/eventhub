import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Submission Visibility', () => {
  test.beforeEach(async ({ page, context }) => {
    // Inject auth token to skip login flow
    const token = 'fake-jwt-token';
    const user = { id: 'clv_user_thiago', name: 'Thiago Organizador', role: 'ORGANIZER', tenantId: 'clv_tenant_hq' };

    await context.addCookies([{ name: 'eventhub_token', value: token, domain: 'localhost', path: '/' }]);

    await page.addInitScript(({ token, user }) => {
      window.localStorage.setItem('eventhub_token', token);
      window.localStorage.setItem('eventhub_user', JSON.stringify(user));
    }, { token, user });
  });

  test('should show submission form when submissions are enabled', async ({ page }) => {
    await setupDefaultMocks(page);

    // Navigate to the submit page (client component, mocks apply)
    await page.goto('/events/conferencia-tech-2024/submit');

    // The mock returns submissionsEnabled: true with valid dates
    await expect(page.getByRole('heading', { name: /Submissão de Trabalho/i })).toBeVisible();
  });

  test('should block submission form when submissions are disabled', async ({ page }) => {
    // Setup default mocks FIRST
    await setupDefaultMocks(page);

    // Then override the public event endpoint AFTER - Playwright uses LIFO (last registered wins)
    await page.route(url => url.pathname.includes('/public/events/'), async (route) => {
      const request = route.request();
      const acceptHeader = request.headers()['accept'] || '';
      if (acceptHeader.includes('text/html') || request.headers()['rsc']) {
        return route.continue();
      }
      if (request.method() !== 'GET') {
        return route.continue();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'ev-1',
          name: 'Conferência Tech 2024',
          slug: 'conferencia-tech-2024',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          location: 'São Paulo, SP',
          status: 'PUBLISHED',
          submissionsEnabled: false,
          submissionStartDate: null,
          submissionEndDate: null,
          submissionModalities: [],
          thematicAreas: [],
          submissionRules: [],
          forms: [],
          themeConfig: null,
          tenant: { themeConfig: null }
        }),
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
        }
      });
    });

    await page.goto('/events/conferencia-tech-2024/submit');

    // Should show disabled message
    await expect(page.getByRole('heading', { name: /Submissões Desativadas/i })).toBeVisible();
  });

  test('should show submissions config in dashboard', async ({ page }) => {
    await setupDefaultMocks(page);

    // Navigate to submission management in dashboard
    await page.goto('/dashboard/events/ev-1/submissions');

    // Click on the Configuration tab (use exact match to avoid "Salvar Configuração")
    await page.getByRole('button', { name: 'Configuração', exact: true }).click();

    // Should see the submissions configuration section
    await expect(page.getByText(/Módulo de Submissões|Habilitar Submissões/i)).toBeVisible();
  });
});
