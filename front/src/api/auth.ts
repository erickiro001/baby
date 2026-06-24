import { api } from '@/lib/api';

// ─── Types ───
export interface UserSafeView {
  id: number;
  username: string;
  email: string;
}

export interface LoginResponse {
  token: string;
  user: UserSafeView;
}

interface ApiWrapper<T> {
  code: number;
  message: string;
  data: T;
}

interface ApiError {
  message: string;
  status?: number;
  data?: { code?: number; message?: string };
}

// ─── API ───
const BASE = '/api/v1';

export async function login(username: string, password: string): Promise<LoginResponse> {
  const wrapper = await api.post<ApiWrapper<LoginResponse>>(`${BASE}/auth/login`, { username, password });
  return wrapper.data;
}

export async function register(username: string, email: string, password: string): Promise<LoginResponse> {
  const wrapper = await api.post<ApiWrapper<LoginResponse>>(`${BASE}/auth/register`, { username, email, password });
  return wrapper.data;
}

export async function getProfile(): Promise<UserSafeView> {
  const wrapper = await api.get<ApiWrapper<UserSafeView>>(`${BASE}/profile`);
  return wrapper.data;
}

export function getErrorMessage(err: unknown, defaultMsg: string): string {
  if (err && typeof err === 'object') {
    const apiErr = err as ApiError;
    if (apiErr.data?.message) return apiErr.data.message;
    if (apiErr.message) return apiErr.message;
  }
  return defaultMsg;
}
