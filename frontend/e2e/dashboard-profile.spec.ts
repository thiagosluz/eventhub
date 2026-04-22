import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';

test.describe('Dashboard - Perfil do Usuário', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    await injectAuth(page);

    await page.goto('/dashboard/profile');
  });

  test('deve carregar os dados atuais do perfil', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Meu Perfil' })).toBeVisible();
    
    // Verifica se os inputs estão preenchidos com os dados do mock (setupDefaultMocks/users/me)
    await expect(page.locator('input[type="text"]').first()).toHaveValue('Thiago Organizador');
    await expect(page.locator('input[type="email"]')).toHaveValue('organizador@eventhub.com.br');
  });

  test('deve atualizar o nome e a bio do perfil', async ({ page }) => {
    const nameInput = page.locator('input[type="text"]').first();
    const bioTextarea = page.locator('textarea');
    const saveButton = page.getByRole('button', { name: 'Salvar Alterações' });

    await nameInput.fill('Thiago Atualizado');
    await bioTextarea.fill('Minha bio atualizada para testes E2E.');
    await saveButton.click();

    // Verifica o toast de sucesso
    await expect(page.getByText('Perfil atualizado com sucesso!')).toBeVisible();
  });

  test('deve alterar a senha com sucesso', async ({ page }) => {
    const currentPass = page.locator('input[type="password"]').nth(0);
    const newPass = page.locator('input[type="password"]').nth(1);
    const confirmPass = page.locator('input[type="password"]').nth(2);
    const updateButton = page.getByRole('button', { name: 'Atualizar Senha' });

    await currentPass.fill('senha-atual');
    await newPass.fill('nova-senha-123');
    await confirmPass.fill('nova-senha-123');
    await updateButton.click();

    // Verifica o toast de sucesso
    await expect(page.getByText('Senha alterada com sucesso!')).toBeVisible();
    
    // Verifica se os campos foram limpos
    await expect(currentPass).toHaveValue('');
  });

  test('deve mostrar erro se as senhas não coincidirem', async ({ page }) => {
    const currentPass = page.locator('input[type="password"]').nth(0);
    const newPass = page.locator('input[type="password"]').nth(1);
    const confirmPass = page.locator('input[type="password"]').nth(2);
    const updateButton = page.getByRole('button', { name: 'Atualizar Senha' });

    await currentPass.fill('senha-atual');
    await newPass.fill('nova-senha-123');
    await confirmPass.fill('outra-senha');
    await updateButton.click();

    // Verifica o toast de erro (vê se o texto aparece)
    await expect(page.getByText('As senhas não coincidem.')).toBeVisible();
  });
});
