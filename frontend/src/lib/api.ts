const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

const TOKEN_KEY = "eventhub_token";

export function getApiUrl(): string {
  return API_URL;
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(TOKEN_KEY);
}

export async function fetchWithAuth(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  const headers: HeadersInit = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_URL}${path}`, { ...options, headers });
}
