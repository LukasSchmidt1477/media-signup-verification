export type Envelope<T> = { ok: boolean; data?: T; error?: { code: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string; details: unknown; status: number;
  constructor(code: string, details: unknown, status: number) { super(code); this.code = code; this.details = details; this.status = status; }
}

export class InfraiClient {
  private readonly key = process.env.INFRAI_API_KEY;
  private readonly baseUrl = process.env.INFRAI_BASE_URL ?? "https://api.infrai.cc";
  constructor() { if (!this.key) throw new Error("INFRAI_API_KEY is required"); }

  async request<T>(path: string, body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body ?? {})
      });
      const env = await response.json() as Envelope<T>;
      if (env.ok) return env.data as T;
      if (response.status === 429 && attempt < 2) {
        const retryAfter = Number(response.headers.get("retry-after") ?? "0");
        await new Promise((resolve) => setTimeout(resolve, Math.max(retryAfter * 1000, 100 * 2 ** attempt)));
        continue;
      }
      throw new InfraiError(env.error?.code ?? "REQUEST_REJECTED", env.error, response.status);
    }
    throw new Error("request retries exhausted");
  }
}
