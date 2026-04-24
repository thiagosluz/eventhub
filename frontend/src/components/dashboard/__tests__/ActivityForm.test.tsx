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
    expect(screen.getByLabelText(/Requer Inscrição Prévia/i)).toBeChecked();
  });

  it('deve preencher palestrantes a partir de initialData', async () => {
    const initialData = {
      title: 'Workshop com Palestrante',
      speakers: [
        { speaker: { id: 'speaker-1' }, role: { id: 'role-1' } }
      ]
    };

    render(<ActivityForm {...defaultProps} initialData={initialData as any} />);

    await waitFor(() => {
      expect(screen.getAllByLabelText('Palestrante')[0]).toHaveValue('speaker-1');
      expect(screen.getByLabelText('Papel')).toHaveValue('role-1');
    });
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

  it('deve atualizar palestrante e papel individualmente', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);

    // Adiciona um palestrante
    await user.click(screen.getByText(/Adicionar Palestrante/i));

    // Seleciona palestrante e papel
    const speakerSelect = screen.getByLabelText('Palestrante');
    const roleSelect = screen.getByLabelText('Papel');

    await user.selectOptions(speakerSelect, 'speaker-1');
    await user.selectOptions(roleSelect, 'role-1');

    expect(speakerSelect).toHaveValue('speaker-1');
    expect(roleSelect).toHaveValue('role-1');
  });

  it('deve renderizar o avatar do palestrante quando disponível', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);

    await user.click(screen.getByText(/Adicionar Palestrante/i));
    
    // Seleciona palestrante COM avatar (speaker-2)
    const speakerSelect = screen.getByLabelText('Palestrante');
    await user.selectOptions(speakerSelect, 'speaker-2');

    const avatar = screen.getByAltText('Avatar');
    expect(avatar).toHaveAttribute('src', 'http://example.com/avatar.jpg');
  });

  it('deve mostrar campos de confirmação quando Requer Inscrição for marcado', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);
    
    const enrollmentCheckbox = screen.getByLabelText(/Requer Inscrição Prévia/i);
    expect(screen.queryByText(/Requer Confirmação do Participante/i)).not.toBeInTheDocument();

    await user.click(enrollmentCheckbox);
    expect(screen.getByText(/Requer Confirmação do Participante/i)).toBeInTheDocument();

    // Marca Requer Confirmação
    const confirmationCheckbox = screen.getByLabelText(/Requer Confirmação do Participante/i);
    await user.click(confirmationCheckbox);
    expect(screen.getByText(/Prazo para Confirmação/i)).toBeInTheDocument();

    // Seleciona dias
    const daysSelect = screen.getByLabelText(/Prazo para Confirmação/i);
    await user.selectOptions(daysSelect, '3');
    expect(daysSelect).toHaveValue('3');
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
    fireEvent.change(screen.getByLabelText(/Data\/Hora Início/i), { target: { value: '2024-06-01T09:00' } });
    fireEvent.change(screen.getByLabelText(/Data\/Hora Término/i), { target: { value: '2024-06-01T10:00' } });

    // Submete pelo botão de submit
    const submitBtn = screen.getByRole('button', { name: /Criar Atividade/i });
    await user.click(submitBtn);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Nova Palestra',
        typeId: 'type-1',
        startAt: '2024-06-01T09:00',
        endAt: '2024-06-01T10:00'
      }));
    });
  });

  it('deve realizar conversões numéricas e filtrar palestrantes vazios no onSubmit', async () => {
    const user = userEvent.setup();
    const onSubmitMock = vi.fn().mockResolvedValue(undefined);
    render(<ActivityForm {...defaultProps} onSubmit={onSubmitMock} />);

    await user.type(screen.getByLabelText(/Título/i), 'Atividade Expert');
    
    // Datas obrigatórias
    fireEvent.change(screen.getByLabelText(/Data\/Hora Início/i), { target: { value: '2024-06-01T09:00' } });
    fireEvent.change(screen.getByLabelText(/Data\/Hora Término/i), { target: { value: '2024-06-01T10:00' } });

    // Capacidade como string no input, deve ser number no submit
    await user.type(screen.getByLabelText(/Capacidade/i), '100');

    // Adiciona 2 palestrantes, mas preenche só um
    const addButton = screen.getByText(/Adicionar Palestrante/i);
    await user.click(addButton);
    await user.click(addButton);

    const speakerSelects = screen.getAllByLabelText('Palestrante');
    await user.selectOptions(speakerSelects[0], 'speaker-1');
    // Deixa o segundo vazio

    // Ativa inscrição e confirmação para testar Number(confirmationDays)
    await user.click(screen.getByLabelText(/Requer Inscrição Prévia/i));
    await user.click(screen.getByLabelText(/Requer Confirmação do Participante/i));
    await user.selectOptions(screen.getByLabelText(/Prazo/), '5');

    await user.click(screen.getByRole('button', { name: /Criar Atividade/i }));

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith(expect.objectContaining({
        capacity: 100,
        confirmationDays: 5,
        requiresConfirmation: true,
        speakers: [{ speakerId: 'speaker-1', roleId: '' }]
      }));
    });
  });

  it('deve lidar com erro ao carregar dados iniciais', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (activityTypesService.list as any).mockRejectedValue(new Error('Falha no carregamento'));
    
    render(<ActivityForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load activity form data:', 
        expect.any(Error)
      );
    });
    consoleSpy.mockRestore();
  });

  it('deve sincronizar formData quando initialData muda externamente', async () => {
    const { rerender } = render(<ActivityForm {...defaultProps} initialData={null} />);
    expect(screen.getByLabelText(/Título/i)).toHaveValue('');

    const initialData = {
      title: 'Nova Atividade v2',
      speakers: []
    } as any;

    rerender(<ActivityForm {...defaultProps} initialData={initialData} />);
    expect(screen.getByDisplayValue('Nova Atividade v2')).toBeInTheDocument();
    
    rerender(<ActivityForm {...defaultProps} initialData={null} />);
    expect(screen.getByLabelText(/Título/i)).toHaveValue('');
  });

  it('deve atualizar descrição e localização', async () => {
    const user = userEvent.setup();
    render(<ActivityForm {...defaultProps} />);

    const descInput = screen.getByLabelText(/Descrição/i);
    const locInput = screen.getByLabelText(/Localização/i);

    await user.type(descInput, 'Nova descrição');
    await user.type(locInput, 'Sala 101');

    expect(descInput).toHaveValue('Nova descrição');
    expect(locInput).toHaveValue('Sala 101');
  });

  it('deve usar valores padrão quando initialData está incompleto', async () => {
    const initialData = {
      title: undefined,
      speakers: [
        { speakerId: 'speaker-1', roleId: 'role-1' }, // ID direto
        { speaker: { id: 'speaker-2' }, role: { id: 'role-2' } }, // Objeto aninhado
        { speaker: {}, role: {} } // Objetos vazios
      ]
    };

    render(<ActivityForm {...defaultProps} initialData={initialData as any} />);

    expect(screen.getByLabelText(/Título/i)).toHaveValue('');
    await waitFor(() => {
        const speakerSelects = screen.getAllByLabelText(/Palestrante/i);
        expect(speakerSelects[0]).toHaveValue('speaker-1');
        expect(speakerSelects[1]).toHaveValue('speaker-2');
        expect(speakerSelects[2]).toHaveValue('');
    });
  });

  it('deve lidar com initialData sem a propriedade speakers', () => {
    const initialData = { title: 'Atividade Simples' };
    render(<ActivityForm {...defaultProps} initialData={initialData as any} />);
    expect(screen.getByDisplayValue('Atividade Simples')).toBeInTheDocument();
  });

  it('deve renderizar estado de carregamento no botão', () => {
    render(<ActivityForm {...defaultProps} isLoading={true} />);
    const submitButton = screen.getByRole('button', { name: /Criar Atividade/i });
    expect(submitButton).toBeDisabled();
    expect(submitButton).toHaveAttribute('aria-busy', 'true');
  });
});
