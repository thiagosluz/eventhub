import { describe, it, expect, vi, beforeEach } from 'vitest';
import { certificatesService } from '../certificates.service';

describe('certificatesService', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
    localStorage.setItem('eventhub_token', 'test-token');
  });

  const eventId = 'ev-123';

  it('listTemplatesByEvent deve buscar templates do evento', async () => {
    const mockData = [{ id: 't1', name: 'Template 1' }];
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.listTemplatesByEvent(eventId);

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining(`/certificates/templates/event/${eventId}`), expect.any(Object));
    expect(result).toEqual(mockData);
  });

  it('createTemplate deve enviar POST para criar template', async () => {
    const mockData = { id: 't1', name: 'New' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.createTemplate(eventId, { name: 'New' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining(`/certificates/templates/event/${eventId}`),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(mockData);
  });

  it('getTemplate deve buscar template por ID', async () => {
    const mockData = { id: 't1' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.getTemplate('t1');

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/certificates/templates/t1'), expect.any(Object));
    expect(result).toEqual(mockData);
  });

  it('updateTemplate deve enviar PATCH para atualizar template', async () => {
    const mockData = { id: 't1', name: 'Updated' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.updateTemplate('t1', { name: 'Updated' });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/templates/t1'),
      expect.objectContaining({ method: 'PATCH' })
    );
    expect(result).toEqual(mockData);
  });

  it('uploadBackground deve enviar FormData para upload de fundo', async () => {
    const mockData = { id: 't1' };
    const file = new File([''], 'bg.png', { type: 'image/png' });
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.uploadBackground('t1', file);

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/templates/t1/background'),
      expect.objectContaining({ method: 'POST', body: expect.any(FormData) })
    );
    expect(result).toEqual(mockData);
  });

  it('issueCertificate deve emitir um certificado individual', async () => {
    const mockData = { issuedId: 'i1', fileUrl: 'url' };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.issueCertificate('t1', 'r1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/issue'),
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ templateId: 't1', registrationId: 'r1', sendEmail: true }) })
    );
    expect(result).toEqual(mockData);
  });

  it('issueBulkTemplate deve emitir certificados em massa', async () => {
    const mockData = { total: 10, processed: 10 };
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.issueBulkTemplate('t1');

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/templates/t1/issue-bulk'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(mockData);
  });

  it('listMyCertificates deve buscar certificados do usuário logado', async () => {
    const mockData = [{ id: 'i1' }];
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const result = await certificatesService.listMyCertificates();

    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/certificates/my'), expect.any(Object));
    expect(result).toEqual(mockData);
  });

  it('previewTemplate deve retornar um Blob da pré-visualização', async () => {
    const mockBlob = new Blob([''], { type: 'application/pdf' });
    (fetch as any).mockResolvedValue({
      ok: true,
      blob: async () => mockBlob,
    });

    const result = await certificatesService.previewTemplate({ backgroundUrl: 'url', layoutConfig: {} });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/certificates/templates/preview'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(result).toEqual(mockBlob);
  });

  it('deve lançar erro se a resposta não for ok', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
    });

    await expect(certificatesService.getTemplate('t1')).rejects.toThrow("Falha ao carregar template.");
  });
});
