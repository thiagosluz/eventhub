import { describe, it, expect, vi, beforeEach } from 'vitest';
import { submissionsService } from '../submissions.service';
import { api } from '../../lib/api';

vi.mock('../../lib/api', () => ({
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

  const eventId = 'ev-1';
  const submissionId = 'sub-1';
  const reviewerId = 'rev-1';

  it('createSubmission should call API correctly with FormData', async () => {
    const file = new File([''], 'test.pdf');
    const data = { eventId, title: 'Title', abstract: 'Abs', modalityId: 'm1', thematicAreaId: 't1', file };
    vi.mocked(api.post).mockResolvedValue({});
    
    await submissionsService.createSubmission(data);
    
    expect(api.post).toHaveBeenCalledWith('/submissions', expect.any(FormData));
    const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formData.get('eventId')).toBe(eventId);
    expect(formData.get('title')).toBe('Title');
  });

  it('createSubmission should call API correctly with minimal data', async () => {
    const file = new File([''], 'test.pdf');
    const data = { eventId, title: 'Title', file };
    vi.mocked(api.post).mockResolvedValue({});
    
    await submissionsService.createSubmission(data);
    
    const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formData.get('abstract')).toBeNull();
    expect(formData.get('modalityId')).toBeNull();
  });

  it('listMyReviews should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await submissionsService.listMyReviews();
    expect(api.get).toHaveBeenCalledWith('/me/reviews');
  });

  it('submitReview should call API correctly', async () => {
    const data = { submissionId, score: 5, recommendation: 'Accept', comments: 'Good' };
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.submitReview(data);
    expect(api.post).toHaveBeenCalledWith('/reviews', data);
  });

  it('listSubmissionsForEvent should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await submissionsService.listSubmissionsForEvent(eventId);
    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/submissions`);
  });

  it('listMySubmissions should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await submissionsService.listMySubmissions();
    expect(api.get).toHaveBeenCalledWith('/me/submissions');
  });

  it('getSubmissionConfig should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await submissionsService.getSubmissionConfig(eventId);
    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/submissions/config`);
  });

  it('updateSubmissionConfig should call API correctly', async () => {
    const data = { submissionsEnabled: true };
    vi.mocked(api.patch).mockResolvedValue({});
    await submissionsService.updateSubmissionConfig(eventId, data);
    expect(api.patch).toHaveBeenCalledWith(`/events/${eventId}/submissions/config`, data);
  });

  it('createModality should call API correctly with FormData', async () => {
    const file = new File([''], 'template.docx');
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.createModality(eventId, { name: 'Mod1', description: 'Desc' }, file);
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/submissions/modalities`, expect.any(FormData));
  });

  it('createModality should call API correctly with minimal data', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.createModality(eventId, { name: 'Mod1' });
    const formData = vi.mocked(api.post).mock.calls[0][1] as FormData;
    expect(formData.get('description')).toBeNull();
  });

  it('deleteModality should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await submissionsService.deleteModality(eventId, 'm1');
    expect(api.delete).toHaveBeenCalledWith(`/events/${eventId}/submissions/modalities/m1`);
  });

  it('createThematicArea should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.createThematicArea(eventId, { name: 'Area1' });
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/submissions/thematic-areas`, { name: 'Area1' });
  });

  it('deleteThematicArea should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await submissionsService.deleteThematicArea(eventId, 't1');
    expect(api.delete).toHaveBeenCalledWith(`/events/${eventId}/submissions/thematic-areas/t1`);
  });

  it('createRule should call API correctly with FormData', async () => {
    const file = new File([''], 'rule.pdf');
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.createRule(eventId, 'Rule 1', file);
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/submissions/rules`, expect.any(FormData));
  });

  it('deleteRule should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await submissionsService.deleteRule(eventId, 'r1');
    expect(api.delete).toHaveBeenCalledWith(`/events/${eventId}/submissions/rules/r1`);
  });

  it('listEventReviewers should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue([]);
    await submissionsService.listEventReviewers(eventId);
    expect(api.get).toHaveBeenCalledWith(`/events/${eventId}/reviewers`);
  });

  it('addReviewerToEvent should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.addReviewerToEvent(eventId, reviewerId);
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/reviewers`, { userId: reviewerId });
  });

  it('removeReviewerFromEvent should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await submissionsService.removeReviewerFromEvent(eventId, reviewerId);
    expect(api.delete).toHaveBeenCalledWith(`/events/${eventId}/reviewers/${reviewerId}`);
  });

  it('assignReview should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.assignReview(submissionId, reviewerId);
    expect(api.post).toHaveBeenCalledWith('/reviews/manual', { submissionId, reviewerId });
  });

  it('deleteReview should call API correctly', async () => {
    vi.mocked(api.delete).mockResolvedValue(undefined);
    await submissionsService.deleteReview('rev-1');
    expect(api.delete).toHaveBeenCalledWith('/reviews/rev-1');
  });

  it('inviteReviewer should call API correctly', async () => {
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.inviteReviewer(eventId, 'test@test.com');
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/reviewer-invitations`, { email: 'test@test.com' });
  });

  it('manualRegisterReviewer should call API correctly', async () => {
    const data = { name: 'N', email: 'E', temporaryPassword: 'P' };
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.manualRegisterReviewer(eventId, data);
    expect(api.post).toHaveBeenCalledWith(`/events/${eventId}/reviewers/manual`, data);
  });

  it('getInvitation should call API correctly', async () => {
    vi.mocked(api.get).mockResolvedValue({});
    await submissionsService.getInvitation('token-1');
    expect(api.get).toHaveBeenCalledWith('/reviewer-invitations/token-1');
  });

  it('acceptInvitation should call API correctly', async () => {
    const data = { token: 't', name: 'n', password: 'p' };
    vi.mocked(api.post).mockResolvedValue({});
    await submissionsService.acceptInvitation(data);
    expect(api.post).toHaveBeenCalledWith('/reviewer-invitations/accept', data);
  });
});
