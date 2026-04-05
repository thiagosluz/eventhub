import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificatesService } from '../certificates.service';

describe('certificatesService', () => {
  const API_BASE_URL = "http://localhost:3000";

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem("eventhub_token", "fake-token");
  });

  const mockResponse = (data: any, status = 200, ok = true) => {
    return Promise.resolve({
      ok,
      status,
      json: () => Promise.resolve(data),
      blob: () => Promise.resolve(new Blob([JSON.stringify(data)])),
    });
  };

  it('listTemplatesByEvent should call fetch correctly', async () => {
    const data = [{ id: '1' }];
    vi.mocked(fetch).mockResolvedValue(mockResponse(data) as any);

    const result = await certificatesService.listTemplatesByEvent('ev-1');

    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/event/ev-1`, expect.objectContaining({
      headers: { "Authorization": "Bearer fake-token" }
    }));
    expect(result).toEqual(data);
  });

  it('createTemplate should call fetch correctly', async () => {
    const data = { name: 'New' };
    vi.mocked(fetch).mockResolvedValue(mockResponse(data) as any);

    await certificatesService.createTemplate('ev-1', data);

    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/event/ev-1`, expect.objectContaining({
      method: "POST",
      body: JSON.stringify(data)
    }));
  });

  it('getTemplate should call fetch correctly', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ id: '1' }) as any);
    await certificatesService.getTemplate('1');
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/1`, expect.any(Object));
  });

  it('updateTemplate should call fetch correctly', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ id: '1' }) as any);
    await certificatesService.updateTemplate('1', { name: 'Update' });
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/1`, expect.objectContaining({ method: 'PATCH' }));
  });

  it('uploadBackground should call fetch correctly', async () => {
    const file = new File([''], 'bg.png');
    vi.mocked(fetch).mockResolvedValue(mockResponse({ id: '1' }) as any);
    await certificatesService.uploadBackground('1', file);
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/1/background`, expect.objectContaining({ method: 'POST' }));
  });

  it('issueCertificate should call fetch correctly', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ issuedId: '1' }) as any);
    await certificatesService.issueCertificate('temp-1', 'reg-1');
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/issue`, expect.objectContaining({ method: 'POST' }));
  });

  it('issueBulkTemplate should call fetch correctly', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({ total: 10 }) as any);
    await certificatesService.issueBulkTemplate('temp-1');
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/temp-1/issue-bulk`, expect.objectContaining({ method: 'POST' }));
  });

  it('listMyCertificates should call fetch correctly', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse([]) as any);
    await certificatesService.listMyCertificates();
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/my`, expect.any(Object));
  });

  it('previewTemplate should call fetch correctly and return blob', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}) as any);
    const result = await certificatesService.previewTemplate({ backgroundUrl: 'url', layoutConfig: {} });
    expect(fetch).toHaveBeenCalledWith(`${API_BASE_URL}/certificates/templates/preview`, expect.objectContaining({ method: 'POST' }));
    expect(result).toBeInstanceOf(Blob);
  });

  it('should throw error if createTemplate failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.createTemplate('ev-1', {})).rejects.toThrow("Falha ao criar template.");
  });

  it('should throw error if getTemplate failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.getTemplate('1')).rejects.toThrow("Falha ao carregar template.");
  });

  it('should throw error if updateTemplate failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.updateTemplate('1', {})).rejects.toThrow("Falha ao atualizar template.");
  });

  it('should throw error if uploadBackground failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.uploadBackground('1', new File([], 'f'))).rejects.toThrow("Falha ao subir fundo.");
  });

  it('should throw error if issueCertificate failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.issueCertificate('t', 'r')).rejects.toThrow("Falha ao emitir certificado.");
  });

  it('should throw error if issueBulkTemplate failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.issueBulkTemplate('t')).rejects.toThrow("Falha ao emitir certificados em massa.");
  });

  it('should throw error if previewTemplate failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.previewTemplate({ backgroundUrl: 'b', layoutConfig: {} })).rejects.toThrow("Falha ao gerar pré-visualização.");
  });

  it('should throw error if listMyCertificates failed', async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse({}, 500, false) as any);
    await expect(certificatesService.listMyCertificates()).rejects.toThrow("Falha ao carregar seus certificados.");
  });
});
