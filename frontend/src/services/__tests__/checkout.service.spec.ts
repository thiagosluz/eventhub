import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkoutService, CheckoutInput } from '../checkout.service';
import { api } from '@/lib/api';

vi.mock('@/lib/api', () => ({
  api: {
    post: vi.fn(),
  },
}));

describe('checkoutService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('processCheckout should call API correctly', async () => {
    const input: CheckoutInput = { eventId: '1', activityIds: ['a1'] };
    vi.mocked(api.post).mockResolvedValue({ registrationId: 'reg-1' });
    const result = await checkoutService.processCheckout(input);
    expect(api.post).toHaveBeenCalledWith('/checkout', input);
    expect(result.registrationId).toBe('reg-1');
  });
});
