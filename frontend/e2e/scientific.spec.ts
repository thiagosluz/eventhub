import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Fluxo Científico (Submissões e Revisões)', () => {
  test.beforeEach(async ({ page }) => {
    // Mock de autenticação e dados básicos
    await setupDefaultMocks(page);
    
    // Injeta o estado de autenticação no localStorage antes da navegação
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
    
    // Caminho para a página de submissões do evento
    await page.goto('/dashboard/events/ev-1/submissions');
  });

  test('deve permitir gerenciar o comitê científico (Adicionar/Remover Revisor)', async ({ page }) => {
    // Navega para a aba de Comitê
    await page.getByRole('button', { name: /Comitê Científico/i }).click();
    await page.waitForLoadState('networkidle');

    // Verifica se os revisores do tenant aparecem para adicionar (João Disponível deve estar no mock)
    await expect(page.getByText('João Disponível')).toBeVisible();

    // Adiciona revisor
    const addBtn = page.locator('button[title="Adicionar ao Comitê"]').first();
    await addBtn.click();

    // Valida toast de sucesso
    await expect(page.getByText('Revisor adicionado ao comitê!')).toBeVisible();
  });

  test('deve permitir atribuir um revisor a uma submissão', async ({ page }) => {
    // Navega para a aba de Trabalhos
    await page.getByRole('button', { name: /Gestão de Trabalhos/i }).click();
    await page.waitForLoadState('networkidle');

    // Verifica se a submissão mockada aparece
    const submissionCard = page.locator('.premium-card', { hasText: 'IA no Campo' });
    await expect(submissionCard).toBeVisible({ timeout: 10000 });

    // Abre o select de adicionar revisor dentro do card específico
    const select = submissionCard.locator('select');
    await select.selectOption({ label: 'Revisor Alpha' });

    // Valida toast de sucesso
    await expect(page.getByText('Revisor atribuído!')).toBeVisible();
  });

  test('deve permitir ao revisor avaliar um trabalho', async ({ page }) => {
    await page.goto('/dashboard/reviews');

    // Verifica se o trabalho designado aparece
    await expect(page.getByText('IA no Campo')).toBeVisible();

    // Clica em Avaliar
    await page.getByRole('button', { name: /Avaliar/i }).click();

    // Preenche o formulário de avaliação
    const stars = page.locator('button > svg').nth(4); // 5ª estrela
    await stars.click();

    // Seleciona recomendação "Aceite" (exato)
    await page.getByRole('button', { name: 'Aceite', exact: true }).click();

    // Escreve comentários
    await page.getByPlaceholder(/feedback construtivo/i).fill('Excelente trabalho, parabéns!');

    // Envia
    await page.getByRole('button', { name: /Confirmar Avaliação/i }).click();

    // Valida sucesso
    await expect(page.getByText('Revisão Enviada!')).toBeVisible();
  });
});

test.describe('Submissão de Trabalho (Autor)', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    
    await page.addInitScript(() => {
      window.localStorage.setItem('eventhub_user', JSON.stringify({
        id: 'clv_user_thiago',
        email: 'autor@eventhub.com.br',
        name: 'Autor de Teste',
        role: 'USER',
        tenantId: 'clv_tenant_hq'
      }));
      window.localStorage.setItem('eventhub_token', 'fake-token-e2e');
    });
  });

  test('deve permitir realizar a submissão de um arquivo PDF', async ({ page }) => {
    await page.goto('/events/conferencia-tech-2024/submit');

    // Preenche formulário
    await page.getByLabel('Título do Trabalho').fill('Meu Artigo Científico');
    await page.getByLabel('Resumo / Abstract').fill('Este é um resumo do meu artigo científico sobre IA.');
    
    // Seleciona modalidade e área
    await page.getByLabel('Modalidade').selectOption({ label: 'Workshop — Trabalhos práticos' });
    await page.getByLabel('Área Temática').selectOption({ label: 'Inteligência Artificial' });

    // Upload de arquivo
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'artigo.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content'),
    });

    // Submete
    await page.getByRole('button', { name: /Finalizar Submissão/i }).click();

    // Valida redirecionamento ou mensagem de sucesso
    await expect(page.getByText(/Submissão enviada/i)).toBeVisible();
  });
});
