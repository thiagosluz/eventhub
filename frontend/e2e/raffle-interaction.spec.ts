import { test, expect } from '@playwright/test';
import { setupDefaultMocks } from './support/mocks';

test.describe('Interação em Tempo Real - Organizador vs Telão', () => {
  test('deve atualizar o telão automaticamente após o organizador realizar um sorteio', async ({ browser }) => {
    // 1. Cria um contexto compartilhado
    const sharedContext = await browser.newContext();
    
    // Configura mocks no nível do contexto
    await setupDefaultMocks(sharedContext);

    const organizerPage = await sharedContext.newPage();
    const displayPage = await sharedContext.newPage();

    // 2. Setup Auth para o Organizador (Injetando no contexto/páginas)
    const token = 'fake-jwt-token';
    const user = { id: 'clv_user_thiago', name: 'Thiago Organizador', role: 'ORGANIZER', tenantId: 'clv_tenant_hq' };
    
    await sharedContext.addCookies([{ name: 'eventhub_token', value: token, domain: 'localhost', path: '/' }]);
    
    // Injeta auth no localStorage para ambas as páginas (embora só o organizador precise, o telão é público)
    const initScript = ({ token, user }: { token: string, user: any }) => {
      window.localStorage.setItem('eventhub_token', token);
      window.localStorage.setItem('eventhub_user', JSON.stringify(user));
    };
    
    await organizerPage.addInitScript(initScript, { token, user });

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
    const longTimeout = 15000;

    // Verifica o vencedor final diretamente (mais robusto que a animação rápida)
    // O polling do telão detectará o estado 'latestRaffle' automaticamente.
    await expect(displayPage.getByText('Sortudo')).toBeVisible({ timeout: longTimeout });
    await expect(displayPage.getByText(/MacBook Pro M3/i)).toBeVisible({ timeout: longTimeout });

    // Verifica se os confetes dispararam (indiretamente, o estado de spinning deve ter passado)
    await expect(displayPage.getByText(/PREPARANDO O RESULTADO.../i)).not.toBeVisible();

    await sharedContext.close();
  });
});
