import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const getPublicEventBySlugMock = vi.fn();
const createSubmissionMock = vi.fn();

vi.mock("next/navigation", () => ({
  useParams: () => ({ slug: "my-event" }),
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@/services/events.service", () => ({
  eventsService: {
    getPublicEventBySlug: (...a: unknown[]) => getPublicEventBySlugMock(...a),
  },
}));

vi.mock("@/services/submissions.service", () => ({
  submissionsService: {
    createSubmission: (...a: unknown[]) => createSubmissionMock(...a),
  },
}));

import SubmitWorkPage from "../page";

const futureDate = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();

const baseEvent = {
  id: "ev-1",
  slug: "my-event",
  name: "Meu Evento",
  startDate: new Date().toISOString(),
  submissionsEnabled: true,
  submissionEndDate: futureDate,
  submissionStartDate: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
  submissionModalities: [],
  thematicAreas: [],
  submissionRules: [],
};

describe("SubmitWorkPage", () => {
  beforeEach(() => {
    getPublicEventBySlugMock.mockReset().mockResolvedValue(baseEvent);
    createSubmissionMock.mockReset().mockResolvedValue({ id: "s1" });
  });

  it("rejects submission without a file", async () => {
    const user = userEvent.setup();
    render(<SubmitWorkPage />);

    await screen.findByRole("heading", { name: /Submissão de Trabalho/i });

    await user.type(
      screen.getByLabelText(/Título do Trabalho/i),
      "Um título aceitável",
    );
    await user.type(
      screen.getByLabelText(/Resumo \/ Abstract/i),
      "Este é um resumo com pelo menos 20 caracteres.",
    );

    await user.click(
      screen.getByRole("button", { name: /Finalizar Submissão/i }),
    );

    expect(
      await screen.findByText(/Selecione um arquivo PDF/i),
    ).toBeInTheDocument();
    expect(createSubmissionMock).not.toHaveBeenCalled();
  });

  it("submits when the form is valid", async () => {
    const user = userEvent.setup();
    render(<SubmitWorkPage />);

    await screen.findByRole("heading", { name: /Submissão de Trabalho/i });

    await user.type(
      screen.getByLabelText(/Título do Trabalho/i),
      "Um título aceitável",
    );
    await user.type(
      screen.getByLabelText(/Resumo \/ Abstract/i),
      "Este é um resumo com pelo menos 20 caracteres.",
    );

    const pdf = new File([new Uint8Array(64)], "paper.pdf", {
      type: "application/pdf",
    });
    const fileInput = document
      .querySelector('input[type="file"]') as HTMLInputElement;
    await user.upload(fileInput, pdf);

    await user.click(
      screen.getByRole("button", { name: /Finalizar Submissão/i }),
    );

    await waitFor(() => {
      expect(createSubmissionMock).toHaveBeenCalled();
    });
    const payload = createSubmissionMock.mock.calls[0][0];
    expect(payload.title).toBe("Um título aceitável");
    expect(payload.file).toBeInstanceOf(File);
  });
});
