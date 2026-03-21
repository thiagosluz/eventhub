const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface ApiError extends Error {
  status?: number;
  response?: {
    status: number;
    data: unknown;
  };
}

export type ApiRequestOptions = RequestInit & { params?: Record<string, any> };

class ApiClient {
  private async request<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
    let url = `${API_BASE_URL}${path}`;
    
    if (options.params) {
      const searchParams = new URLSearchParams();
      Object.entries(options.params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `${url.includes('?') ? '&' : '?'}${queryString}`;
      }
    }
    
    let token = null;

    if (typeof window !== 'undefined') {
      token = localStorage.getItem('eventhub_token');
    } else {
      // Server-side: Try to get from next/headers
      try {
        const { cookies } = await import('next/headers');
        const cookieStore = await cookies();
        token = cookieStore.get('eventhub_token')?.value;
      } catch {
        // Fallback or silence if not in a request context
      }
    }

    const isFormData = options.body instanceof FormData;

    const headers: Record<string, string> = {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...((options.headers as Record<string, string>) || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, { ...options, headers });

    const text = await response.text();
    let data;
    const contentType = response.headers.get('content-type');
    
    if (contentType?.includes('application/json')) {
      data = text ? JSON.parse(text) : {};
    } else {
      data = text;
    }

    if (!response.ok) {
      const error = new Error(data.message || `API Error: ${response.status}`) as ApiError;
      error.status = response.status;
      error.response = { status: response.status, data };
      throw error;
    }

    return data;
  }

  get<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  post<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "POST",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  patch<T>(path: string, body?: unknown, options?: ApiRequestOptions) {
    return this.request<T>(path, {
      ...options,
      method: "PATCH",
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  }

  delete<T>(path: string, options?: ApiRequestOptions) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const api = new ApiClient();
