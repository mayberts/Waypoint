export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
  }
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new ApiError(typeof body?.error === "string" ? body.error : res.statusText, res.status);
  }
  return res.json();
}

export const api = {
  get<T>(url: string): Promise<T> {
    return fetch(url).then((res) => handle<T>(res));
  },
  post<T>(url: string, body?: unknown): Promise<T> {
    return fetch(url, {
      method: "POST",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => handle<T>(res));
  },
  patch<T>(url: string, body: unknown): Promise<T> {
    return fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).then((res) => handle<T>(res));
  },
  delete<T>(url: string, body?: unknown): Promise<T> {
    return fetch(url, {
      method: "DELETE",
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }).then((res) => handle<T>(res));
  },
  upload<T>(url: string, form: FormData): Promise<T> {
    return fetch(url, { method: "POST", body: form }).then((res) => handle<T>(res));
  },
};
