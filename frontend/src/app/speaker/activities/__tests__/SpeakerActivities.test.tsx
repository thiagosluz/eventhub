import { render, screen, fireEvent, waitFor } from "@/test-utils";
import SpeakerActivitiesPage from "../page";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { speakersService } from "@/services/speakers.service";
import { toast } from "react-hot-toast";

// Mock do @heroicons/react
vi.mock("@heroicons/react/24/outline", () => ({
  CalendarIcon: (props: any) => <div {...props} />,
  MapPinIcon: (props: any) => <div {...props} />,
  UserGroupIcon: (props: any) => <div {...props} />,
  CloudArrowUpIcon: (props: any) => <div {...props} />,
  DocumentIcon: (props: any) => <div {...props} />,
  CheckBadgeIcon: (props: any) => <div {...props} />,
}));

// Mock do speakersService
vi.mock("@/services/speakers.service", () => ({
  speakersService: {
    getMyActivities: vi.fn(),
    addActivityMaterial: vi.fn(),
  },
}));

// Mock do react-hot-toast
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
        event: { name: "Web Summit 2024" }
      }
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (speakersService.getMyActivities as any).mockResolvedValue(mockActivities);
    // Mock do window.prompt
    vi.stubGlobal("prompt", vi.fn());
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

  it("deve processar o envio de material (slides) com sucesso", async () => {
    (window.prompt as any)
      .mockReturnValueOnce("Slides da Palestra") // Título
      .mockReturnValueOnce("https://storage.com/slides.pdf"); // URL
    
    (speakersService.addActivityMaterial as any).mockResolvedValue({ id: "mat-1" });

    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Mastering React 19"));

    const uploadBtn = screen.getByText(/Enviar Slides/i);
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(speakersService.addActivityMaterial).toHaveBeenCalledWith("act-1", {
        title: "Slides da Palestra",
        fileUrl: "https://storage.com/slides.pdf",
        fileType: "PDF"
      });
      expect(toast.success).toHaveBeenCalledWith("Material adicionado com sucesso!");
    });
  });

  it("deve exibir erro se o envio de material falhar", async () => {
    (window.prompt as any)
      .mockReturnValueOnce("Falha")
      .mockReturnValueOnce("https://bad.url");
    
    (speakersService.addActivityMaterial as any).mockRejectedValue(new Error("API Error"));

    render(<SpeakerActivitiesPage />);

    await waitFor(() => screen.getByText("Mastering React 19"));

    fireEvent.click(screen.getByText(/Enviar Slides/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith("Erro ao adicionar material.");
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
