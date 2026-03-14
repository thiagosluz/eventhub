import axios from 'axios';
import { getToken } from '@/actions/auth.actions';

const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor — attach JWT from HttpOnly cookie via Server Action
apiClient.interceptors.request.use(
  async (config) => {
    // getToken() is a Server Action that reads the HttpOnly cookie
    // on the Next.js server and returns the token value
    try {
      const token = await getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // Server Action may fail during SSR prerender — ignore silently
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle global errors, e.g., 401 Unauthorized
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Redirect to login on auth failure
        window.location.assign('/login');
      }
    }
    return Promise.reject(error);
  }
);
