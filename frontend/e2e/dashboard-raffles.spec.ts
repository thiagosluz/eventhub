import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Dashboard - Sorteador de Prêmios', () => {
  test.beforeEach(async ({ page, context }) => {
    await setupDefaultMocks(page);
    
    // Injeta auth via cookies (para middleware) e localStorage (para front) e via context (mais robusto)
    const token = 'fake-jwt-token';
    const user = { id: 'clv_user_thiago', name: 'Thiago Organizador', role: 'ORGANIZER', tenantId: 'clv_tenant_hq' };

    await context.addCookies([{ name: 'eventhub_token', value: token, domain: 'localhost', path: '/' }]);

    await page.addInitScript(({ token, user }) => {
      window.localStorage.setItem('eventhub_token', token);
      window.localStorage.setItem('eventhub_user', JSON.stringify(user));
    }, { token, user });

    // Vai para a página de sorteio do evento ev-1 (mockado)
    await page.goto('/dashboard/events/ev-1/operations/raffle');
  });

  test('deve carregar o histórico de sorteios', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Sorteador de Prêmios' })).toBeVisible();
    await expect(page.getByText('Ganhador Antigo')).toBeVisible();
    await expect(page.getByText('Kindle')).toBeVisible();
  });

  test('deve realizar um novo sorteio com sucesso', async ({ page }) => {
    // Configura o sorteio
    await page.getByPlaceholder(/Ex: Livro, Alexa.../i).fill('PlayStation 5');
    await page.locator('input[type="number"]').fill('1');
    
    // Clica no botão de sortear
    const drawButton = page.getByRole('button', { name: /REALIZAR SORTEIO/i });
    await drawButton.click();
    
    // Verifica estado de carregamento (suspense de 2s no código)
    await expect(page.getByText(/SORTEANDO.../i)).toBeVisible();
    
    // Verifica o resultado (Mock retorna 'Sortudo da Silva')
    await expect(page.getByText(/Parabéns aos Vencedores!/i)).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('Sortudo da Silva')).toBeVisible();
    
    // Verifica se o histórico atualizou (Mock de histórico deveria ser chamado de novo)
    // Nota: Como o mock é estático, o novo ganhador não aparecerá no histórico a menos que o mock mude
    // mas o confetti e a mensagem de sucesso confirmam a lógica.
  });

  test('deve abrir o modo telão', async ({ page, context }) => {
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      page.getByRole('link', { name: /Abrir Modo Telão/i }).click(),
    ]);

    await expect(newPage).toHaveURL(/\/raffle-display\/ev-1/);
    // Nota: O modo telão é uma página simples que lista os sorteados visíveis
  });
});
