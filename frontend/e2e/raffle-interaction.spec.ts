import { test, expect } from '@playwright/test';
import { setupDefaultMocks, injectAuth } from './support/mocks';

test.describe('Interação em Tempo Real - Organizador vs Telão', () => {
  test('deve atualizar o telão automaticamente após o organizador realizar um sorteio', async ({ browser }) => {
    const sharedContext = await browser.newContext();

    await setupDefaultMocks(sharedContext);

    const organizerPage = await sharedContext.newPage();
    const displayPage = await sharedContext.newPage();

    await injectAuth(organizerPage);

    // 3. Navega para as páginas
    await organizerPage.goto('/dashboard/events/ev-1/operations/raffle');
    await displayPage.goto('/raffle-display/ev-1');

    // 4. Verifica estados iniciais
    await expect(organizerPage.getByRole('heading', { name: 'Sorteador de Prêmios' })).toBeVisible();
    await expect(displayPage.getByText(/Aguardando sorteio.../i)).toBeVisible();

    // 5. Organizador Realiza o Sorteio
    await organizerPage.getByPlaceholder(/Ex: Livro, Alexa.../i).fill('MacBook Pro M3');
    await organizerPage.locator('input[type="number"]').fill('1');
    
    // Clica e dispara o sorteio
    await organizerPage.getByRole('button', { name: /REALIZAR SORTEIO/i }).click();

    // 6. VALIDAÇÃO NO TELÃO (Sem recarregar a página)
    
    // Captura logs do navegador para depuração se falhar
    displayPage.on('console', msg => console.log(`[BROWSER-DISPLAY] ${msg.text()}`));
    organizerPage.on('console', msg => console.log(`[BROWSER-ORGANIZER] ${msg.text()}`));

    // Aumentamos o timeout para esperar o polling (3s) + animação (4.5s)
    const longTimeout = 20000;

    // Captura o estado do telão
    await expect(displayPage.getByText(/MacBook Pro M3/i)).toBeVisible({ timeout: longTimeout });
    await expect(displayPage.getByText('Ana')).toBeVisible({ timeout: longTimeout });

    // Verifica se a animação completou (o texto de preparo desaparece)
    await expect(displayPage.getByText(/Aguardando/i)).not.toBeVisible({ timeout: longTimeout });

    await sharedContext.close();
  });
});
