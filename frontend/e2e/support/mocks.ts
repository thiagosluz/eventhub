import { Page } from '@playwright/test';

export async function setupDefaultMocks(page: Page) {
  let hasClaimedB2 = false;

  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    const isNext = url.includes('_next') || url.includes('__nextjs');
    const isAsset = /\.(js|css|png|jpg|jpeg|svg|woff2?|ico|woff)$/.test(url);
    
    const isDashboardPage = url.includes('/dashboard/') && !url.includes('/api/') && !url.includes('/stats') && !url.includes('/export') && !/\.(json|csv)$/.test(url);
    const isDocument = request.resourceType() === 'document';
    
    if (isNext || isAsset || isDocument || (isDashboardPage && !url.includes('/api/'))) {
      return route.continue();
    }

    // --- 1. CONFIGURAÇÕES & TENANTS ---
    if (url.includes('/tenants/public/tenant') || url.includes('/tenants/me')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'clv_tenant_hq',
          name: 'EventHub HQ',
          slug: 'eventhub-hq',
          themeConfig: { primaryColor: '#6366f1' }
        }),
      });
    }

    // --- 2. USUÁRIO & PERFIL ---
    if (url.includes('/users/me') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'clv_user_thiago',
          email: 'organizador@eventhub.com.br',
          name: 'Thiago Silva',
          role: 'PARTICIPANT',
          level: 25,
          xp: 2500,
          tenantId: 'clv_tenant_hq',
          bio: 'Participante engajado.',
          avatarUrl: null
        }),
      });
    }

    if (url.includes('/my-tickets') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 't-1',
            eventId: 'ev-1',
            type: 'VIP',
            event: {
              id: 'ev-1',
              name: 'Conferência Tech 2024',
              slug: 'conferencia-tech-2024',
              startDate: '2024-10-10T09:00:00Z',
              endDate: '2024-10-11T18:00:00Z',
              bannerUrl: null
            }
          }
        ]),
      });
    }

    if (url.includes('/certificates/my') || url.includes('/users/me/monitored-events')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }

    // --- 3. BADGES & GAMIFICATION ---
    if (url.includes('/badges/available') && method === 'GET') {
      console.log(`[E2E-MOCK] GET available badges (hasClaimedB2: ${hasClaimedB2})`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'b-1',
            name: 'Pioneiro',
            description: 'Participou do primeiro evento.',
            color: 'gold',
            iconUrl: '🥇',
            isEarned: true,
            triggerRule: 'EVENT_COUNT',
            event: { name: 'Web Summit' }
          },
          {
            id: 'b-2',
            name: 'Caçador de Tesouros',
            description: 'Encontrou o código secreto no pavilhão.',
            color: 'purple',
            iconUrl: '💎',
            isEarned: hasClaimedB2,
            triggerRule: 'MANUAL',
            event: { name: 'Web Summit' }
          }
        ]),
      });
    }

    if (url.includes('/badges/claim/') && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      if (body.claimCode === 'VAL-123') {
        hasClaimedB2 = true;
        console.log(`[E2E-MOCK] POST claim badge SUCCESS`);
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({ 
            success: true, 
            badge: { id: 'b-2', name: 'Caçador de Tesouros', isEarned: true } 
          }),
        });
      } else {
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Código inválido ou erro ao resgatar.' }),
        });
      }
    }

    if (url.includes('/profile/xp') && method === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ currentXp: 2500, level: 25, nextLevelXp: 3000, totalXp: 12500, rank: 12 }),
      });
    }

    return route.continue();
  });
}
