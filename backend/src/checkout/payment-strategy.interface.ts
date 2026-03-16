import { TicketStatus, TicketType } from '../generated/prisma';

export interface PaymentContext {
  userId: string;
  eventId: string;
  registrationId: string;
  activityIds: string[];
}

export interface PaymentResult {
  tickets: {
    id: string;
    type: TicketType;
    status: TicketStatus;
    price: string;
  }[];
  totalAmount: string;
}

export interface PaymentStrategy {
  process(ctx: PaymentContext): Promise<PaymentResult>;
}

