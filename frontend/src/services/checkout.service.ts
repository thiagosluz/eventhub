import { api } from "@/lib/api";

import { Ticket } from "../types/event";

export interface FormResponseInput {
  formId: string;
  answers: { fieldId: string; value: string }[];
}

export interface CheckoutInput {
  eventId: string;
  activityIds: string[];
  formResponses?: FormResponseInput[];
}

export interface CheckoutResponse {
  registrationId: string;
  tickets: Ticket[];
  totalAmount: number;
}

export const checkoutService = {
  processCheckout: async (input: CheckoutInput): Promise<CheckoutResponse> => {
    return api.post<CheckoutResponse>("/checkout", input);
  },
};
