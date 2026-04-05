import { render, screen, fireEvent, waitFor } from '@/test-utils';
import { SpeakerForm } from '../SpeakerForm';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { speakersService } from '@/services/speakers.service';

// Mock do serviço de palestrantes
vi.mock('@/services/speakers.service', () => ({
  speakersService: {
    uploadAvatar: vi.fn(),
  },
}));

describe('SpeakerForm Component', () => {
  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deve renderizar o formulário de palestrante vazio corretamente', () => {
    render(<SpeakerForm {...defaultProps} />);

    expect(screen.getByLabelText(/Nome do Palestrante/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/E-mail/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Biografia/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Criar Palestrante/i })).toBeInTheDocument();
  });

  it('deve preencher o formulário com dados iniciais para edição', () => {
    const initialData = {
      id: 'sp-1',
      name: 'Dr. Jane Doe',
      email: 'jane@example.com',
      bio: 'Especialista em AI',
      avatarUrl: 'http://example.com/avatar.jpg'
    };

    render(<SpeakerForm {...defaultProps} initialData={initialData} />);

    expect(screen.getByDisplayValue('Dr. Jane Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('jane@example.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Especialista em AI')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Salvar Alterações/i })).toBeInTheDocument();
  });

  it('deve simular o upload de imagem', async () => {
    (speakersService.uploadAvatar as any).mockResolvedValue({ url: 'http://new-avatar.com/image.jpg' });
    
    render(<SpeakerForm {...defaultProps} />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' }); // O input file está escondido sob a label com ícone
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(speakersService.uploadAvatar).toHaveBeenCalledWith(file);
    });
  });

  it('deve chamar onSubmit ao submeter o formulário', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(<SpeakerForm {...defaultProps} onSubmit={onSubmitMock} />);

    fireEvent.change(screen.getByLabelText(/Nome do Palestrante/i), { target: { value: 'John Smith' } });
    fireEvent.change(screen.getByLabelText(/E-mail/i), { target: { value: 'john@smith.com' } });

    const submitButton = screen.getByRole('button', { name: /Criar Palestrante/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Smith',
        email: 'john@smith.com'
      }));
    });
  });

  it('deve atualizar links sociais corretamente', async () => {
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(<SpeakerForm {...defaultProps} onSubmit={onSubmitMock} />);

    fireEvent.change(screen.getByLabelText(/Nome do Palestrante/i), { target: { value: 'John Social' } });
    fireEvent.change(screen.getByPlaceholderText(/linkedin\.com/i), { target: { value: 'https://linkedin.com/in/perfil' } });
    fireEvent.change(screen.getByPlaceholderText(/janedoe\.com/i), { target: { value: 'https://janedoe.com' } });

    fireEvent.click(screen.getByRole('button', { name: /Criar Palestrante/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
        name: 'John Social',
        linkedinUrl: 'https://linkedin.com/in/perfil',
        websiteUrl: 'https://janedoe.com'
      }));
    });
  });

  it('deve tratar erro no upload de imagem', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (speakersService.uploadAvatar as any).mockRejectedValue(new Error('Upload failed'));
    
    render(<SpeakerForm {...defaultProps} />);
    
    const file = new File(['hello'], 'hello.png', { type: 'image/png' });
    const input = screen.getByLabelText('', { selector: 'input[type="file"]' });
    
    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error uploading avatar:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('deve chamar window.history.back ao clicar em cancelar', () => {
    const backSpy = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<SpeakerForm {...defaultProps} />);
    
    fireEvent.click(screen.getByRole('button', { name: /Cancelar/i }));
    
    expect(backSpy).toHaveBeenCalled();
    backSpy.mockRestore();
  });

  it('deve desabilitar botões durante o carregamento', () => {
    render(<SpeakerForm {...defaultProps} isLoading={true} />);
    
    expect(screen.getByRole('button', { name: /Salvando\.\.\./i })).toBeDisabled();
  });
});
