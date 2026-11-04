/**
 * MIRAI Authentication & Token Management Client
 *
 * Centralizes Bearer token injection, session persistence, and authenticated fetch
 * for both Admin and User routes across iframe and standalone environments.
 */

const AUTH_TOKEN_KEY = 'mirai_auth_token';
const ADMIN_TOKEN_KEY = 'mirai_admin_token';
const ADMIN_SESSION_KEY = 'mirai_admin_session_token';
const USER_KEY = 'mirai_auth_user';

export function getAuthToken(): string | null {
  try {
    return (
      localStorage.getItem(AUTH_TOKEN_KEY) ||
      sessionStorage.getItem(ADMIN_SESSION_KEY) ||
      localStorage.getItem(ADMIN_TOKEN_KEY) ||
      null
    );
  } catch {
    return null;
  }
}

export function setAuthToken(token: string): void {
  try {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
    sessionStorage.setItem(ADMIN_SESSION_KEY, token);
  } catch {}
}

export function clearAuthTokens(): void {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  } catch {}
}

export function getAuthHeaders(customHeaders: Record<string, string> = {}): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...customHeaders,
  };

  const token = getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    headers['x-admin-token'] = token;
  }

  return headers;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const headers = new Headers(init.headers || {});

  if (!headers.has('Content-Type') && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }

  if (token) {
    if (!headers.has('Authorization')) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    if (!headers.has('x-admin-token')) {
      headers.set('x-admin-token', token);
    }
  }

  return fetch(input, {
    ...init,
    headers,
    credentials: 'include',
  });
}
