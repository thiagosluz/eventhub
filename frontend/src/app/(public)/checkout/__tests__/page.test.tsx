import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const pushMock = vi.fn();
const getPublicEventBySlugMock = vi.fn();
const processCheckoutMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  useSearchParams: () =>
    new URLSearchParams({ eventId: "ev-1", slug: "my-event" }),
}));

vi.mock("@/context/AuthContext", async () => ({
  useAuth: () => ({
    user: {
      id: "u1",
      name: "Jane Participante",
      email: "jane@example.com",
      role: "PARTICIPANT",
      tenantId: "t1",
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    updateUser: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock("@/services/events.service", () => ({
  eventsService: {
    getPublicEventBySlug: (...a: unknown[]) => getPublicEventBySlugMock(...a),
  },
}));

vi.mock("@/services/checkout.service", () => ({
  checkoutService: {
    processCheckout: (...a: unknown[]) => processCheckoutMock(...a),
  },
}));

vi.mock("@/components/providers/ThemeProvider", () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import CheckoutPage from "../page";

const eventWithForm = {
  id: "ev-1",
  slug: "my-event",
  name: "Meu Evento",
  startDate: new Date().toISOString(),
  forms: [
    {
      id: "form-1",
      type: "REGISTRATION",
      fields: [
        {
          id: "field-1",
          label: "Empresa",
          type: "TEXT",
          required: true,
          order: 0,
        },
      ],
    },
  ],
};

describe("CheckoutPage", () => {
  beforeEach(() => {
    pushMock.mockReset();
    getPublicEventBySlugMock.mockReset().mockResolvedValue(eventWithForm);
    processCheckoutMock.mockReset().mockResolvedValue(undefined);
  });

  it("blocks progression when required field is empty", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await screen.findByRole("heading", { name: /Confirme seus Dados/i });

    await user.click(screen.getByRole("button", { name: /Prosseguir/i }));
    await user.click(screen.getByRole("button", { name: /Revisar Pedido/i }));

    expect(
      await screen.findByText(/campos obrigatórios/i),
    ).toBeInTheDocument();
    expect(processCheckoutMock).not.toHaveBeenCalled();
  });

  it("advances steps and submits the form", async () => {
    const user = userEvent.setup();
    render(<CheckoutPage />);

    await screen.findByRole("heading", { name: /Confirme seus Dados/i });
    await user.click(screen.getByRole("button", { name: /Prosseguir/i }));

    await user.type(
      await screen.findByLabelText(/Empresa/),
      "EventHub Labs",
    );
    await user.click(screen.getByRole("button", { name: /Revisar Pedido/i }));

    await screen.findByRole("heading", { name: /Tudo Pronto/i });
    await user.click(
      screen.getByRole("button", { name: /Finalizar Inscrição/i }),
    );

    await waitFor(() => {
      expect(processCheckoutMock).toHaveBeenCalled();
    });
    const payload = processCheckoutMock.mock.calls[0][0];
    expect(payload.eventId).toBe("ev-1");
    expect(payload.formResponses[0].formId).toBe("form-1");
    expect(payload.formResponses[0].answers[0]).toEqual({
      fieldId: "field-1",
      value: "EventHub Labs",
    });
  });
});
