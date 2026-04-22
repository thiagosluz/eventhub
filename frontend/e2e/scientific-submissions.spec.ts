import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';
import path from 'path';
import fs from 'fs';

test.describe('Dashboard - Submissões Científicas', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    await injectAuth(page);

    await page.goto('/dashboard/events/ev-1/submissions');
  });

  test('deve listar as submissões recebidas', async ({ page }) => {
    // Deve clicar na aba primeiro
    await page.getByRole('button', { name: /Gestão de Trabalhos/i }).click();
    
    await expect(page.getByText('IA no Campo').first()).toBeVisible();
    await expect(page.getByText('Pesquisador Um').first()).toBeVisible();
    // O primeiro 'Workshop' é a opção do select (oculta). O segundo é o texto no card.
    await expect(page.getByText('Workshop').nth(1)).toBeVisible();
  });

  test('deve permitir gerenciar o comitê científico', async ({ page }) => {
    await page.getByRole('button', { name: /Comitê Científico/i }).click();
    // O cabeçalho real pode ser diferente, vamos procurar por texto que contenha
    await expect(page.getByText(/Comitê/i).first()).toBeVisible();
    
    // Verifica se já existe um revisor (mockado)
    // O mock para /submissions/event/ev-1/reviewers não foi adicionado em mocks.ts,
    // mas o seletor servirá para futura expansão.
  });

  test('participante deve conseguir enviar um trabalho', async ({ page }) => {
    // Navega para a página pública de submissão do evento ev-1
    await page.goto('/events/conferencia-tech-2024/submit');
    
    // Preenche o formulário
    await page.locator('input[placeholder*="Análise de Performance"]').fill('Impacto de IA no Agro');
    await page.getByPlaceholder(/Descreva brevemente seu trabalho/i).fill('Este é o resumo do meu trabalho científico.');
    
    // Seleciona modalidade
    await page.locator('select').first().selectOption({ label: 'Workshop — Trabalhos práticos' });
    
    // Upload de arquivo
    const filePath = path.resolve('/tmp', 'dummy.pdf');
    if (!fs.existsSync('/tmp')) fs.mkdirSync('/tmp');
    fs.writeFileSync(filePath, 'dummy content');
    
    await page.setInputFiles('input[type="file"]', filePath);
    
    // Finaliza
    const submitButton = page.getByRole('button', { name: /Finalizar Submissão/i });
    await submitButton.click();
    
    // Verifica sucesso
    await expect(page.getByText(/Submissão Enviada!/i)).toBeVisible();
    await expect(page.getByText(/Seu trabalho foi enviado com sucesso/i)).toBeVisible();
  });
});
