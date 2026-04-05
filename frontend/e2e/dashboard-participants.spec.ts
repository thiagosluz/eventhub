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
    // Alvo: O título h1 dentro do main para evitar ambiguidade com outros cabeçalhos
    await expect(page.getByRole('main').getByRole('heading', { name: 'Gestão de Participantes' })).toBeVisible();
    
    // Verifica se os participantes mockados aparecem na tabela
    await expect(page.getByText('Ana Participante')).toBeVisible();
    await expect(page.getByText('Carlos Revisor')).toBeVisible();
    await expect(page.getByText('ana@example.com')).toBeVisible();
  });

  test('deve filtrar participantes por nome', async ({ page }) => {
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
    // Clica no primeiro botão de olho (visualizar)
    await page.locator('button[title="Ver Detalhes"]').first().click();
    
    // Verifica se o drawer abriu (buscando pelo título no drawer)
    await expect(page.getByText('Detalhes do Participante')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Ana Participante' })).toBeVisible();
  });

  test('deve disparar o download do CSV ao clicar no botão de exportar', async ({ page }) => {
    // Prepara para capturar o download
    const downloadPromise = page.waitForEvent('download');
    
    // Clica no botão de exportar (o primeiro botão no header após o link de novo evento não, aqui é o botão ArrowDownTrayIcon)
    await page.locator('button[title="Exportar CSV"]').click();
    
    const download = await downloadPromise;
    
    // Verifica o nome do arquivo sugerido
    expect(download.suggestedFilename()).toBe('participantes.csv');
  });
});
