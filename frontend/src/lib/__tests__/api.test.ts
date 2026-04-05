import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { api } from '../api';

// Mock global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ApiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    // Reset refreshing state indirectly by ensuring no pending promises
    // In a real scenario we might need to export the client class for clean instances
    // but here we test the singleton 'api'
    
    // Default mock response
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      headers: new Map([['content-type', 'application/json']]),
      text: () => Promise.resolve(JSON.stringify({ success: true })),
      json: () => Promise.resolve({ success: true }),
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requests Básicos', () => {
    it('deve realizar um GET com headers corretos', async () => {
      localStorage.setItem('eventhub_token', 'fake-token');
      
      const result = await api.get('/test');
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/test'),
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Authorization': 'Bearer fake-token',
            'Content-Type': 'application/json'
          })
        })
      );
      expect(result).toEqual({ success: true });
    });

    it('deve formatar query params corretamente', async () => {
      await api.get('/test', { params: { search: 'query', page: 1, empty: null, undef: undefined } });
      
      const [url] = mockFetch.mock.calls[0];
      expect(url).toContain('?search=query&page=1');
      expect(url).not.toContain('empty');
      expect(url).not.toContain('undef');
    });

    it('deve enviar POST com JSON body', async () => {
      const body = { name: 'Test' };
      await api.post('/test', body);
      
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(body)
        })
      );
    });

    it('deve enviar POST com FormData corretamente (sem Content-Type json)', async () => {
      const formData = new FormData();
      formData.append('file', 'blob');
      
      await api.post('/upload', formData);
      
      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers).not.toHaveProperty('Content-Type');
      expect(options.body).toBeInstanceOf(FormData);
    });

    it('deve realizar PATCH e DELETE corretamente', async () => {
      await api.patch('/test', { key: 'val' });
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'PATCH' }));

      await api.delete('/test');
      expect(mockFetch).toHaveBeenLastCalledWith(expect.any(String), expect.objectContaining({ method: 'DELETE' }));
    });
  });

  describe('Tratamento de Erros e Refresh Token', () => {
    it('deve lançar erro para respostas não-ok', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        headers: new Map([['content-type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify({ message: 'Bad Request' })),
      });

      await expect(api.get('/error')).rejects.toThrow('Bad Request');
    });

    it('deve interceptar 401 e tentar refresh token', async () => {
      localStorage.setItem('eventhub_refresh_token', 'valid-refresh');
      
      // 1. Falha inicial (401)
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map([['content-type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify({ message: 'Unauthorized' })),
      });

      // 2. Sucesso no Refresh
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ access_token: 'new-atk', refresh_token: 'new-rtk' }),
      });

      // 3. Sucesso na RE-tentativa
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Map([['content-type', 'application/json']]),
        text: () => Promise.resolve(JSON.stringify({ data: 'recovered' })),
      });

      const result = await api.get('/protected');

      expect(result).toEqual({ data: 'recovered' });
      expect(localStorage.getItem('eventhub_token')).toBe('new-atk');
      expect(mockFetch).toHaveBeenCalledTimes(3);
      // Chamada de refresh
      expect(mockFetch.mock.calls[1][0]).toContain('/auth/refresh');
      expect(mockFetch.mock.calls[1][1].body).toContain('valid-refresh');
    });

    it('deve falhar se não houver refresh token disponível ao receber 401', async () => {
      localStorage.removeItem('eventhub_refresh_token');
      
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        headers: new Map(),
        text: () => Promise.resolve('{}'),
      });

      await expect(api.get('/protected-no-rt')).rejects.toThrow('No refresh token available');
    });

    it('deve enfileirar múltiplas requisições 401 e resolvê-las após o refresh', async () => {
      localStorage.setItem('eventhub_refresh_token', 'valid-refresh');

      // Primeiro trigger do refresh
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, headers: new Map(), text: () => Promise.resolve('{}') });
      // Segundo trigger (deve ir para fila)
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, headers: new Map(), text: () => Promise.resolve('{}') });
      
      // Resposta do refresh (atrasada para garantir enfileiramento)
      let resolveRefresh: any;
      const refreshPromise = new Promise((resolve) => { resolveRefresh = resolve; });
      mockFetch.mockReturnValueOnce(refreshPromise);

      // Dispara as duas chamadas
      const call1 = api.get('/req1');
      const call2 = api.get('/req2');

      // Resolve o refresh
      resolveRefresh({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ access_token: 'new-tk', refresh_token: 'new-rtk' }),
      });

      // Respostas das re-tentativas
      mockFetch.mockResolvedValue({ ok: true, status: 200, headers: new Map(), text: () => Promise.resolve('{"ok":true}') });

      await Promise.all([call1, call2]);

      expect(mockFetch).toHaveBeenCalledTimes(5); // 2 originais + 1 refresh + 2 re-tentativas
    });

    it('deve fazer logout e redirecionar se o refresh falhar', async () => {
      const originalLocation = window.location;
      Object.defineProperty(window, 'location', {
        value: { href: '' },
        writable: true
      });

      localStorage.setItem('eventhub_refresh_token', 'bad-refresh');
      
      mockFetch.mockResolvedValueOnce({ ok: false, status: 401, headers: new Map(), text: () => Promise.resolve('{}') });
      mockFetch.mockResolvedValueOnce({ ok: false, status: 400 }); // Refresh falhou

      await expect(api.get('/fail')).rejects.toThrow();

      expect(localStorage.getItem('eventhub_token')).toBeNull();
      expect(window.location.href).toBe('/auth/login');

      Object.defineProperty(window, 'location', { value: originalLocation });
    });
  });

  describe('Ambiente SSR (Mocks de Node)', () => {
    it('deve tentar ler tokens do cookie se no servidor', async () => {
      // Simula ambiente servidor removendo window
      const originalWindow = global.window;
      // @ts-ignore
      delete global.window;

      // Mock dinâmico de next/headers
      vi.mock('next/headers', () => ({
        cookies: () => Promise.resolve({
          get: (name: string) => ({ value: name === 'eventhub_token' ? 'ssr-tk' : undefined })
        })
      }));

      await api.get('/ssr');

      const [, options] = mockFetch.mock.calls[0];
      expect(options.headers['Authorization']).toBe('Bearer ssr-tk');

      global.window = originalWindow;
    });
  });
});
