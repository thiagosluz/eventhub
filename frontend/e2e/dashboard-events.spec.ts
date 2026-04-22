import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';

test.describe('Dashboard - Gerenciamento de Eventos', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });

    await setupDefaultMocks(page);
    await injectAuth(page);

    page.on('requestfailed', request => {
      console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
    });

    // 3. Navega para a página de eventos do dashboard
    await page.goto('/dashboard/events');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ path: `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png` });
    }
  });

  test('deve listar os eventos do organizador', async ({ page }) => {
    // Verifica se o título da página está presente
    await expect(page.getByRole('heading', { name: 'Meus Eventos' })).toBeVisible();

    // Verifica se os eventos mockados estão aparecendo
    // O mock padrão em mocks.ts retorna 'Conferência Tech 2024'
    await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
    await expect(page.getByText('São Paulo, SP')).toBeVisible();
  });

  test('deve filtrar eventos pelo nome', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar eventos por nome ou local...');
    
    // 1. Espera a lista inicial carregar
    await expect(page.getByText('Conferência Tech 2024')).toBeVisible();

    // 2. Busca por um termo que existe
    await searchInput.fill('Tech');
    await expect(page.getByText('Conferência Tech 2024')).toBeVisible();

    // 3. Busca por um termo que NÃO existe
    await searchInput.fill('Evento Inexistente');
    await expect(page.getByText('Nenhum evento encontrado')).toBeVisible();
  });

  test('deve navegar para a página de criação de evento', async ({ page }) => {
    // Usa o link dentro do conteúdo principal (main) para evitar duplicidade com a Sidebar
    await page.getByRole('main').getByRole('link', { name: 'Criar Novo Evento' }).click();
    await expect(page).toHaveURL(/\/dashboard\/events\/new/);
  });
});
