import { render, screen, fireEvent, waitFor } from '@/test-utils';
import userEvent from '@testing-library/user-event';
import { ActivityForm } from '../ActivityForm';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { activityTypesService, speakerRolesService } from '@/services/management.service';
import { speakersService } from '@/services/speakers.service';

// Mock dos serviços
vi.mock('@/services/management.service', () => ({
  activityTypesService: {
    list: vi.fn(),
  },
  speakerRolesService: {
    list: vi.fn(),
  },
}));

vi.mock('@/services/speakers.service', () => ({
  speakersService: {
    getSpeakers: vi.fn(),
  },
}));

describe('ActivityForm Component', () => {
  const mockTypes = [{ id: 'type-1', name: 'Palestra' }, { id: 'type-2', name: 'Workshop' }];
  const mockRoles = [{ id: 'role-1', name: 'Palestrante' }, { id: 'role-2', name: 'Mediador' }];
  const mockSpeakers = [
    { id: 'speaker-1', name: 'John Doe', avatarUrl: null },
    { id: 'speaker-2', name: 'Jane Smith', avatarUrl: 'http://example.com/avatar.jpg' }
  ];

  const defaultProps = {
    onSubmit: vi.fn(),
    isLoading: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (activityTypesService.list as any).mockResolvedValue(mockTypes);
    (speakerRolesService.list as any).mockResolvedValue(mockRoles);
    (speakersService.getSpeakers as any).mockResolvedValue(mockSpeakers);
  });

  it('deve carregar dados iniciais dos serviços e renderizar o formulário vazio', async () => {
    render(<ActivityForm {...defaultProps} />);

    expect(screen.getByPlaceholderText('Ex: Palestra de Abertura')).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Palestra')).toBeInTheDocument();
      expect(screen.getByText('Workshop')).toBeInTheDocument();
    });
  });

  it('deve preencher o formulário com initialData para edição', async () => {
    const initialData = {
      title: 'Atividade Existente',
      description: 'Uma descrição legal',
      type: { id: 'type-1' },
      startAt: '2024-05-01T10:00:00Z',
      endAt: '2024-05-01T11:00:00Z',
      capacity: 50,
      requiresEnrollment: true,
      speakers: []
    };

    render(<ActivityForm {...defaultProps} initialData={initialData as any} />);

    expect(screen.getByDisplayValue('Atividade Existente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Uma descrição legal')).toBeInTheDocument();
    expect(screen.getByLabelText('Requer Inscrição Prévia')).toBeChecked();
  });

  it('deve permitir adicionar e remover palestrantes', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);

    // Por padrão não tem palestrantes
    expect(screen.getByText('Nenhum palestrante associado.')).toBeInTheDocument();

    // Adiciona um palestrante
    const addButton = screen.getByText(/Adicionar Palestrante/i);
    await user.click(addButton);

    await waitFor(() => {
      expect(screen.queryByText('Nenhum palestrante associado.')).not.toBeInTheDocument();
      expect(screen.getByText('Papel')).toBeInTheDocument();
    });

    // Remove o palestrante
    const removeButton = screen.getByTestId('icon-TrashIcon').closest('button')!;
    await user.click(removeButton);

    expect(screen.getByText('Nenhum palestrante associado.')).toBeInTheDocument();
  });

  it('deve mostrar campos de confirmação quando Requer Inscrição for marcado', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    
    const enrollmentCheckbox = screen.getByLabelText('Requer Inscrição Prévia');
    expect(screen.queryByText('Requer Confirmação do Participante')).not.toBeInTheDocument();

    await user.click(enrollmentCheckbox);
    expect(screen.getByText('Requer Confirmação do Participante')).toBeInTheDocument();
  });

  it('deve chamar onSubmit com os dados corretos ao submeter o formulário', async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(<ActivityForm {...defaultProps} onSubmit={onSubmitMock} />);

    // Preenche campos básicos
    await user.type(screen.getByPlaceholderText('Ex: Palestra de Abertura'), 'Nova Palestra');
    
    // Seleciona um tipo (precisa esperar carregar)
    await waitFor(() => expect(screen.getByText('Palestra')).toBeInTheDocument());
    await user.selectOptions(screen.getByLabelText(/Tipo de Atividade/i), 'type-1');

    // Preenche datas
    fireEvent.change(screen.getByLabelText('Data/Hora Início'), { target: { value: '2024-06-01T09:00' } });
    fireEvent.change(screen.getByLabelText('Data/Hora Término'), { target: { value: '2024-06-01T10:00' } });

    // Submete pelo botão de submit
    const submitBtn = screen.getByRole('button', { name: /Criar Atividade/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalled();
    }, { timeout: 3000 });
  });

  it('deve renderizar estado de carregamento no botão', () => {
    render(<ActivityForm {...defaultProps} isLoading={true} />);
    
    const submitButton = screen.getByRole('button', { name: '' });
    expect(submitButton).toBeDisabled();
    expect(submitButton.querySelector('.animate-spin')).toBeInTheDocument();
  });
});
