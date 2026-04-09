import { resolveApiBaseUrl } from './resolve-api-base-url';

const REQUEST_TIMEOUT_MS = 10000;
const API_BASE_URL = resolveApiBaseUrl();

class HttpClient {
  private authToken: string | null = null;

  constructor(private readonly baseUrl: string) {}

  setAuthToken(token: string | null) {
    this.authToken = token;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path, { method: 'GET' });
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async postFormData<T>(path: string, body: FormData): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body,
    });
  }

  async put<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  async patch<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    const headers = new Headers(init.headers);

    if (this.authToken) {
      headers.set('Authorization', `Bearer ${this.authToken}`);
    }

    let response: Response;

    try {
      response = await fetch(`${this.baseUrl}${path}`, {
        ...init,
        headers,
        signal: controller.signal,
      });
    } catch (error) {
      if ((error as { name?: string }).name === 'AbortError') {
        throw new Error(
          `Timeout ao chamar ${path} em ${this.baseUrl}. Verifique EXPO_PUBLIC_API_URL e se a API está acessível.`,
        );
      }

      throw new Error(
        `Falha de conexão com ${path} em ${this.baseUrl}. Verifique EXPO_PUBLIC_API_URL e se a API está rodando.`,
      );
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Request failed (${response.status}): ${text}`);
    }

    return (await response.json()) as T;
  }
}

export { API_BASE_URL };
export const httpClient = new HttpClient(API_BASE_URL);
