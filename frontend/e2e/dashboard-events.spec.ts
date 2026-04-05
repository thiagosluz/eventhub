import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Dashboard - Gerenciamento de Eventos', () => {
  test.beforeEach(async ({ page }) => {
    // Escuta erros do console
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });
    
    // Escuta requisições para depuração
    await setupDefaultMocks(page);
    
    // 2. Injeta token de autenticação diretamente para pular o login em todos os testes
    await page.addInitScript(() => {
      const token = 'fake-jwt-token';
      const user = {
        id: 'clv_user_thiago',
        name: 'Thiago Organizador',
        email: 'organizador@eventhub.com.br',
        role: 'ORGANIZER',
        tenantId: 'clv_tenant_hq'
      };
      
      window.localStorage.setItem('eventhub_token', token);
      window.localStorage.setItem('eventhub_user', JSON.stringify(user));
      
      // Injeta cookie para o Middleware do Next.js
      document.cookie = `eventhub_token=${token}; path=/`;
    });

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
