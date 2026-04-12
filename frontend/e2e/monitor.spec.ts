import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Fluxo de Monitoramento e Check-in', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    
    // Login como Staff/Monitor
    await page.addInitScript(() => {
      localStorage.setItem('eventhub_user', JSON.stringify({
        id: 'user-staff',
        email: 'staff@eventhub.com.br',
        name: 'Staff Member',
        role: 'STAFF',
        tenantId: 'clv_tenant_hq'
      }));
      localStorage.setItem('eventhub_token', 'fake-staff-token');
    });
  });

  test('deve listar eventos monitorados e realizar check-in manual', async ({ page }) => {
    // 1. Acessa página de eventos monitorados
    await page.goto('/monitor/events');
    
    // Verifica se o evento mockado aparece
    await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
    
    // 2. Acessa o check-in do evento
    await page.getByRole('link', { name: /Acessar Check-in/i }).click();
    await expect(page).toHaveURL(/\/monitor\/events\/ev-1\/checkin/);
    
    // 3. Muda para aba Manual
    await page.getByRole('button', { name: /Manual \/ Busca/i }).click();
    
    // Busca por Alice para popular a lista (novo comportamento escalável)
    const searchInput = page.getByPlaceholder(/Busque por nome/i);
    await Promise.all([
      page.waitForResponse(res => res.url().includes('/participants') && res.status() === 200),
      searchInput.fill('Alice')
    ]);
    
    // Verifica se a Alice aparece nos resultados
    await expect(page.getByText('Alice Participant')).toBeVisible();
    
    // 4. Realiza o Check-in
    await page.getByRole('button', { name: /CHECK-IN/i }).first().click();
    
    // 5. Verifica feedback de sucesso
    await expect(page.getByText(/Check-in Sucesso!/i)).toBeVisible();
    
    // 6. Verifica se o botão mudou para "DESFAZER"
    await expect(page.getByRole('button', { name: /DESFAZER/i }).first()).toBeVisible();
  });

  test('deve permitir filtrar participantes na busca manual', async ({ page }) => {
    await page.goto('/monitor/events/ev-1/checkin');
    await page.getByRole('button', { name: /Manual \/ Busca/i }).click();
    
    const searchInput = page.getByPlaceholder(/Busque por nome/i);
    
    // Busca por algo inexistente
    await searchInput.fill('Zezinho');
    await expect(page.getByText('Nenhum participante encontrado')).toBeVisible();
    
    // Busca por Alice
    await searchInput.fill('Alice');
    await expect(page.getByText('Alice Participant')).toBeVisible();
  });
});
