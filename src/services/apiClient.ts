/**
 * MIRAI Centralized API Client
 * Configurable base URL, token authorization, error interceptors, and typed methods.
 */

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  code?: string;
  status: number;
  ok: boolean;
}

// Configurable API Base URL (defaults to same-origin in development/production)
export const API_BASE_URL = (
  typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL
    ? String(import.meta.env.VITE_API_URL).replace(/\/+$/, '')
    : ''
);

class ApiClient {
  private token: string | null = null;

  constructor() {
    this.token = this.loadInitialToken();
  }

  private loadInitialToken(): string | null {
    try {
      if (typeof window === 'undefined') return null;
      return (
        sessionStorage.getItem('mirai_session_token') ||
        sessionStorage.getItem('mirai_admin_session_token') ||
        localStorage.getItem('mirai_token')
      );
    } catch {
      return null;
    }
  }

  public setToken(token: string | null): void {
    this.token = token;
    try {
      if (typeof window !== 'undefined') {
        if (token) {
          sessionStorage.setItem('mirai_session_token', token);
        } else {
          sessionStorage.removeItem('mirai_session_token');
          sessionStorage.removeItem('mirai_admin_session_token');
          localStorage.removeItem('mirai_token');
        }
      }
    } catch {}
  }

  public getToken(): string | null {
    return this.token || this.loadInitialToken();
  }

  private buildUrl(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${API_BASE_URL}${cleanPath}`;
  }

  public async request<T = any>(
    path: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = this.buildUrl(path);
    const headers = new Headers(options.headers || {});

    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
      headers.set('Content-Type', 'application/json');
    }

    const token = this.getToken();
    if (token && !headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    try {
      const res = await fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Ensures HTTP-only session cookies are sent
      });

      const contentType = res.headers.get('content-type') || '';
      let data: any = null;

      if (contentType.includes('application/json')) {
        data = await res.json().catch(() => null);
      } else {
        data = await res.text().catch(() => null);
      }

      if (!res.ok) {
        const errorMsg =
          (data && typeof data === 'object' && (data.error || data.message)) ||
          `Request failed with status ${res.status}`;

        return {
          ok: false,
          status: res.status,
          error: errorMsg,
          code: data?.code,
          data,
        };
      }

      return {
        ok: true,
        status: res.status,
        data,
      };
    } catch (err: any) {
      return {
        ok: false,
        status: 0,
        error: err.message || 'Network error occurred. Please verify server connection.',
      };
    }
  }

  public get<T = any>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  public post<T = any>(path: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  }

  public put<T = any>(path: string, body?: any, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    });
  }

  public delete<T = any>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
