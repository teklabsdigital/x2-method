export interface HttpResponse<T> {
  status: number;
  body: T;
}

/**
 * Minimal fetch wrapper (RT-1: REST only in v1, no realtime). Bearer token is supplied at construction. The wire
 * is camelCase JSON, matching the server's single dialect (CON-1). No serialization cleverness: the harness
 * drives this exact code against a running server (TEST-2).
 */
export class KernelClient {
  readonly #baseUrl: string;
  readonly #token: string;

  constructor(baseUrl: string, token: string) {
    this.#baseUrl = baseUrl;
    this.#token = token;
  }

  get<T>(path: string): Promise<HttpResponse<T>> {
    return this.#send<T>('GET', path);
  }

  post<T>(path: string, payload: unknown): Promise<HttpResponse<T>> {
    return this.#send<T>('POST', path, payload);
  }

  delete<T>(path: string): Promise<HttpResponse<T>> {
    return this.#send<T>('DELETE', path);
  }

  async #send<T>(method: string, path: string, payload?: unknown): Promise<HttpResponse<T>> {
    const headers: Record<string, string> = { authorization: `Bearer ${this.#token}` };
    if (payload !== undefined) {
      headers['content-type'] = 'application/json';
    }

    const response = await fetch(`${this.#baseUrl}${path}`, {
      method,
      headers,
      body: payload === undefined ? undefined : JSON.stringify(payload),
    });

    const text = await response.text();
    let body: T | undefined;
    if (text.length > 0) {
      try {
        body = JSON.parse(text) as T;
      } catch {
        // A non-JSON body (e.g. an HTML 502 from a proxy) must not surface as a bare SyntaxError that hides the
        // status. Preserve the status; only a successful response is expected to carry a JSON body.
        if (response.ok) {
          throw new Error(`Expected JSON from ${method} ${path} but received a non-JSON body (status ${response.status}).`);
        }
      }
    }

    return { status: response.status, body: body as T };
  }
}
