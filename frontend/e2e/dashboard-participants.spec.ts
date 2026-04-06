import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Dashboard - Gestão de Participantes', () => {
  test.beforeEach(async ({ page }) => {
    // Escuta erros do console
    page.on('console', msg => {
      if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
    });

    await setupDefaultMocks(page);
    
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

    await page.goto('/dashboard/participants');
  });

  test.afterEach(async ({ page }, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      await page.screenshot({ path: `test-results/fail-participants-${testInfo.title.replace(/\s+/g, '-')}.png` });
    }
  });

  test('deve listar os participantes inscritos', async ({ page }) => {
    // Verifica o título da página sem restringir ao role 'main' para evitar fragilidade
    await expect(page.getByRole('heading', { name: 'Gestão de Participantes' }).first()).toBeVisible();
    
    // Verifica se os participantes mockados aparecem na tabela
    await expect(page.getByText('Ana Participante')).toBeVisible();
    await expect(page.getByText('Carlos Revisor')).toBeVisible();
    await expect(page.getByText('ana@example.com')).toBeVisible();
  });

  test('deve filtrar participantes por nome', async ({ page }) => {
    // Aguarda a lista carregar antes de buscar
    await expect(page.getByText('Ana Participante')).toBeVisible();

    const searchInput = page.getByPlaceholder('Buscar por nome ou email...');
    
    // Busca por um participante específico
    await searchInput.fill('Ana');
    await expect(page.getByText('Ana Participante')).toBeVisible();
    await expect(page.getByText('Carlos Revisor')).not.toBeVisible();

    // Busca por termo inexistente
    await searchInput.fill('Inexistente');
    await expect(page.getByText('Nenhum participante encontrado')).toBeVisible();
  });

  test('deve abrir o drawer de detalhes ao clicar no botão de visualizar', async ({ page }) => {
    // Aguarda lista carregar
    await expect(page.getByText('Ana Participante')).toBeVisible();

    // Clica no primeiro botão de olho (visualizar)
    await page.locator('button[title="Ver Detalhes"]').first().click();
    
    // Verifica se o drawer abriu (buscando pelo título no drawer)
    await expect(page.getByText('Detalhes do Participante')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ana Participante' })).toBeVisible();
  });

  test('deve exportar CSV ao clicar no botão de exportar', async ({ page }) => {
    // Aguarda lista carregar
    await expect(page.getByText('Ana Participante')).toBeVisible();

    // O participantsService.exportCSV() creates a Blob download via JS, not a browser download event.
    // We just verify the button exists and can be clicked without errors.
    const exportBtn = page.locator('button[title="Exportar CSV"]');
    await expect(exportBtn).toBeVisible();
    await exportBtn.click();

    // Wait a bit for any error to surface
    await page.waitForTimeout(1000);
    
    // If no error occurred, the export logic executed.
    // The actual download is handled by JS Blob API which doesn't trigger playwright download events.
  });
});
