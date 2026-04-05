# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-events.spec.ts >> Dashboard - Gerenciamento de Eventos >> deve listar os eventos do organizador
- Location: e2e/dashboard-events.spec.ts:24:7

# Error details

```
Error: page.goto: Test ended.
Call log:
  - navigating to "http://localhost:3000/dashboard/events", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { setupDefaultMocks } from './support/mocks';
  3  | 
  4  | test.describe('Dashboard - Gerenciamento de Eventos', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Escuta erros do console
  7  |     page.on('console', msg => {
  8  |       if (msg.type() === 'error') console.log(`[BROWSER ERROR] ${msg.text()}`);
  9  |     });
  10 |     
  11 |     // Escuta requisições para depuração
  12 |     await setupDefaultMocks(page);
  13 |     
  14 |     // 2. Injeta token de autenticação diretamente para pular o login em todos os testes
  15 |     await page.addInitScript(() => {
  16 |       const token = 'fake-jwt-token';
  17 |       const user = {
  18 |         id: 'clv_user_thiago',
  19 |         name: 'Thiago Organizador',
  20 |         email: 'organizador@eventhub.com.br',
> 21 |         role: 'ORGANIZER',
     |                ^ Error: page.goto: Test ended.
  22 |         tenantId: 'clv_tenant_hq'
  23 |       };
  24 |       
  25 |       window.localStorage.setItem('eventhub_token', token);
  26 |       window.localStorage.setItem('eventhub_user', JSON.stringify(user));
  27 |       
  28 |       // Injeta cookie para o Middleware do Next.js
  29 |       document.cookie = `eventhub_token=${token}; path=/`;
  30 |     });
  31 | 
  32 |     page.on('requestfailed', request => {
  33 |       console.log(`[REQUEST FAILED] ${request.url()} - ${request.failure()?.errorText}`);
  34 |     });
  35 | 
  36 |     // 3. Navega para a página de eventos do dashboard
  37 |     await page.goto('/dashboard/events');
  38 |   });
  39 | 
  40 |   test.afterEach(async ({ page }, testInfo) => {
  41 |     if (testInfo.status !== testInfo.expectedStatus) {
  42 |       await page.screenshot({ path: `test-results/failure-${testInfo.title.replace(/\s+/g, '-')}.png` });
  43 |     }
  44 |   });
  45 | 
  46 |   test('deve listar os eventos do organizador', async ({ page }) => {
  47 |     // Verifica se o título da página está presente
  48 |     await expect(page.getByRole('heading', { name: 'Meus Eventos' })).toBeVisible();
  49 | 
  50 |     // Verifica se os eventos mockados estão aparecendo
  51 |     // O mock padrão em mocks.ts retorna 'Conferência Tech 2024'
  52 |     await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
  53 |     await expect(page.getByText('São Paulo, SP')).toBeVisible();
  54 |   });
  55 | 
  56 |   test('deve filtrar eventos pelo nome', async ({ page }) => {
  57 |     const searchInput = page.getByPlaceholder('Buscar eventos por nome ou local...');
  58 |     
  59 |     // 1. Espera a lista inicial carregar
  60 |     await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
  61 | 
  62 |     // 2. Busca por um termo que existe
  63 |     await searchInput.fill('Tech');
  64 |     await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
  65 | 
  66 |     // 3. Busca por um termo que NÃO existe
  67 |     await searchInput.fill('Evento Inexistente');
  68 |     await expect(page.getByText('Nenhum evento encontrado')).toBeVisible();
  69 |   });
  70 | 
  71 |   test('deve navegar para a página de criação de evento', async ({ page }) => {
  72 |     // Usa o link dentro do conteúdo principal (main) para evitar duplicidade com a Sidebar
  73 |     await page.getByRole('main').getByRole('link', { name: 'Criar Novo Evento' }).click();
  74 |     await expect(page).toHaveURL(/\/dashboard\/events\/new/);
  75 |   });
  76 | });
  77 | 
```