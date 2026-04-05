import { Page, BrowserContext } from '@playwright/test';

export async function setupDefaultMocks(page: Page | BrowserContext) {
  const hasClaimedB2 = false;
  let latestRaffle: any = null;
  const alerts = [
    { id: 'a-1', userId: 'u-fraud', type: 'XP_SPIKE', message: 'Ganho súbito de 1000 XP em 1s', resolved: false, createdAt: new Date().toISOString(), user: { name: 'João Suspeito', email: 'joao@hacker.com' } }
  ];

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    // Ignorar recursos estáticos
    if (url.includes('_next') || /\.(js|css|png|jpg|jpeg|svg|woff2?|ico)$/.test(url)) {
      return route.continue();
    }

    // --- 1. CONFIGURAÇÕES & EVENTOS ---
    if (url.includes('/tenants/public/tenant') || url.includes('/tenants/me')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'clv_tenant_hq', name: 'EventHub HQ', slug: 'eventhub-hq' }) });
    }

    if (url.match(/\/events\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'ev-1', name: 'Conferência Tech 2024', slug: 'conferencia-tech-2024' }) });
    }

    // --- 2. USUÁRIO & AUTH ---
    if (url.includes('/users/me') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 'clv_user_thiago', email: 'organizador@eventhub.com.br', name: 'Thiago Silva', role: 'ORGANIZER' }) });
    }

    // --- 3. GAMIFICATION ANALYTICS ---
    if (url.includes('/gamification/stats')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ totalXpDistributed: 15000, totalBadgesAwarded: 450, activeAlertsCount: alerts.filter(a => !a.resolved).length, totalParticipants: 1200 }) });
    }
    if (url.includes('/gamification/ranking')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ userId: 'u-1', userName: 'Thiago Auditor', eventXp: 2500, globalLevel: 30 }, { userId: 'u-2', userName: 'Maria Silva', eventXp: 2100, globalLevel: 25 }]) });
    }
    if (url.includes('/gamification/badges-history')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'h-1', userId: 'u-1', earnedAt: new Date().toISOString(), user: { name: 'Thiago Auditor', email: 'thiago@example.com' }, badge: { name: 'Pioneiro', iconUrl: '🚀' } }]) });
    }
    if (url.includes('/gamification/alerts')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(alerts) });
    }

    // --- 4. OPERAÇÕES DE SORTEIO ---
    if (url.includes('/raffles') && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      latestRaffle = {
        id: 'r-' + Date.now(),
        prizeName: body.prizeName || 'Prêmio Misterioso',
        registration: { id: 'reg-123', user: { name: 'Sortudo da Silva' } },
        drawnAt: new Date().toISOString(),
        isHiddenOnDisplay: false
      };
      console.log(`[E2E-MOCK] DRAW CREATED: ${latestRaffle.prizeName}`);
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ winners: [{ registrationId: 'reg-123', userName: 'Sortudo da Silva' }] }) });
    }

    if (url.includes('/raffles/latest/')) {
      console.log(`[E2E-MOCK] POLLING LATEST: ${latestRaffle ? latestRaffle.prizeName : 'NONE'}`);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(latestRaffle) });
    }

    if (url.includes('/raffles/history/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(latestRaffle ? [latestRaffle] : []) });
    }

    // --- 5. BADGES GERAL ---
    if (url.includes('/badges/available')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([{ id: 'b-1', name: 'Pioneiro', isEarned: true, iconUrl: '🚀' }, { id: 'b-2', name: 'Caçador', isEarned: hasClaimedB2, iconUrl: '💎' }]) });
    }

    return route.continue();
  });
}
