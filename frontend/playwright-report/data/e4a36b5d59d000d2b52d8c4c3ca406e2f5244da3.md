# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard-checkin.spec.ts >> Dashboard - Fluxo de Check-in >> deve realizar check-in manual com sucesso
- Location: e2e/dashboard-checkin.spec.ts:52:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.waitForResponse: Test timeout of 30000ms exceeded.
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "EventHub HQ" [ref=e6] [cursor=pointer]:
        - /url: /
        - img [ref=e8]
        - generic [ref=e10]: EventHub HQ
      - navigation [ref=e11]:
        - link "Visão Geral" [ref=e12] [cursor=pointer]:
          - /url: /dashboard
          - img [ref=e13]
          - text: Visão Geral
        - link "Meus Eventos" [ref=e15] [cursor=pointer]:
          - /url: /dashboard/events
          - img [ref=e16]
          - text: Meus Eventos
        - link "Palestrantes" [ref=e18] [cursor=pointer]:
          - /url: /dashboard/speakers
          - img [ref=e19]
          - text: Palestrantes
        - link "Branding" [ref=e21] [cursor=pointer]:
          - /url: /dashboard/settings/branding
          - img [ref=e22]
          - text: Branding
        - link "Categorias" [ref=e24] [cursor=pointer]:
          - /url: /dashboard/categories
          - img [ref=e25]
          - text: Categorias
        - link "Inscritos" [ref=e28] [cursor=pointer]:
          - /url: /dashboard/participants
          - img [ref=e29]
          - text: Inscritos
        - link "Revisões" [ref=e31] [cursor=pointer]:
          - /url: /dashboard/reviews
          - img [ref=e32]
          - text: Revisões
        - link "Financeiro" [ref=e34] [cursor=pointer]:
          - /url: /dashboard/finance
          - img [ref=e35]
          - text: Financeiro
        - link "Configurações" [ref=e37] [cursor=pointer]:
          - /url: /dashboard/settings
          - img [ref=e38]
          - text: Configurações
        - link "Minha Equipe" [ref=e41] [cursor=pointer]:
          - /url: /dashboard/settings/team
          - img [ref=e42]
          - text: Minha Equipe
      - link "Criar Novo Evento" [ref=e45] [cursor=pointer]:
        - /url: /dashboard/events/new
        - img [ref=e46]
        - text: Criar Novo Evento
    - generic [ref=e48]:
      - banner [ref=e49]:
        - heading "EventHub HQ / Visão Geral" [level=2] [ref=e51]
        - generic [ref=e52]:
          - button [ref=e53]:
            - img [ref=e54]
          - generic [ref=e59] [cursor=pointer]:
            - generic [ref=e60]:
              - paragraph [ref=e61]: Thiago Organizador
              - paragraph [ref=e62]: Admin da Organização
            - img [ref=e64]
      - main [ref=e66]:
        - generic [ref=e68]:
          - generic [ref=e69]:
            - generic [ref=e70]:
              - generic [ref=e71]:
                - link [ref=e72] [cursor=pointer]:
                  - /url: /dashboard/events/ev-1
                  - img [ref=e73]
                - generic [ref=e75]:
                  - heading "Sistema de Check-in" [level=1] [ref=e76]
                  - paragraph [ref=e77]: Conferência Tech 2024
              - img [ref=e79]
            - generic [ref=e82]:
              - button "Scanner QR" [ref=e83]:
                - img [ref=e84]
                - text: Scanner QR
              - button "Manual / Busca" [ref=e87]:
                - img [ref=e88]
                - text: Manual / Busca
            - generic [ref=e90]:
              - generic [ref=e91]: Modo de Check-in
              - combobox [ref=e92] [cursor=pointer]:
                - option "Check-in Geral do Evento" [selected]
                - option
          - generic [ref=e93]:
            - generic [ref=e94]:
              - generic [ref=e95]:
                - img [ref=e96]
                - textbox "Busque por nome, email ou ingresso..." [ref=e98]
              - generic [ref=e99]:
                - generic [ref=e100]: Resultados da Busca
                - generic [ref=e101]:
                  - generic [ref=e102]:
                    - generic [ref=e103]:
                      - img [ref=e105]
                      - generic [ref=e107]:
                        - heading "John Doe" [level=4] [ref=e108]
                        - paragraph [ref=e109]: john@example.com
                        - generic [ref=e110]:
                          - generic [ref=e111]: VIP
                          - generic [ref=e112]:
                            - img [ref=e113]
                            - text: token-jo...
                    - button "DESFAZER" [ref=e116]
                  - generic [ref=e117]:
                    - generic [ref=e118]:
                      - img [ref=e120]
                      - generic [ref=e122]:
                        - heading "Jane Smith" [level=4] [ref=e123]
                        - paragraph [ref=e124]: jane@example.com
                        - generic [ref=e125]:
                          - generic [ref=e126]: FREE
                          - generic [ref=e127]:
                            - img [ref=e128]
                            - text: token-ja...
                    - button "DESFAZER" [ref=e131]
            - generic [ref=e132]:
              - generic [ref=e135]: Modo Manual Ativo
              - generic [ref=e136]: Ready for Search
          - generic [ref=e137]:
            - generic [ref=e138]:
              - img [ref=e140]
              - paragraph [ref=e142]: Certifique-se que o local esteja bem iluminado.
            - generic [ref=e143]:
              - img [ref=e145]
              - paragraph [ref=e147]: Mantenha o celular estável durante a leitura.
  - button "Open Next.js Dev Tools" [ref=e153] [cursor=pointer]:
    - img [ref=e154]
  - alert [ref=e157]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { setupDefaultMocks } from './support/mocks';
  3   | 
  4   | test.describe('Dashboard - Fluxo de Check-in', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await setupDefaultMocks(page);
  7   |     
  8   |     // Auto-login
  9   |     await page.addInitScript(() => {
  10  |       const token = 'fake-jwt-token';
  11  |       const user = {
  12  |         id: 'clv_user_thiago',
  13  |         name: 'Thiago Organizador',
  14  |         email: 'organizador@eventhub.com.br',
  15  |         role: 'ORGANIZER',
  16  |         tenantId: 'clv_tenant_hq'
  17  |       };
  18  |       window.localStorage.setItem('eventhub_token', token);
  19  |       window.localStorage.setItem('eventhub_user', JSON.stringify(user));
  20  |       document.cookie = `eventhub_token=${token}; path=/`;
  21  |     });
  22  | 
  23  |     // Navega para check-in de um evento específico
  24  |     await page.goto('/dashboard/events/ev-1/operations/checkin');
  25  |   });
  26  | 
  27  |   test('deve carregar informações do evento e atividades', async ({ page }) => {
  28  |     await expect(page.getByText('Conferência Tech 2024')).toBeVisible();
  29  |     
  30  |     // Abre seletor de atividades
  31  |     const activitySelect = page.getByRole('combobox');
  32  |     await expect(activitySelect).toBeVisible();
  33  |     await expect(activitySelect).toContainText('Check-in Geral');
  34  |   });
  35  | 
  36  |   test('deve alternar para aba manual e filtrar participantes', async ({ page }) => {
  37  |     // Clica na aba Manual
  38  |     await page.getByText('Manual / Busca').click();
  39  |     
  40  |     // Verifica se os participantes mockados aparecem
  41  |     await expect(page.getByText('John Doe')).toBeVisible();
  42  |     await expect(page.getByText('Jane Smith')).toBeVisible();
  43  | 
  44  |     // Testa filtro
  45  |     const searchInput = page.getByPlaceholder('Busque por nome, e-mail ou código...');
  46  |     await searchInput.fill('John');
  47  |     
  48  |     await expect(page.getByText('John Doe')).toBeVisible();
  49  |     await expect(page.getByText('Jane Smith')).not.toBeVisible();
  50  |   });
  51  | 
  52  |   test('deve realizar check-in manual com sucesso', async ({ page }) => {
  53  |     await page.getByText('Manual / Busca').click();
  54  |     
  55  |     const checkinBtn = page.locator('button:has-text("CHECK-IN")').first();
  56  |     // Prepara espera pela resposta da API
> 57  |     const responsePromise = page.waitForResponse(response => 
      |                                  ^ Error: page.waitForResponse: Test timeout of 30000ms exceeded.
  58  |       response.url().includes('/operations/checkin') && response.request().method() === 'POST'
  59  |     );
  60  |     
  61  |     await checkinBtn.click();
  62  |     await responsePromise;
  63  | 
  64  |     // Verifica feedback visual de sucesso
  65  |     await expect(page.getByText(/Check-in realizado com sucesso!/i)).toBeVisible();
  66  |     await expect(page.getByText('+50 XP')).toBeVisible();
  67  |     
  68  |     // Verifica se o botão mudou para DESFAZER (na atualização do mock reativa)
  69  |     // Nota: Em E2E real, o mock do GET analytics refletiria a mudança. 
  70  |     // Como nosso mock é estático, o componente exibe a mensagem de sucesso temporária.
  71  |   });
  72  | 
  73  |   test('deve permitir desfazer check-in manual', async ({ page }) => {
  74  |     await page.getByText('Manual / Busca').click();
  75  |     
  76  |     const undoBtn = page.locator('button:has-text("DESFAZER")');
  77  |     await expect(undoBtn).toBeVisible();
  78  | 
  79  |     // Prepara espera pela resposta da API
  80  |     const responsePromise = page.waitForResponse(response => 
  81  |       response.url().includes('/operations/checkin') && response.request().method() === 'DELETE'
  82  |     );
  83  |     
  84  |     await undoBtn.click();
  85  |     await responsePromise;
  86  | 
  87  |     // Verifica feedback visual
  88  |     await expect(page.getByText(/Check-in desfeito!/i)).toBeVisible();
  89  |   });
  90  | 
  91  |   test('deve validar montagem da área do scanner', async ({ page }) => {
  92  |     // Aguarda carregar dados básicos do evento para garantir que a página montou
  93  |     await expect(page.getByText(/Conferência Tech 2024/i)).toBeVisible({ timeout: 10000 });
  94  | 
  95  |     // No scanner mode, valida apenas que a área do leitor está presente no DOM
  96  |     await expect(page.locator('#reader')).toBeAttached();
  97  |     
  98  |     // NOTA: Testes detalhados de status da câmera são cobertos pela suíte de UNIDADE
  99  |     // devido às limitações de hardware em ambientes de CI headless.
  100 |   });
  101 | });
  102 | 
```