import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Perfil do Usuário', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    
    await page.addInitScript(() => {
      window.localStorage.setItem('eventhub_user', JSON.stringify({
        id: 'clv_user_thiago',
        email: 'organizador@eventhub.com.br',
        name: 'Thiago Silva',
        role: 'ORGANIZER',
        tenantId: 'clv_tenant_hq'
      }));
      window.localStorage.setItem('eventhub_token', 'fake-token-e2e');
    });

    await page.goto('/dashboard/profile');
  });

  test('deve permitir atualizar nome e biografia', async ({ page }) => {
    // Verifica dados iniciais (vêm do mock de setupDefaultMocks)
    await expect(page.locator('#full-name')).toHaveValue('Thiago Organizador');
    
    // Altera nome
    await page.locator('#full-name').fill('Thiago Silva');
    
    // Altera bio
    await page.locator('#bio').fill('Especialista em eventos científicos e tecnologia.');

    // Salva
    await page.getByRole('button', { name: /Salvar Alterações/i }).click();

    // Valida toast de sucesso
    await expect(page.getByText('Perfil atualizado com sucesso!')).toBeVisible();
  });

  test('deve permitir alterar a senha', async ({ page }) => {
    await page.getByLabel('Senha Atual').fill('senha-antiga');
    await page.getByLabel('Nova Senha', { exact: true }).fill('senha-nova');
    await page.getByLabel('Confirmar Nova Senha').fill('senha-nova');

    await page.getByRole('button', { name: /Atualizar Senha/i }).click();

    await expect(page.getByText('Senha alterada com sucesso!')).toBeVisible();
  });
});
