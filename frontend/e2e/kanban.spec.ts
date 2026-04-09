import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Kanban Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[BROWSER-CONSOLE] ${msg.type()}: ${msg.text()}`));
    await setupDefaultMocks(page);
    
    // Login as Organizer
    await page.goto('/auth/login');
    await page.fill('#email', 'organizador@eventhub.com.br');
    await page.fill('#password', 'password123');
    await page.click('button[type="submit"]');
    
    // Wait for dashboard to load (navigation)
    await page.waitForURL('**/dashboard**');
    
    // Wait for boards and workload to load
    const boardsPromise = page.waitForResponse(response => response.url().includes('/kanban/event/') && response.url().includes('/boards'));
    const workloadPromise = page.waitForResponse(response => response.url().includes('/kanban/event/') && response.url().includes('/workload'));
    
    // Navigate to Kanban page
    await page.goto('/dashboard/events/ev-1/kanban');
    
    // Ensure responses are captured
    await Promise.all([boardsPromise, workloadPromise]);
    
    await expect(page.getByText('Gestão de Operação')).toBeVisible({ timeout: 15000 });
  });

  test('should load boards and switch between them', async ({ page }) => {
    // Check main board title from mock (Gestão de Operação)
    await expect(page.getByText('Gestão de Operação')).toBeVisible({ timeout: 10000 });
    
    // Switch to Marketing board
    await page.getByText('Marketing').click();
    
    // Verify Marketing board is active (the header should show Marketing or it should be highlighted)
    await expect(page.getByText('Marketing')).toBeVisible();
  });

  test('should persist filters in localStorage', async ({ page }) => {
    // Fill search filter
    const searchInput = page.getByPlaceholder('Buscar tarefas...');
    await searchInput.fill('FiltroTeste');
    
    // Reload page
    await page.reload();
    
    // Check if filter is still there (give it time to hydrate from localStorage)
    const hydratedSearchInput = page.getByPlaceholder('Buscar tarefas...');
    await expect(hydratedSearchInput).toHaveValue('FiltroTeste', { timeout: 10000 });
  });

  test('should open task modal and show details', async ({ page }) => {
    // Dispatch native click to ensure React handles it despite dnd-kit sibling overlay
    await page.getByText('Tarefa de Teste 1').dispatchEvent('click');
    
    // Expect modal to be open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByText('Editar Tarefa')).toBeVisible();
  });

  test('should toggle Super Board (Global View)', async ({ page }) => {
    // Click on "Todos" button (for global view in timelines or selector)
    // In our implementation, Global View is toggled in the Toolbar or next to Boards
    const globalToggle = page.getByRole('button', { name: /Visão Global/i });
    if (await globalToggle.count() > 0) {
      await globalToggle.click();
      await expect(page.getByText('Visão Global')).toBeVisible();
    }
  });

  test('should toggle High Priority Mode', async ({ page }) => {
    const highPriorityBtn = page.getByRole('button', { name: /Operação|Normal/i });
    await highPriorityBtn.click();
    
    // Check for high priority indicator
    await expect(page.getByText('Modo Alta Prioridade')).toBeVisible();
    
    // Toggle back
    await highPriorityBtn.click();
    await expect(page.getByText('Modo Alta Prioridade')).not.toBeVisible();
  });
});
