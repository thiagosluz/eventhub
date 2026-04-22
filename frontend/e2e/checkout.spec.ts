import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';

test.describe('Página de Checkout - Inscrição em Evento', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    await injectAuth(page);
  });

  test('deve validar campos obrigatórios no formulário de inscrição', async ({ page }) => {
    // 1. Acessa página de checkout diretamente (para evitar 404 no SSR do detalhe do evento)
    await page.goto('/checkout?slug=conferencia-tech-2024&eventId=ev-1');
    
    // 2. Step 1: Identificação (deve mostrar dados do usuário)
    await expect(page.getByText(/Confirme seus Dados/i)).toBeVisible();
    await page.getByRole('button', { name: /Prosseguir/i }).click();
    
    // 4. Step 2: Formulário Adicional (com campos obrigatórios)
    await expect(page.getByText(/Formulário Adicional/i)).toBeVisible();
    
    // Tenta prosseguir sem preencher nada
    await page.getByRole('button', { name: /Revisar Pedido/i }).click();
    
    // Verifica mensagens de erro
    await expect(page.getByText(/Este campo é obrigatório/i)).toHaveCount(2); // Empresa e "Como soube..."
    await expect(page.getByText(/Por favor, preencha todos os campos obrigatórios/i)).toBeVisible();
    
    // Preenche apenas um e tenta novamente
    await page.getByPlaceholder(/Digite seu empresa/i).fill('Google');
    await page.getByRole('button', { name: /Revisar Pedido/i }).click();
    
    // Ainda deve mostrar erro no segundo campo obrigatório
    await expect(page.getByText(/Este campo é obrigatório/i)).toHaveCount(1);
  });

  test('deve completar o checkout com sucesso em evento gratuito', async ({ page }) => {
    // 1. Inicia fluxo diretamente no checkout
    await page.goto('/checkout?slug=conferencia-tech-2024&eventId=ev-1');
    
    // 2. Step 1: Prosseguir
    await page.getByRole('button', { name: /Prosseguir/i }).click();
    
    // 3. Step 2: Preencher formulário
    await page.getByPlaceholder(/Digite seu empresa/i).fill('EventHub Labs');
    
    // Seleciona opção no Select
    await page.getByRole('combobox').selectOption('LinkedIn');
    
    await page.getByRole('button', { name: /Revisar Pedido/i }).click();
    
    // 4. Step 3: Revisão e Finalização
    await expect(page.getByText(/Tudo Pronto\?/i)).toBeVisible();
    await expect(page.getByText(/Total/i)).toBeVisible();
    await expect(page.getByText(/R\$ 0,00/i)).toHaveCount(2); // Preço e Total no resumo
    
    // Finaliza
    const responsePromise = page.waitForResponse(resp => resp.url().includes('/checkout') && resp.status() === 201);
    await page.getByRole('button', { name: /Finalizar Inscrição/i }).click();
    await responsePromise;
    
    // 5. Verifica página de sucesso
    await expect(page).toHaveURL(/\/checkout\/success/);
    await expect(page.getByText(/Inscrição Confirmada!/i)).toBeVisible();
    await expect(page.getByText(/Sua vaga está garantida/i)).toBeVisible();
  });
});
