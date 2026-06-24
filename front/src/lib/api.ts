/* ═══════════════════════════════════════════
   API Client
   ═══════════════════════════════════════════ */

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
  timeout?: number;
}

interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

async function request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const { body, headers: customHeaders, timeout = 10000, ...rest } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // 本地存储的 token（登录后设置）
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const res = await fetch(`${BASE_URL}${endpoint}`, {
      headers,
      signal: controller.signal,
      body: body ? JSON.stringify(body) : undefined,
      ...rest,
    });

    if (!res.ok) {
      const error: ApiError = {
        message: res.statusText || '请求失败',
        status: res.status,
      };
      try {
        error.data = await res.json();
      } catch {
        // body 不是 JSON
      }
      throw error;
    }

    return res.json();
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw { message: '请求超时', status: 0 } as ApiError;
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

export const api = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'GET', ...options }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'POST', body, ...options }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'PUT', body, ...options }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    request<T>(endpoint, { method: 'DELETE', ...options }),
};

export { BASE_URL };
