import { render, renderHook, act, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import Cookies from 'js-cookie';
import React from 'react';

// Desativa o mock global definido no test-setup.tsx para testar a implementação real
vi.unmock('@/context/AuthContext');

// Mock do next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock do js-cookie
vi.mock('js-cookie', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  },
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    (Cookies.get as any).mockReturnValue(undefined);
  });

  it('deve carregar informações do localStorage na inicialização', async () => {
    const mockUser = { id: '1', name: 'Saved User', email: 'saved@test.com', role: 'ORGANIZER' };
    localStorage.setItem('eventhub_user', JSON.stringify(mockUser));
    localStorage.setItem('eventhub_token', 'saved-tk');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user?.name).toBe('Saved User');
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.isLoading).toBe(false);
    });

    expect(Cookies.set).toHaveBeenCalledWith('eventhub_token', 'saved-tk', expect.any(Object));
  });

  it('deve sincronizar refresh_token com cookie se existir no localStorage mas não no cookie', async () => {
    localStorage.setItem('eventhub_user', JSON.stringify({ id: '1' }));
    localStorage.setItem('eventhub_token', 'atk');
    localStorage.setItem('eventhub_refresh_token', 'rtk');

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(Cookies.set).toHaveBeenCalledWith('eventhub_token', 'atk', expect.any(Object));
      expect(Cookies.set).toHaveBeenCalledWith('eventhub_refresh_token', 'rtk', expect.any(Object));
    });
  });

  it('deve limpar localStorage se o JSON estiver corrompido', async () => {
    localStorage.setItem('eventhub_user', 'invalid-json');
    localStorage.setItem('eventhub_token', 'tk');

    renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(localStorage.getItem('eventhub_user')).toBeNull();
    });
  });

  it('deve realizar login e redirecionar para o dashboard para ORGANIZER', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    
    // Espera inicialização
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const authData = {
      user: { id: '1', name: 'John', email: 'john@test.com', role: 'ORGANIZER' },
      access_token: 'tk-123',
      refresh_token: 'rf-123'
    };

    act(() => {
      result.current.login(authData as any);
    });

    expect(result.current.user?.name).toBe('John');
    expect(localStorage.getItem('eventhub_token')).toBe('tk-123');
    expect(Cookies.set).toHaveBeenCalledWith('eventhub_token', 'tk-123', expect.any(Object));
    expect(mockPush).toHaveBeenCalledWith('/dashboard');
  });

  it('deve realizar login e redirecionar para /profile para PARTICIPANT', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const authData = {
      user: { id: '1', name: 'John', email: 'john@test.com', role: 'PARTICIPANT' },
      access_token: 'tk-123',
      refresh_token: 'rf-123'
    };

    act(() => {
      result.current.login(authData as any);
    });

    expect(mockPush).toHaveBeenCalledWith('/profile');
  });

  it('deve realizar login e redirecionar para /speaker para SPEAKER', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login({
        user: { id: '1', name: 'Jane', email: 'jane@test.com', role: 'SPEAKER' },
        access_token: 'tk',
        refresh_token: 'rf',
      } as any);
    });

    expect(mockPush).toHaveBeenCalledWith('/speaker');
  });

  it('deve realizar login e redirecionar para /admin/dashboard para SUPER_ADMIN', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login({
        user: { id: '1', name: 'Sa', email: 'sa@test.com', role: 'SUPER_ADMIN' },
        access_token: 'tk',
        refresh_token: 'rf',
      } as any);
    });

    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard');
  });

  it('deve redirecionar para troca de senha se mustChangePassword for verdade no login', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    const authData = {
      user: { id: '1', name: 'New User', email: 'new@test.com', role: 'ORGANIZER', mustChangePassword: true },
      access_token: 'tk-123',
      refresh_token: 'rf-123'
    };

    act(() => {
      result.current.login(authData as any);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/force-password-change');
  });

  it('deve realizar logout e limpar armazenamento', async () => {
    localStorage.setItem('eventhub_user', JSON.stringify({ id: '1' }));
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('eventhub_user')).toBeNull();
    expect(Cookies.remove).toHaveBeenCalledWith('eventhub_token');
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('deve atualizar o usuário corretamente', async () => {
    const mockUser = { id: '1', name: 'Original', email: 'orig@test.com', role: 'ORGANIZER' };
    localStorage.setItem('eventhub_user', JSON.stringify(mockUser));
    localStorage.setItem('eventhub_token', 'fake-tk');
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.updateUser({ name: 'Updated' });
    });

    expect(result.current.user?.name).toBe('Updated');
    const savedUser = JSON.parse(localStorage.getItem('eventhub_user')!);
    expect(savedUser.name).toBe('Updated');
  });

  it('deve redirecionar para force-password-change se o estado do usuário mudar via hook', async () => {
    const { result, rerender } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // Define um usuário que precisa trocar senha
    act(() => {
      result.current.login({
        user: { id: '1', name: 'User', mustChangePassword: true },
        access_token: 'abc',
        refresh_token: 'def'
      } as any);
    });

    expect(mockPush).toHaveBeenCalledWith('/dashboard/force-password-change');
  });
});
