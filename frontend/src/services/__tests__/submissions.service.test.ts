import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submissionsService } from '../submissions.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('submissionsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const eventId = 'ev-123';
  const submissionId = 'sub-456';

  it('createSubmission deve enviar FormData com arquivo do trabalho', async () => {
    const file = new File([''], 'paper.pdf', { type: 'application/pdf' });
    const data = { eventId, title: 'Test Paper', file };
    (api.post as any).mockResolvedValue({ id: submissionId });

    const result = await submissionsService.createSubmission(data);

    expect(api.post).toHaveBeenCalledWith('/submissions', expect.any(FormData));
    expect(result.id).toBe(submissionId);
  });

  it('listMySubmissions deve buscar trabalhos do usuário', async () => {
    const mockData = [{ id: submissionId, title: 'My Work' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await submissionsService.listMySubmissions();

    expect(api.get).toHaveBeenCalledWith('/me/submissions');
    expect(result).toEqual(mockData);
  });

  it('submitReview deve enviar avaliação de trabalho', async () => {
    const reviewData = { submissionId, score: 5, recommendation: 'ACCEPT', comments: 'Good' };
    (api.post as any).mockResolvedValue({ id: 'rev-1' });

    const result = await submissionsService.submitReview(reviewData);

    expect(api.post).toHaveBeenCalledWith('/reviews', reviewData);
    expect(result.id).toBe('rev-1');
  });

  it('getSubmissionConfig deve buscar configuração do evento', async () => {
    const mockData = { submissionsEnabled: true };
    (api.get as any).mockResolvedValue(mockData);

    const result = await submissionsService.getSubmissionConfig(eventId);

    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/submissions/config`);
    expect(result).toEqual(mockData);
  });

  it('updateSubmissionConfig deve enviar PATCH com novas datas', async () => {
    const configData = { submissionsEnabled: true };
    (api.patch as any).mockResolvedValue(undefined);

    await submissionsService.updateSubmissionConfig(eventId, configData);

    expect(api.patch).toHaveBeenCalledWith(`/events/${eventId}/submissions/config`, configData);
  });

  it('createModality deve enviar FormData para nova modalidade', async () => {
    const file = new File([''], 'template.docx');
    (api.post as any).mockResolvedValue({ id: 'mod-1' });

    await submissionsService.createModality(eventId, { name: 'Poster' }, file);

    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/submissions/modalities`, expect.any(FormData));
  });

  it('deleteModality deve remover uma modalidade do evento', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await submissionsService.deleteModality(eventId, 'mod-1');

    expect(api.delete).toHaveBeenCalledWith(`/events/${eventId}/submissions/modalities/mod-1`);
  });

  it('createThematicArea deve adicionar área temática', async () => {
    (api.post as any).mockResolvedValue({ id: 'area-1' });

    await submissionsService.createThematicArea(eventId, { name: 'AI' });

    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/submissions/thematic-areas`, { name: 'AI' });
  });

  it('deleteThematicArea deve remover área temática', async () => {
    (api.delete as any).mockResolvedValue(undefined);

    await submissionsService.deleteThematicArea(eventId, 'area-1');

    expect(api.delete).toHaveBeenCalledWith(`/events/${eventId}/submissions/thematic-areas/area-1`);
  });

  it('createRule deve enviar FormData para nova regra de submissão', async () => {
    const file = new File([''], 'rules.pdf');
    (api.post as any).mockResolvedValue({ id: 'rule-1' });

    await submissionsService.createRule(eventId, 'Guidelines', file);

    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/submissions/rules`, expect.any(FormData));
  });

  it('listEventReviewers deve listar revisores do evento', async () => {
    const mockData = [{ id: 'u1', name: 'Reviewer' }];
    (api.get as any).mockResolvedValue(mockData);

    const result = await submissionsService.listEventReviewers(eventId);

    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/reviewers`);
    expect(result).toEqual(mockData);
  });

  it('addReviewerToEvent deve associar usuário como revisor', async () => {
    (api.post as any).mockResolvedValue(undefined);

    await submissionsService.addReviewerToEvent(eventId, 'u1');

    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/reviewers`, { userId: 'u1' });
  });

  it('assignReview deve realizar distribuição manual de trabalho', async () => {
    (api.post as any).mockResolvedValue({ id: 'rev-1' });

    await submissionsService.assignReview(submissionId, 'u1');

    expect(api.post).toHaveBeenCalledWith('/reviews/manual', { submissionId, reviewerId: 'u1' });
  });

  it('inviteReviewer deve enviar convite por e-mail', async () => {
    (api.post as any).mockResolvedValue(undefined);

    await submissionsService.inviteReviewer(eventId, 'test@example.com');

    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/reviewer-invitations`, { email: 'test@example.com' });
  });

  it('getInvitation deve buscar dados do convite pelo token', async () => {
    const mockData = { email: 'test@example.com' };
    (api.get as any).mockResolvedValue(mockData);

    await submissionsService.getInvitation('token-123');

    expect(api.get).toHaveBeenCalledWith('/reviewer-invitations/token-123');
  });

  it('acceptInvitation deve processar aceite do revisor', async () => {
    (api.post as any).mockResolvedValue(undefined);

    await submissionsService.acceptInvitation({ token: 't1', name: 'N', password: 'P' });

    expect(api.post).toHaveBeenCalledWith('/reviewer-invitations/accept', { token: 't1', name: 'N', password: 'P' });
  });
});
