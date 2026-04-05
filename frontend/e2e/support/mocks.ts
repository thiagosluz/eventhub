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
    const isDocument = request.resourceType() === 'document';
    
    if (isNext || isAsset || (isDashboardPage && !url.includes('/api/')) || isDocument) {
      return route.continue();
    }

    // LOG PARA DEPURAÇÃO
    if (!isNext && !isAsset) {
      console.log(`[E2E-REQ] ${method} ${url}`);
    }

    // --- 1. CONFIGURAÇÕES & TENANTS ---
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

    // --- 2. ANALYTICS & CHECK-IN (Específico para Dashboard/Operations) ---
    if (url.includes('/analytics/events/') && url.includes('/participants')) {
      console.log(`[E2E-MOCK] GET analytics event participants`);
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
            attendances: [],
            registrationDate: '2024-01-01',
            ticketStatus: 'PAID',
            enrollmentsCount: 0
          },
          { 
            id: 'p-2', 
            name: 'Jane Smith', 
            email: 'jane@example.com', 
            ticketType: 'FREE', 
            qrCodeToken: 'token-jane',
            attendances: [{ id: 'att-1', activityId: null }],
            registrationDate: '2024-01-01',
            ticketStatus: 'PAID',
            enrollmentsCount: 0
          }
        ]),
      });
    }

    if (url.includes('/operations/checkin') || url.endsWith('/checkin')) {
      console.log(`[E2E-MOCK] ${method} checkin operation`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ 
          alreadyCheckedIn: false, 
          attendanceId: 'att-new', 
          xpGained: 50,
          success: true 
        }),
      });
    }

    if (url.includes('/checkin/') && method === 'DELETE') {
      console.log(`[E2E-MOCK] DELETE checkin legacy`);
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    }

    // --- 3. GESTÃO DE PARTICIPANTES (Dashboard/Participants) ---
    if (url.includes('/participants/export')) {
      console.log(`[E2E-MOCK] GET participants export`);
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: 'id,name,email\npart-1,Ana Participante,ana@example.com'
      });
    }

    if (url.includes('/participants') && !url.includes('/analytics')) {
      if (method === 'GET') {
          // Diferenciar list vs detail
          const isDetail = url.split('/').pop()?.startsWith('part-') || url.split('/').pop()?.startsWith('p-');
          if (isDetail) {
              console.log(`[E2E-MOCK] GET participant detail`);
              return route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                  id: 'part-1',
                  user: { name: 'Ana Participante', email: 'ana@example.com' },
                  event: { id: 'ev-1', name: 'Conferência Tech 2024' },
                  tickets: [{ type: 'VIP', price: 150 }],
                  createdAt: '2024-01-01T00:00:00Z',
                  enrollments: [],
                  formResponses: [],
                  certificates: [],
                  history: []
                })
              });
          }
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { 
                id: 'part-1', 
                user: { name: 'Ana Participante', email: 'ana@example.com' }, 
                event: { name: 'Conferência Tech 2024' },
                tickets: [{ type: 'VIP', price: 150 }],
                createdAt: '2024-01-01T00:00:00Z',
                userId: 'u-1'
              },
              {
                id: 'part-4',
                user: { name: 'Carlos Revisor', email: 'carlos@example.com' },
                event: { name: 'Conferência Tech 2024' },
                tickets: [{ type: 'STAFF', price: 0 }],
                createdAt: '2024-01-01T00:00:00Z',
                userId: 'u-4'
              }
            ]),
          });
      }
    }

    // --- 4. ATIVIDADES ---
    if (url.includes('/activities')) {
      console.log(`[E2E-MOCK] GET activities`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'act-1', title: 'Check-in Geral', startDate: '2024-10-10T10:00:00Z' },
          { id: 'act-2', title: 'Workshop de React', startDate: '2024-10-10T10:00:00Z' },
          { id: 'act-3', title: 'Palestra de Node.js', startDate: '2024-10-10T14:00:00Z' }
        ]),
      });
    }

    // --- 5. EVENTOS ---
    if (url.includes('/events') && !url.includes('/dashboard')) {
      if (!url.includes('/submissions') && !url.includes('/activities') && !url.includes('/reviewers') && !url.includes('/config')) {
        const isList = url.endsWith('/events') || url.includes('/events?');
        if (isList) {
          console.log(`[E2E-MOCK] GET events list`);
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify([
              { id: 'ev-1', name: 'Conferência Tech 2024', startDate: '2024-10-10T09:00:00Z', location: 'São Paulo, SP', status: 'PUBLISHED', _count: { registrations: 42 } }
            ]),
          });
        } else {
          console.log(`[E2E-MOCK] GET single event`);
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'ev-1',
              name: 'Conferência Tech 2024',
              slug: 'conferencia-tech-2024',
              startDate: '2024-10-10T09:00:00Z',
              endDate: '2030-12-31T18:00:00Z', // Futuro para habilitar submissões
              location: 'São Paulo, SP',
              status: 'PUBLISHED',
              submissionsEnabled: true,
              submissionStartDate: '2024-01-01T00:00:00Z',
              submissionEndDate: '2030-12-31T23:59:59Z',
              submissionModalities: [{ id: 'mod-1', name: 'Workshop', description: 'Trabalhos práticos' }],
              thematicAreas: [{ id: 'area-1', name: 'Inteligência Artificial' }],
              submissionRules: [{ id: 'rule-1', title: 'Regras Gerais', fileUrl: '#' }],
              _count: { registrations: 42 }
            }),
          });
        }
      }
    }

    // --- 6. SORTEIOS (RAFFLES) ---
    if (url.includes('/raffles/history/')) {
      console.log(`[E2E-MOCK] GET raffle history`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          id: 'raf-1',
          drawnAt: new Date().toISOString(),
          registration: { user: { name: 'Ganhador Antigo', email: 'vencedor@exemplo.com' } },
          rule: 'ONLY_CHECKED_IN',
          prizeName: 'Kindle',
          hasReceived: true,
          isHiddenOnDisplay: false
        }]),
      });
    }

    if (url.includes('/raffles') && method === 'POST') {
      console.log(`[E2E-MOCK] POST draw raffle`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          winners: [{ registrationId: 'reg-win-1', userName: 'Sortudo da Silva', userEmail: 'sortudo@exemplo.com' }]
        }),
      });
    }

    // --- 7. SUBMISSÕES CIENTÍFICAS ---
    if (url.includes('/submissions/config')) {
      console.log(`[E2E-MOCK] GET submission config`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          submissionsEnabled: true,
          submissionStartDate: '2024-01-01T00:00:00Z',
          submissionEndDate: '2030-12-31T23:59:59Z',
          submissionModalities: [{ id: 'mod-1', name: 'Workshop', description: 'Trabalhos práticos' }],
          thematicAreas: [{ id: 'area-1', name: 'Inteligência Artificial' }],
          submissionRules: [{ id: 'rule-1', title: 'Regras Gerais', fileUrl: '#' }]
        }),
      });
    }

    if (url.includes('/submissions') && method === 'POST') {
      console.log(`[E2E-MOCK] POST create submission`);
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: 'sub-new', title: 'Meu Trabalho Científico' }),
      });
    }

    if (url.includes('/submissions') && method === 'GET' && !url.includes('/me/')) {
      console.log(`[E2E-MOCK] GET submissions list`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ 
          id: 'sub-1', 
          title: 'IA no Campo', 
          status: 'SUBMITTED',
          author: { name: 'Pesquisador Um', email: 'autor@exemplo.com' },
          modality: { id: 'mod-1', name: 'Workshop' },
          thematicArea: { id: 'area-1', name: 'Agro' },
          createdAt: new Date().toISOString(),
          fileUrl: '#'
        }]),
      });
    }

    if (url.includes('/reviewers')) {
      console.log(`[E2E-MOCK] GET reviewers`);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 'rev-user-1', name: 'Revisor Alpha', email: 'revisor@exemplo.com' }]),
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
