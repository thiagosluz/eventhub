import { Page, BrowserContext } from '@playwright/test';

export async function setupDefaultMocks(page: Page | BrowserContext) {
  let hasClaimedB2 = false;
  let latestRaffle: any = null;

  await page.route(url => url.href.includes(':3000'), async (route) => {
    const request = route.request();
    const url = request.url();
    const method = request.method();
    
    // Ignore static assets & Next.js internal
    if (url.includes('_next') || /\.(js|css|png|jpg|jpeg|svg|woff2?|ico|map)$/.test(url)) {
      return route.continue();
    }

    // Skip page navigations (HTML requests) - these are Next.js routes, not API calls
    const acceptHeader = request.headers()['accept'] || '';
    if (acceptHeader.includes('text/html')) {
      return route.continue();
    }

    // Skip React Server Components requests
    const rscHeader = request.headers()['rsc'];
    const nextRouterStateTree = request.headers()['next-router-state-tree'];
    if (rscHeader || nextRouterStateTree || url.includes('_rsc') || url.includes('__nextjs')) {
      return route.continue();
    }

    // Skip Next.js data/action requests
    const nextAction = request.headers()['next-action'];
    if (nextAction) {
      return route.continue();
    }

    // --- 0. CORS PREFLIGHT ---
    if (method === 'OPTIONS') {
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
        }
      });
    }

    const fulfill = (body: any, status = 200) => route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-tenant-id',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      }
    });

    // =====================================================
    // 1. TENANT
    // =====================================================
    if (url.includes('/tenants/public/tenant') || url.includes('/tenants/me')) {
      return fulfill({ id: 'clv_tenant_hq', name: 'EventHub HQ', slug: 'eventhub-hq' });
    }

    // =====================================================
    // 2. AUTH & USER ME
    // =====================================================
    
    // PATCH /users/me/password (must come BEFORE /users/me GET)
    if (url.includes('/users/me/password') && method === 'PATCH') {
      return fulfill({ message: 'Senha alterada com sucesso!' });
    }
    
    // PATCH /users/me (profile update)
    if (url.includes('/users/me') && method === 'PATCH') {
      return fulfill({
        id: 'clv_user_thiago',
        email: 'organizador@eventhub.com.br',
        name: 'Thiago Atualizado',
        role: 'ORGANIZER',
        bio: 'Bio atualizada'
      });
    }

    // GET /users/me/monitored-events (monitor page)
    if (url.includes('/users/me/monitored-events') && method === 'GET') {
      return fulfill([{
        eventId: 'ev-1',
        event: {
          id: 'ev-1',
          name: 'Conferência Tech 2024',
          slug: 'conferencia-tech-2024',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86400000).toISOString(),
          status: 'PUBLISHED'
        }
      }]);
    }

    // GET /users/me
    if (url.includes('/users/me') && method === 'GET') {
      return fulfill({
        id: 'clv_user_thiago',
        email: 'organizador@eventhub.com.br',
        name: 'Thiago Organizador',
        role: 'ORGANIZER',
        bio: '',
        level: 25,
        xp: 2500,
        coins: 100
      });
    }

    // =====================================================
    // 3. EVENTS
    // =====================================================

    // GET /public/events/{slug} (used by checkout page & submit page)
    if (url.includes('/public/events/') && method === 'GET') {
      const slugMatch = url.match(/\/public\/events\/([a-zA-Z0-9_-]+)/);
      return fulfill({
        id: 'ev-1',
        name: 'Conferência Tech 2024',
        slug: slugMatch?.[1] || 'conferencia-tech-2024',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'São Paulo, SP',
        status: 'PUBLISHED',
        submissionsEnabled: true,
        submissionStartDate: new Date(Date.now() - 86400000).toISOString(),
        submissionEndDate: new Date(Date.now() + 86400000).toISOString(),
        submissionModalities: [{ id: 'm-1', name: 'Workshop', description: 'Trabalhos práticos' }],
        thematicAreas: [{ id: 'a-1', name: 'Inteligência Artificial' }],
        submissionRules: [{ id: 'r-1', title: 'Regras Gerais', fileUrl: '#' }],
        forms: [{
          id: 'form-1',
          type: 'REGISTRATION',
          fields: [
            { id: 'f-empresa', label: 'Empresa', type: 'TEXT', required: true, options: [] },
            { id: 'f-como', label: 'Como soube do evento', type: 'SELECT', required: true, options: ['Google', 'LinkedIn', 'Amigos', 'Redes Sociais'] }
          ]
        }],
        themeConfig: null,
        tenant: { themeConfig: null }
      });
    }

    // GET /events/{id}/submissions/config
    if (url.match(/\/events\/[^/]+\/submissions\/config/) && method === 'GET') {
      return fulfill({
        submissionsEnabled: true,
        submissionStartDate: new Date(Date.now() - 86400000).toISOString(),
        submissionEndDate: new Date(Date.now() + 86400000).toISOString(),
        submissionModalities: [{ id: 'm-1', name: 'Workshop', eventId: 'ev-1', createdAt: new Date().toISOString() }],
        thematicAreas: [{ id: 'a-1', name: 'Inteligência Artificial', eventId: 'ev-1', createdAt: new Date().toISOString() }]
      });
    }

    // GET /events/{id}/submissions (list)
    if (url.match(/\/events\/[^/]+\/submissions/) && !url.includes('/config') && !url.includes('/modalities') && !url.includes('/thematic-areas') && !url.includes('/rules') && method === 'GET') {
      return fulfill([{
        id: 's-1-full-id-string',
        title: 'IA no Campo',
        author: { id: 'u-1', name: 'Pesquisador Um', email: 'pesquisador@example.com' },
        authors: ['Pesquisador Um'],
        status: 'SUBMITTED',
        area: 'IA',
        modality: { id: 'm-1', name: 'Workshop', eventId: 'ev-1', createdAt: new Date().toISOString() },
        thematicArea: { id: 'a-1', name: 'Inteligência Artificial', eventId: 'ev-1', createdAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        reviews: []
      }]);
    }

    // GET /events/{id}/reviewers
    if (url.match(/\/events\/[^/]+\/reviewers/) && method === 'GET') {
      return fulfill([{ id: 'u-rev-alpha', name: 'Revisor Alpha', email: 'alpha@example.com', role: 'REVIEWER' }]);
    }

    // POST /events/{id}/reviewers
    if (url.match(/\/events\/[^/]+\/reviewers/) && method === 'POST') {
      return fulfill({ message: 'Revisor Adicionado' }, 201);
    }

    // GET /events/{id}/activities
    if (url.match(/\/events\/[^/]+\/activities/) && method === 'GET') {
      return fulfill([
        { id: 'act-1', title: 'Palestra Keynote', type: 'LECTURE', startAt: new Date().toISOString(), endAt: new Date(Date.now() + 3600000).toISOString() }
      ]);
    }

    // GET /events (list for dashboard organizer) - must come AFTER specific /events/{id}/xxx routes
    if (url.match(/\/events\/?(\?.*)?$/) && method === 'GET') {
      return fulfill([{
        id: 'ev-1',
        name: 'Conferência Tech 2024',
        slug: 'conferencia-tech-2024',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'São Paulo, SP',
        status: 'PUBLISHED',
        bannerUrl: null,
        _count: { registrations: 450 }
      }]);
    }

    // GET /events/{id} (single event by ID) - AFTER /events list route
    if (url.match(/\/events\/([a-zA-Z0-9_-]+)(\?.*)?$/) && method === 'GET') {
      const eventMatch = url.match(/\/events\/([a-zA-Z0-9_-]+)/);
      return fulfill({
        id: eventMatch?.[1] || 'ev-1',
        name: 'Conferência Tech 2024',
        slug: 'conferencia-tech-2024',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'São Paulo, SP',
        status: 'PUBLISHED',
        submissionsEnabled: true,
        submissionStartDate: new Date(Date.now() - 86400000).toISOString(),
        submissionEndDate: new Date(Date.now() + 86400000).toISOString(),
        submissionModalities: [{ id: 'm-1', name: 'Workshop' }],
        thematicAreas: [{ id: 'a-1', name: 'Inteligência Artificial' }],
        activities: [{ id: 'act-1', title: 'Palestra Keynote' }]
      });
    }

    // =====================================================
    // 4. DASHBOARD STATS
    // =====================================================
    if (url.includes('/dashboard/stats')) {
      return fulfill({
        totalRegistrations: 450,
        totalRevenue: 12500.50,
        activeEvents: 3,
        ticketsSold: 420,
        recentActivities: [
          { id: 'act-1', type: 'CHECKIN', description: 'Ana fez check-in em Conferência Tech', timestamp: new Date().toISOString(), eventTitle: 'Conferência Tech' },
          { id: 'act-2', type: 'SALE', description: 'Nova venda para Workshop IA', timestamp: new Date(Date.now() - 3600000).toISOString(), eventTitle: 'Workshop IA' }
        ],
        eventSales: [
          { name: 'Conferência Tech 2024', sales: 350, revenue: 8500 },
          { name: 'Workshop IA no Campo', sales: 70, revenue: 4000.50 }
        ],
        timeSeriesData: [
          { date: '2024-04-01', sales: 10, revenue: 500 },
          { date: '2024-04-02', sales: 15, revenue: 750 }
        ]
      });
    }

    // =====================================================
    // 5. ANALYTICS (checkin manual participants, gamification)
    // =====================================================

    // GET /analytics/events/{id}/participants
    if (url.match(/\/analytics\/events\/[^/]+\/participants/) && method === 'GET') {
      return fulfill([
        {
          id: 'p-1',
          userId: 'u-1',
          name: 'Alice Participant',
          email: 'alice@example.com',
          registrationDate: new Date().toISOString(),
          ticketType: 'PRESENCIAL',
          ticketStatus: 'CONFIRMED',
          qrCodeToken: 'qr-token-alice-001',
          attendances: [],
          enrollmentsCount: 0
        },
        {
          id: 'p-2',
          userId: 'u-2',
          name: 'Bob Johnson',
          email: 'bob@example.com',
          registrationDate: new Date().toISOString(),
          ticketType: 'ONLINE',
          ticketStatus: 'CONFIRMED',
          qrCodeToken: 'qr-token-bob-002',
          attendances: [{ id: 'att-1', activityId: null }],
          enrollmentsCount: 1
        }
      ]);
    }

    // GET /analytics/events/{id}/checkins
    if (url.match(/\/analytics\/events\/[^/]+\/checkins/) && method === 'GET') {
      return fulfill([]);
    }

    // GET /analytics/events/{id}/gamification/stats
    if (url.match(/\/analytics\/events\/[^/]+\/gamification\/stats/) && method === 'GET') {
      return fulfill({ totalXpDistributed: 15000, totalBadgesAwarded: 450, activeAlertsCount: 2, totalParticipants: 1200 });
    }

    // GET /analytics/events/{id}/gamification/ranking
    if (url.match(/\/analytics\/events\/[^/]+\/gamification\/ranking/) && method === 'GET') {
      return fulfill([
        { userId: 'u-1', userName: 'Thiago Auditor', eventXp: 2500, globalLevel: 30 },
        { userId: 'u-2', userName: 'Maria Silva', eventXp: 2100, globalLevel: 25 }
      ]);
    }

    // GET /analytics/events/{id}/gamification/badges-history
    if (url.match(/\/analytics\/events\/[^/]+\/gamification\/badges-history/) && method === 'GET') {
      return fulfill([{
        id: 'h-1',
        userId: 'u-1',
        earnedAt: new Date().toISOString(),
        user: { name: 'Thiago Auditor', email: 'thiago@example.com' },
        badge: { name: 'Pioneiro', iconUrl: '🚀' }
      }]);
    }

    // GET /analytics/events/{id}/gamification/alerts
    if (url.match(/\/analytics\/events\/[^/]+\/gamification\/alerts/) && method === 'GET') {
      return fulfill([{
        id: 'a-1',
        userId: 'u-fraud',
        type: 'XP_SPIKE',
        message: 'Ganho súbito de 1000 XP em 1s',
        resolved: false,
        createdAt: new Date().toISOString(),
        user: { name: 'João Suspeito', email: 'joao@hacker.com' }
      }]);
    }

    // Legacy gamification routes (non-analytics)
    if (url.includes('/gamification/stats')) {
      return fulfill({ totalXpDistributed: 15000, totalBadgesAwarded: 450, activeAlertsCount: 2, totalParticipants: 1200 });
    }
    if (url.includes('/gamification/ranking')) {
      return fulfill([{ userId: 'u-1', userName: 'Thiago Auditor', eventXp: 2500, globalLevel: 30 }]);
    }
    if (url.includes('/gamification/badges-history')) {
      return fulfill([{ id: 'h-1', userId: 'u-1', earnedAt: new Date().toISOString(), user: { name: 'Thiago Auditor', email: 'thiago@example.com' }, badge: { name: 'Pioneiro', iconUrl: '🚀' } }]);
    }
    if (url.includes('/gamification/alerts')) {
      return fulfill([]);
    }

    // =====================================================
    // 6. BADGES (profile gamification)
    // =====================================================
    if (url.includes('/badges/available')) {
      return fulfill([
        { id: 'b-1', name: 'Pioneiro', description: 'Primeiro login no evento!', isEarned: true, iconUrl: '🚀', color: 'gold', triggerRule: 'EARLY_BIRD' },
        { id: 'b-2', name: 'Caçador de Tesouros', description: 'Resgate com código secreto!', isEarned: hasClaimedB2, iconUrl: '💎', color: 'purple', triggerRule: 'MANUAL' }
      ]);
    }
    if (url.includes('/badges/claim') && method === 'POST') {
      try {
        const body = JSON.parse(request.postData() || '{}');
        if (body.claimCode === 'VAL-123') {
          hasClaimedB2 = true;
          return fulfill({ id: 'ub-1', badgeId: 'b-2', userId: 'clv_user_thiago', earnedAt: new Date().toISOString() });
        }
        return fulfill({ message: 'Código inválido' }, 400);
      } catch {
        return fulfill({ message: 'Código inválido' }, 400);
      }
    }

    // =====================================================
    // 7. SCIENTIFIC FLOW
    // =====================================================

    // POST /submissions (create submission)
    if (url.match(/\/submissions\/?$/) && method === 'POST') {
      return fulfill({ id: 's-new', title: 'Novo Artigo' }, 201);
    }
    
    // GET /submissions (generic fallback)
    if (url.includes('/submissions') && !url.includes('/config') && !url.includes('/events/') && method === 'GET') {
      return fulfill([{
        id: 's-1-full-id-string',
        title: 'IA no Campo',
        author: { id: 'u-1', name: 'Pesquisador Um', email: 'pesquisador@example.com' },
        authors: ['Pesquisador Um'],
        status: 'SUBMITTED',
        area: 'IA',
        modality: { id: 'm-1', name: 'Workshop', eventId: 'ev-1', createdAt: new Date().toISOString() },
        thematicArea: { id: 'a-1', name: 'Inteligência Artificial', eventId: 'ev-1', createdAt: new Date().toISOString() },
        createdAt: new Date().toISOString(),
        reviews: []
      }]);
    }

    // Reviewers (generic)
    if (url.includes('/reviewers') && method === 'GET') {
      return fulfill([{ id: 'u-rev-alpha', name: 'Revisor Alpha', email: 'alpha@example.com', role: 'REVIEWER' }]);
    }
    if (url.includes('/reviewers') && method === 'POST') {
      return fulfill({ message: 'Revisor Adicionado' }, 201);
    }

    // Manual review assignment
    if (url.includes('/reviews/manual') && method === 'POST') {
      return fulfill({ message: 'Atribuído' }, 201);
    }

    // Submit review
    if (url.includes('/reviews') && !url.includes('/manual') && method === 'POST') {
      return fulfill({ message: 'Enviado' }, 201);
    }

    // GET /me/reviews
    if (url.includes('/me/reviews') && method === 'GET') {
      return fulfill([{ id: 'r-1', submissionId: 's-1', submission: { title: 'IA no Campo' }, status: 'PENDING' }]);
    }

    // GET /me/submissions
    if (url.includes('/me/submissions') && method === 'GET') {
      return fulfill([]);
    }

    // =====================================================
    // 8. PARTICIPANTS & CHECK-IN
    // =====================================================

    // GET /participants/export (CSV)
    if (url.includes('/participants/export') && method === 'GET') {
      const csv = 'Nome,Email,Evento,Tipo,Data\nAna Participante,ana@example.com,Conferência Tech 2024,PRESENCIAL,2024-04-01\nCarlos Revisor,carlos@example.com,Conferência Tech 2024,ONLINE,2024-04-01';
      return route.fulfill({
        status: 200,
        contentType: 'text/csv',
        body: csv,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Content-Disposition': 'attachment; filename="participantes.csv"',
        }
      });
    }

    // GET /participants/{id} (single participant detail)
    if (url.match(/\/participants\/[a-zA-Z0-9_-]+$/) && method === 'GET') {
      return fulfill({
        id: 'p-1',
        user: { name: 'Ana Participante', email: 'ana@example.com' },
        event: { name: 'Conferência Tech 2024' },
        tickets: [{ type: 'PRESENCIAL', price: 150 }],
        checkedIn: true,
        createdAt: new Date().toISOString(),
        formResponses: [],
        enrollments: [],
        certificates: [],
        history: []
      });
    }

    // GET /participants (list)
    if (url.includes('/participants') && method === 'GET') {
      return fulfill([
        {
          id: 'p-1',
          userId: 'u-1',
          user: { id: 'u-1', name: 'Ana Participante', email: 'ana@example.com' },
          event: { id: 'ev-1', name: 'Conferência Tech 2024' },
          tickets: [{ type: 'PRESENCIAL' }],
          checkedIn: true,
          createdAt: new Date().toISOString()
        },
        {
          id: 'p-2',
          userId: 'u-2',
          user: { id: 'u-2', name: 'Carlos Revisor', email: 'carlos@example.com' },
          event: { id: 'ev-1', name: 'Conferência Tech 2024' },
          tickets: [{ type: 'ONLINE' }],
          checkedIn: false,
          createdAt: new Date().toISOString()
        }
      ]);
    }

    // POST /checkin
    if (url.includes('/checkin') && method === 'POST') {
      return fulfill({ alreadyCheckedIn: false, attendanceId: 'att-new-1', xpGained: 10, isLevelUp: false }, 201);
    }

    // DELETE /checkin/{id}
    if (url.includes('/checkin') && method === 'DELETE') {
      return fulfill({ message: 'Check-in desfeito' });
    }

    // =====================================================
    // 9. RAFFLES
    // =====================================================

    // POST /raffles (draw)
    if (url.match(/\/raffles\/?$/) && method === 'POST') {
      const body = JSON.parse(request.postData() || '{}');
      latestRaffle = {
        id: 'r-' + Date.now(),
        prizeName: body.prizeName || 'Prêmio',
        winners: [{ registrationId: 'reg-1', userName: 'Ana Participante' }],
        registration: { id: 'reg-1', user: { name: 'Ana Participante', email: 'ana@example.com' } },
        drawnAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        rule: 'ONLY_CHECKED_IN',
        isHiddenOnDisplay: false,
        hasReceived: false
      };
      return fulfill({ winners: [{ registrationId: 'reg-1', userName: 'Ana Participante' }] }, 201);
    }

    // GET /raffles/latest/{eventId}
    if (url.includes('/raffles/latest/')) {
      return fulfill(latestRaffle);
    }

    // GET /raffles/history/{eventId}
    if (url.includes('/raffles/history/')) {
      // If history has been started via a draw, include it. Otherwise return initial mock data.
      if (latestRaffle) {
        return fulfill([latestRaffle]);
      }
      return fulfill([{
        id: 'r-initial-1',
        prizeName: 'Kindle',
        winners: [{ registrationId: 'reg-0', userName: 'Ganhador Antigo' }],
        registration: { id: 'reg-0', user: { name: 'Ganhador Antigo', email: 'antigo@example.com' } },
        drawnAt: new Date(Date.now() - 86400000).toISOString(),
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        rule: 'ONLY_CHECKED_IN',
        isHiddenOnDisplay: false,
        hasReceived: false
      }]);
    }

    // =====================================================
    // 10. CHECKOUT
    // =====================================================
    if (url.includes('/checkout') && method === 'POST') {
      return fulfill({ registrationId: 'reg-new-1', tickets: [{ type: 'GRATUITO' }], totalAmount: 0 }, 201);
    }

    // =====================================================
    // 11. MY TICKETS (profile page)
    // =====================================================
    if (url.includes('/my-tickets') && method === 'GET') {
      return fulfill([]);
    }

    // =====================================================
    // 12. CERTIFICATES
    // =====================================================
    if (url.includes('/certificates/my') && method === 'GET') {
      return fulfill([]);
    }
    if (url.includes('/certificates/templates') && method === 'GET') {
      return fulfill([]);
    }

    // =====================================================
    // 13. SPEAKERS
    // =====================================================
    if (url.includes('/speakers/me/activities') && method === 'GET') {
      return fulfill([]);
    }
    if (url.includes('/speakers/me/feedbacks') && method === 'GET') {
      return fulfill([]);
    }
    if (url.includes('/speakers/me') && method === 'GET') {
      return fulfill({ id: 'sp-1', name: 'Thiago Organizador', bio: '' }, 404);
    }
    if (url.includes('/speakers') && method === 'GET') {
      return fulfill([]);
    }

    // =====================================================
    // 14. TICKETS (QR code)
    // =====================================================
    if (url.match(/\/tickets\/[^/]+\/qrcode/) && method === 'GET') {
      // Return a minimal PNG blob
      return route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64'),
        headers: { 'Access-Control-Allow-Origin': '*' }
      });
    }

    // =====================================================
    // 15. USERNAME CHECK
    // =====================================================
    if (url.includes('/check-username/') && method === 'GET') {
      return fulfill({ available: true });
    }

    // =====================================================
    // 16. STAFF / MONITORS
    // =====================================================
    if (url.includes('/staff/organizers') && method === 'GET') {
      return fulfill([{ id: 'o-1', email: 'org@example.com', name: 'Organizador 1', createdAt: new Date().toISOString() }]);
    }
    if (url.includes('/staff/events/') && url.includes('/monitors') && method === 'GET') {
      return fulfill([]);
    }
    if (url.includes('/staff/events/') && url.includes('/potential-monitors') && method === 'GET') {
      return fulfill([]);
    }
    if (url.includes('/staff') && method === 'POST') {
      return fulfill({ message: 'OK' }, 201);
    }

    // =====================================================
    // 17. PUBLIC EVENTS
    // =====================================================
    if (url.includes('/public/events') && method === 'GET') {
      return fulfill([{
        id: 'ev-1',
        name: 'Conferência Tech 2024',
        slug: 'conferencia-tech-2024',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 86400000).toISOString(),
        location: 'São Paulo, SP',
        status: 'PUBLISHED'
      }]);
    }

    // =====================================================
    // 18. USERS (general list)
    // =====================================================
    if (url.includes('/users') && method === 'GET' && !url.includes('/me')) {
      return fulfill([
        { id: 'u-joao', name: 'João Disponível', email: 'joao@example.com', role: 'REVIEWER' },
        { id: 'u-rev-alpha', name: 'Revisor Alpha', email: 'alpha@example.com', role: 'REVIEWER' }
      ]);
    }

    // =====================================================
    // 19. AUTH (login, refresh)
    // =====================================================
    if (url.includes('/auth/login') && method === 'POST') {
      return fulfill({
        access_token: 'fake-jwt-token',
        refresh_token: 'fake-refresh-token',
        user: { id: 'clv_user_thiago', email: 'organizador@eventhub.com.br', name: 'Thiago Organizador', role: 'ORGANIZER' }
      });
    }
    if (url.includes('/auth/refresh') && method === 'POST') {
      return fulfill({ access_token: 'fake-jwt-token-refreshed', refresh_token: 'fake-refresh-token-2' });
    }

    // =====================================================
    // 20. REVIEWER INVITATIONS
    // =====================================================
    if (url.includes('/reviewer-invitations') && method === 'GET') {
      return fulfill({ email: 'invite@example.com', event: { name: 'Conferência Tech 2024' } });
    }
    if (url.includes('/reviewer-invitations') && method === 'POST') {
      return fulfill({ message: 'OK' }, 201);
    }

    // =====================================================
    // 21. DASHBOARD STATS (catch more specific patterns)
    // =====================================================
    if (url.includes('/dashboard')) {
      return fulfill({
        totalRegistrations: 450,
        totalRevenue: 12500,
        activeEvents: 3,
        ticketsSold: 420,
        recentActivities: [],
        eventSales: [],
        timeSeriesData: []
      });
    }

    // =====================================================
    // 22. ACTIVITY OPERATIONS (enroll, unroll, enrollments)
    // =====================================================
    if (url.includes('/activities/') && url.includes('/enroll') && method === 'POST') {
      return fulfill({ message: 'Inscrito' }, 201);
    }
    if (url.includes('/activities/') && url.includes('/unroll') && method === 'DELETE') {
      return fulfill({ message: 'Desinscrito' });
    }
    if (url.includes('/activities/my-enrollments/') && method === 'GET') {
      return fulfill([]);
    }
    if (url.includes('/activities/') && url.includes('/enrollments') && method === 'GET') {
      return fulfill([]);
    }

    // =====================================================
    // 23. CATCH-ALL POST/PATCH/DELETE (prevent hard failures)
    // =====================================================
    if (method === 'POST' || method === 'PATCH' || method === 'PUT') {
      console.warn(`[E2E-UNHANDLED-MUTATION] ${method} ${url} — returning 200 OK`);
      return fulfill({ message: 'OK' });
    }
    if (method === 'DELETE') {
      console.warn(`[E2E-UNHANDLED-DELETE] ${method} ${url} — returning 200 OK`);
      return fulfill({ message: 'Deleted' });
    }

    // =====================================================
    // FALLBACK
    // =====================================================
    console.warn(`[E2E-UNHANDLED] ${method} ${url}`);
    return route.continue();
  });
}

