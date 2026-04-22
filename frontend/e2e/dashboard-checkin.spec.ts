import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';

test.describe('Dashboard - Fluxo de Check-in', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    await injectAuth(page);

    // Navega para check-in de um evento específico
    await page.goto('/dashboard/events/ev-1/operations/checkin');
  });

  test('deve carregar informações do evento e atividades', async ({ page }) => {
    await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
    
    // Abre seletor de atividades
    const activitySelect = page.getByRole('combobox');
    await expect(activitySelect).toBeVisible();
    await expect(activitySelect).toContainText('Check-in Geral do Evento');
  });

  test('deve alternar para aba manual e filtrar participantes', async ({ page }) => {
    // Clica na aba Manual
    await page.getByText('Manual / Busca').click();
    
    const searchInput = page.getByPlaceholder(/Busque por nome/i);
    
    // Busca Alice
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/participants') && res.status() === 200),
      searchInput.fill('Alice')
    ]);
    await expect(page.getByText('Alice Participant')).toBeVisible();
    
    // Busca Bob
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/participants') && res.status() === 200),
      searchInput.fill('Bob')
    ]);
    await expect(page.getByText('Bob Johnson')).toBeVisible();

    // Testa filtro - volta para Alice e garante que Bob suma
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/participants') && res.status() === 200),
      searchInput.fill('Alice')
    ]);
    
    await expect(page.getByText('Alice Participant')).toBeVisible();
    await expect(page.getByText('Bob Johnson')).not.toBeVisible();
  });

  test('deve realizar check-in manual com sucesso', async ({ page }) => {
    await page.getByText('Manual / Busca').click();
    
    // Busca participante para habilitar o carregar da lista
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/participants') && res.status() === 200),
      page.getByPlaceholder(/Busque por nome/i).fill('Alice')
    ]);
    
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
    
    // Busca participante para habilitar o carregar da lista
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/participants') && res.status() === 200),
      page.getByPlaceholder(/Busque por nome/i).fill('Bob')
    ]);
    
    // Bob Johnson já tem um attendance no mock, então deve ter botão DESFAZER
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
