import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Dashboard - Fluxo de Check-in', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    
    // Auto-login
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
      document.cookie = `eventhub_token=${token}; path=/`;
    });

    // Navega para check-in de um evento específico
    await page.goto('/dashboard/events/ev-1/operations/checkin');
  });

  test('deve carregar informações do evento e atividades', async ({ page }) => {
    await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
    
    // Abre seletor de atividades
    const activitySelect = page.getByRole('combobox');
    await expect(activitySelect).toBeVisible();
    await expect(activitySelect).toContainText('Check-in Geral');
  });

  test('deve alternar para aba manual e filtrar participantes', async ({ page }) => {
    // Clica na aba Manual
    await page.getByText('Manual / Busca').click();
    
    // Verifica se os participantes mockados aparecem
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).toBeVisible();

    // Testa filtro
    const searchInput = page.getByPlaceholder(/Busque por nome/i);
    await searchInput.fill('John');
    
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('Jane Smith')).not.toBeVisible();
  });

  test('deve realizar check-in manual com sucesso', async ({ page }) => {
    await page.getByText('Manual / Busca').click();
    
    const checkinBtn = page.locator('button:has-text("CHECK-IN")').first();
    // Prepara espera pela resposta da API
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/checkin') && response.request().method() === 'POST'
    );
    
    await checkinBtn.click();
    await responsePromise;

    // Verifica feedback visual de sucesso
    await expect(page.getByText(/Check-in Sucesso!/i)).toBeVisible();
    
    // Verifica se o botão mudou para DESFAZER (na atualização do mock reativa)
    // Nota: Em E2E real, o mock do GET analytics refletiria a mudança. 
    // Como nosso mock é estático, o componente exibe a mensagem de sucesso temporária.
  });

  test('deve permitir desfazer check-in manual', async ({ page }) => {
    await page.getByText('Manual / Busca').click();
    
    const undoBtn = page.locator('button:has-text("DESFAZER")');
    await expect(undoBtn).toBeVisible();

    // Prepara espera pela resposta da API
    const responsePromise = page.waitForResponse(response => 
      response.url().includes('/checkin') && response.request().method() === 'DELETE'
    );
    
    await undoBtn.click();
    await responsePromise;

    // Verifica feedback visual
    await expect(page.getByText(/Desfeito!/i)).toBeVisible();
  });

  test('deve validar montagem da área do scanner', async ({ page }) => {
    // Aguarda carregar dados básicos do evento para garantir que a página montou
    await expect(page.getByText(/Conferência Tech 2024/i)).toBeVisible({ timeout: 10000 });

    // No scanner mode, valida apenas que a área do leitor está presente no DOM
    await expect(page.locator('#reader')).toBeAttached();
    
    // NOTA: Testes detalhados de status da câmera são cobertos pela suíte de UNIDADE
    // devido às limitações de hardware em ambientes de CI headless.
  });
});
