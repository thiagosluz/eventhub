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
  private isRefreshing = false;
  private failedQueue: any[] = [];

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });

    this.failedQueue = [];
  }

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
      // Handle 401 Unauthorized - Token expired
      if (response.status === 401 && !path.includes('/auth/login') && !path.includes('/auth/refresh')) {
        if (this.isRefreshing) {
          return new Promise((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              return this.request<T>(path, options);
            })
            .catch((err) => {
              throw err;
            });
        }

        this.isRefreshing = true;

        try {
          const refreshToken = typeof window !== 'undefined' 
            ? localStorage.getItem('eventhub_refresh_token')
            : null;

          if (!refreshToken) {
            throw new Error('No refresh token available');
          }

          const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken }),
          });

          if (!refreshResponse.ok) {
            throw new Error('Refresh token invalid');
          }

          const refreshData = await refreshResponse.json();
          const newToken = refreshData.access_token;
          const newRefreshToken = refreshData.refresh_token;

          if (typeof window !== 'undefined') {
            localStorage.setItem('eventhub_token', newToken);
            localStorage.setItem('eventhub_refresh_token', newRefreshToken);
            // Also update cookies for SSR
            document.cookie = `eventhub_token=${newToken}; path=/; max-age=604800`;
            document.cookie = `eventhub_refresh_token=${newRefreshToken}; path=/; max-age=604800`;
          }

          this.processQueue(null, newToken);
          return this.request<T>(path, options);
        } catch (refreshError) {
          this.processQueue(refreshError, null);
          // If refresh fails, logout
          if (typeof window !== 'undefined') {
            localStorage.removeItem('eventhub_token');
            localStorage.removeItem('eventhub_refresh_token');
            localStorage.removeItem('eventhub_user');
            document.cookie = "eventhub_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            document.cookie = "eventhub_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            window.location.href = '/login';
          }
          throw refreshError;
        } finally {
          this.isRefreshing = false;
        }
      }

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
