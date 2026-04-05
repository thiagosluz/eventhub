import { Page } from '@playwright/test';

export async function setupDefaultMocks(page: Page) {
  await page.route('**/*', async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    const isNext = url.includes('_next') || url.includes('__nextjs');
    const isAsset = /\.(js|css|png|jpg|jpeg|svg|woff2?|ico|woff)$/.test(url);
    
    // NUNCA mockar a própria página do dashboard
    const isDashboardPage = url.includes('/dashboard/') && !url.includes('/stats') && !url.includes('/export') && !/\.(json|csv)$/.test(url);
    
    if (isNext || isAsset || (isDashboardPage && !url.includes('/api/'))) {
      return route.continue();
    }

    // LOG PARA DEPURAÇÃO
    if (!isNext && !isAsset) {
      console.log(`[E2E-REQ] ${method} ${url}`);
    }

    // --- PRIORIDADE: OPERAÇÕES & CHECK-IN ---
    // POST /checkin
    if (url.endsWith('/checkin') && method === 'POST') {
      console.log(`[E2E-MOCK] POST checkin`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ alreadyCheckedIn: false, attendanceId: 'att-new', xpGained: 50 }),
      });
    }

    // DELETE /checkin/:id
    if (url.includes('/checkin/') && method === 'DELETE') {
      console.log(`[E2E-MOCK] DELETE checkin`);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }

    if (url.includes('/activities/event/')) {
      console.log(`[E2E-MOCK] GET event activities`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'act-1', title: 'Workshop de React', startDate: '2024-10-10T10:00:00Z' },
          { id: 'act-2', title: 'Palestra de Node.js', startDate: '2024-10-10T14:00:00Z' }
        ]),
      });
    }

    if (url.includes('/analytics/events/') && url.includes('/participants')) {
      console.log(`[E2E-MOCK] GET event participants`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            id: 'p-1', 
            name: 'John Doe', 
            email: 'john@example.com', 
            ticketType: 'VIP', 
            qrCodeToken: 'token-john',
            attendances: [] 
          },
          { 
            id: 'p-2', 
            name: 'Jane Smith', 
            email: 'jane@example.com', 
            ticketType: 'FREE', 
            qrCodeToken: 'token-jane',
            attendances: [{ id: 'att-1', activityId: null }] 
          }
        ]),
      });
    }

    // --- GENÉRICOS ---
    if (url.includes('/users/me')) {
      console.log(`[E2E-MOCK] GET users/me`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'clv_user_thiago',
          email: 'organizador@eventhub.com.br',
          name: 'Thiago Organizador',
          role: 'ORGANIZER',
          tenantId: 'clv_tenant_hq'
        }),
      });
    }

    if (url.includes('/tenants/public/tenant') || url.includes('/tenants/me')) {
       console.log(`[E2E-MOCK] GET tenants`);
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

    // Eventos (Lista ou Individual)
    if (url.includes('/events') && !url.includes('/dashboard')) {
      if (url.match(/\/events\/[^\/]+$/)) {
        console.log(`[E2E-MOCK] GET single event`);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 'ev-1',
            name: 'Conferência Tech 2024',
            slug: 'conferencia-tech-2024',
            startDate: '2024-10-10T09:00:00Z',
            endDate: '2024-10-12T18:00:00Z',
            location: 'São Paulo, SP',
            status: 'PUBLISHED',
            _count: { registrations: 42 }
          }),
        });
      }
      console.log(`[E2E-MOCK] GET events list`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 'ev-1',
            name: 'Conferência Tech 2024',
            startDate: '2024-10-10T09:00:00Z',
            location: 'São Paulo, SP',
            status: 'PUBLISHED',
            _count: { registrations: 42 }
          }
        ]),
      });
    }

    if (url.includes('/participants') && !url.includes('/dashboard')) {
       console.log(`[E2E-MOCK] GET generic participants`);
       return route.fulfill({
         status: 200,
         contentType: 'application/json',
         body: JSON.stringify([
           {
             id: 'part-1',
             user: { name: 'Ana Participante', email: 'ana@example.com' },
             event: { name: 'Conferência Tech 2024' },
             tickets: [{ type: 'VIP', price: 150 }],
             createdAt: '2024-01-01T00:00:00Z'
           }
         ]),
       });
    }

    if (url.includes('/stats')) {
      console.log(`[E2E-MOCK] GET stats`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          totalRevenue: 1000,
          totalRegistrations: 50,
          recentActivities: [],
          eventSales: [],
          timeSeriesData: []
        }),
      });
    }

    return route.continue();
  });
}
