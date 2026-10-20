import { UserProfile } from '../types';

const TOKEN_KEY = 'thamtutoannhi_auth_token';
const USER_KEY = 'thamtutoannhi_user';

export function getAuthToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAuthSession(token: string, user: UserProfile): void {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn('Storage warning:', err);
  }
}

export function clearAuthSession(): void {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  } catch (err) {
    console.warn('Storage warning:', err);
  }
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): Record<string, string> {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...extraHeaders,
  };
}

export async function verifyCurrentSession(): Promise<UserProfile | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/verify-session', {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!res.ok) {
      clearAuthSession();
      return null;
    }

    const data = await res.json();
    if (data.ok && data.user) {
      // Refresh cached user in storage
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      return data.user as UserProfile;
    }

    clearAuthSession();
    return null;
  } catch (err) {
    console.error('Session verification network error:', err);
    // If offline, check local saved user as fallback display only
    try {
      const saved = localStorage.getItem(USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }
}
