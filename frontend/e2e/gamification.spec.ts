import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';

test.describe('Fluxo de Gamificação e Engajamento', () => {
  test.beforeEach(async ({ page }) => {
    await setupDefaultMocks(page);
    await injectAuth(page, {
      name: 'Thiago Participante',
      role: 'PARTICIPANT',
    });
  });

  test('deve visualizar progresso do nível e resgatar uma medalha manual', async ({ page }) => {
    // 1. Acessa o perfil para ver gamificação
    await page.goto('/profile');
    
    // 2. Verifica se o avatar exibe o nível 25 (Tier Gold - Borda Amarela)
    const levelBadge = page.getByText('Lvl 25');
    await expect(levelBadge).toBeVisible();
    
    // 3. Muda para a aba de Conquistas para ver as medalhas
    await page.getByRole('button', { name: /Conquistas/i }).click();
    
    // Verifica se a medalha 'Pioneiro' está visível (Earned)
    await expect(page.getByText('Pioneiro')).toBeVisible();
    await expect(page.getByText(/LEND/i).first()).toBeVisible();
    
    // 4. Tenta resgatar 'Caçador de Tesouros' com código INVÁLIDO
    await page.getByText('Caçador de Tesouros').click();
    await expect(page.getByText(/Resgatar Conquista/i)).toBeVisible();
    
    const claimInput = page.getByPlaceholder('CÓDIGO SECRETO');
    await claimInput.fill('BAD-CODE');
    await page.getByRole('button', { name: /Desbloquear/i }).click();
    
    // Verifica erro do toast
    await expect(page.getByText(/Código inválido/i)).toBeVisible();
    
    // 5. Resgata com código VÁLIDO (conforme mocks.ts)
    await claimInput.fill('VAL-123');
    await page.getByRole('button', { name: /Desbloquear/i }).click();
    
    // 6. Verifica Celebração (Modal de Parabéns)
    // O modal contém "Parabéns!" e o nome da medalha
    await expect(page.locator('h2', { hasText: /Parabéns/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText(/Caçador de Tesouros/i).first()).toBeVisible();
    
    // 7. Fecha modal e verifica se a medalha agora aparece como ÉPICA (desbloqueada)
    await page.getByLabel('Fechar celebração').click();
    await expect(page.getByText('Caçador de Tesouros')).toBeVisible();
    await expect(page.getByText(/ÉPICA/i).first()).toBeVisible();
  });
});
