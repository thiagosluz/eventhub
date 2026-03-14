'use server';

import { cookies } from 'next/headers';
import { apiClient } from '@/lib/api-client';

const TOKEN_NAME = 'eventhub_token';

interface LoginResponse {
  token: string;
}

export async function loginAction(data: Record<string, unknown>) {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    
    // Store token in HttpOnly cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: TOKEN_NAME,
      value: response.data.token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7, // 1 week
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || 'Erro ao realizar login',
    };
  }
}

export async function registerParticipantAction(data: Record<string, unknown>) {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/register-participant', data);
    
    const cookieStore = await cookies();
    cookieStore.set({
      name: TOKEN_NAME,
      value: response.data.token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || 'Erro ao realizar cadastro',
    };
  }
}

export async function registerOrganizerAction(data: Record<string, unknown>) {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/register-organizer', data);
    
    const cookieStore = await cookies();
    cookieStore.set({
      name: TOKEN_NAME,
      value: response.data.token,
      httpOnly: true,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      sameSite: 'lax',
    });

    return { success: true };
  } catch (error: unknown) {
    const err = error as { response?: { data?: { message?: string } } };
    return {
      success: false,
      error: err.response?.data?.message || 'Erro ao registrar organizador',
    };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
  return { success: true };
}

export async function getToken() {
  const cookieStore = await cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}
