import { render, screen, fireEvent, waitFor } from "@/test-utils";
import SpeakerActivitiesPage from "../page";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { speakersService } from "@/services/speakers.service";
import { toast } from "react-hot-toast";

// Mock completo dos ícones para evitar erros de importação
vi.mock("@heroicons/react/24/outline", () => ({
  CalendarIcon: (props: any) => <div {...props} />,
  MapPinIcon: (props: any) => <div {...props} />,
  UserGroupIcon: (props: any) => <div {...props} />,
  CloudArrowUpIcon: (props: any) => <div {...props} />,
  DocumentIcon: (props: any) => <div {...props} />,
  CheckBadgeIcon: (props: any) => <div {...props} />,
  LinkIcon: (props: any) => <div {...props} />,
  XMarkIcon: (props: any) => <div {...props} />,
  PlusIcon: (props: any) => <div {...props} />,
  ArrowTopRightOnSquareIcon: (props: any) => <div {...props} />,
  TrashIcon: (props: any) => <div {...props} data-testid="TrashIcon" />,
  ExclamationTriangleIcon: (props: any) => <div {...props} />,
}));

vi.mock("@/services/speakers.service", () => ({
  speakersService: {
    getMyActivities: vi.fn(),
    addActivityMaterial: vi.fn(),
    removeActivityMaterial: vi.fn(),
  },
}));

vi.mock("react-hot-toast", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe("SpeakerActivitiesPage Component", () => {
  const mockActivities = [
    {
      activityId: "act-1",
      role: { name: "Palestrante Principal" },
      activity: {
        id: "act-1",
        title: "Mastering React 19",
        startAt: "2024-10-10T14:00:00Z",
        location: "Sala 204",
        _count: { enrollments: 45 },
        type: { name: "Workshop" },
        event: { name: "Web Summit 2024" },
        materials: [
          { id: "mat-1", title: "Slides - Tema A", fileUrl: "http://a.com", fileType: "SLIDES", activityId: "act-1", createdAt: "" },
          { id: "mat-2", title: "Link Útil", fileUrl: "http://b.com", fileType: "LINK", activityId: "act-1", createdAt: "" }
        ],
      },
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (speakersService.getMyActivities as any).mockResolvedValue(mockActivities);
  });

  it("deve carregar e listar as atividades do palestrante", async () => {
    render(<SpeakerActivitiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Mastering React 19")).toBeInTheDocument();
      expect(screen.getByText("Palestrante Principal")).toBeInTheDocument();
      expect(screen.getByText("Sala 204")).toBeInTheDocument();
      expect(screen.getByText("45 Participantes")).toBeInTheDocument();
    });
  });

  it("deve abrir o modal ao clicar em Adicionar Material", async () => {
    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Mastering React 19"));

    const addBtn = screen.getByText(/Adicionar Material/i);
    fireEvent.click(addBtn);

    await waitFor(() => {
      // O modal tem um h3 com texto "Adicionar Material" — verifica com getAllByText
      const headers = screen.getAllByText(/Adicionar Material/i);
      expect(headers.length).toBeGreaterThanOrEqual(2);
      expect(screen.getByPlaceholderText(/Slides da Apresentação/i)).toBeInTheDocument();
    });
  });

  it("deve fechar o modal ao clicar em Cancelar", async () => {
    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Mastering React 19"));

    fireEvent.click(screen.getByText(/Adicionar Material/i));
    await waitFor(() => screen.getByPlaceholderText(/Slides da Apresentação/i));

    fireEvent.click(screen.getByText(/Cancelar/i));

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Slides da Apresentação/i)).not.toBeInTheDocument();
    });
  });

  it("deve enviar o material com sucesso via modal", async () => {
    (speakersService.addActivityMaterial as any).mockResolvedValue({ id: "mat-1" });
    (speakersService.getMyActivities as any)
      .mockResolvedValueOnce(mockActivities)
      .mockResolvedValueOnce(mockActivities);

    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Mastering React 19"));

    fireEvent.click(screen.getByText(/Adicionar Material/i));
    await waitFor(() => screen.getByPlaceholderText(/Slides da Apresentação/i));

    fireEvent.change(screen.getByPlaceholderText(/Slides da Apresentação/i), {
      target: { value: "Slides da Palestra" },
    });
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/drive\.google\.com/i), {
      target: { value: "https://storage.com/slides.pdf" },
    });

    // Submit o formulário diretamente via o botão de tipo submit
    const submitBtn = screen.getByRole("button", { name: /^Adicionar$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(speakersService.addActivityMaterial).toHaveBeenCalledWith("act-1", {
        title: "Slides da Palestra",
        fileUrl: "https://storage.com/slides.pdf",
        fileType: "SLIDES",
      });
      expect(toast.success).toHaveBeenCalledWith("Material adicionado com sucesso!");
    });
  });

  it("deve exibir erro se o envio de material falhar", async () => {
    (speakersService.addActivityMaterial as any).mockRejectedValue(new Error("API Error"));

    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Mastering React 19"));

    fireEvent.click(screen.getByText(/Adicionar Material/i));
    await waitFor(() => screen.getByPlaceholderText(/Slides da Apresentação/i));

    fireEvent.change(screen.getByPlaceholderText(/Slides da Apresentação/i), {
      target: { value: "Falha" },
    });
    fireEvent.change(screen.getByPlaceholderText(/https:\/\/drive\.google\.com/i), {
      target: { value: "https://bad.url" },
    });

    const submitBtn = screen.getByRole("button", { name: /^Adicionar$/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao adicionar material.");
    });
  });

  it("deve exibir materiais já enviados", async () => {
    (speakersService.getMyActivities as any).mockResolvedValue(mockActivities);

    render(<SpeakerActivitiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Slides - Tema A")).toBeInTheDocument();
      expect(screen.getByText("Link Útil")).toBeInTheDocument();
      // O TrashIcon está associado a cada material e agora deve renderizar
      expect(screen.getAllByTestId("TrashIcon").length).toBe(2);
    });
  });

  it("deve remover um material ao clicar na lixeira", async () => {
    (speakersService.getMyActivities as any).mockResolvedValue(mockActivities);
    (speakersService.removeActivityMaterial as any).mockResolvedValue();

    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Slides - Tema A"));

    // Abre o modal
    const trashButtons = screen.getAllByTestId("TrashIcon");
    fireEvent.click(trashButtons[0]);

    // O modal deve ser exibido
    await waitFor(() => {
      expect(screen.getByText("Remover Material")).toBeInTheDocument();
      expect(screen.getByText("Tem certeza que deseja remover este material? Esta ação não pode ser desfeita e os participantes não terão mais acesso a ele.")).toBeInTheDocument();
    });

    // Clica no botão "Sim, remover material"
    const confirmButton = screen.getByRole("button", { name: "Sim, remover material" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(speakersService.removeActivityMaterial).toHaveBeenCalledWith("act-1", "mat-1");
      expect(toast.success).toHaveBeenCalledWith("Material removido com sucesso!");
    });
  });

  it("deve exibir estado vazio se não houver atividades", async () => {
    (speakersService.getMyActivities as any).mockResolvedValue([]);
    render(<SpeakerActivitiesPage />);

    await waitFor(() => {
      expect(screen.getByText("Você não tem atividades vinculadas a este evento.")).toBeInTheDocument();
    });
  });
});
