export interface AlertEmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface AlertEmbed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: { text: string; icon_url?: string };
  author?: { name: string; url?: string; icon_url?: string };
  image?: { url: string };
  thumbnail?: { url: string };
  fields?: AlertEmbedField[];
}

export type AlertLevel = "info" | "warn" | "error";

export interface AlertInput {
  level: AlertLevel;
  source?: string;
  embed: AlertEmbed;
  metadata?: unknown;
}

export interface AlertsClientOptions {
  apiKey: string;
  mode: "localhost" | "remote";
  baseUrl?: string;
  fetch?: typeof fetch;
}

export interface AlertsClient {
  send(input: AlertInput): Promise<{ id: number }>;
}

export class AlertsError extends Error {
  readonly status: number;
  readonly body: unknown;
  constructor(status: number, body: unknown, message: string) {
    super(message);
    this.name = "AlertsError";
    this.status = status;
    this.body = body;
  }
}

const REMOTE_URL = "https://kennan.dev";
const LOCALHOST_URL = "http://localhost:4321";

export function createAlertsClient(opts: AlertsClientOptions): AlertsClient {
  if (!opts.apiKey) throw new Error("apiKey is required");
  if (opts.mode !== "localhost" && opts.mode !== "remote") {
    throw new Error('mode must be "localhost" or "remote"');
  }

  const base =
    opts.baseUrl ?? (opts.mode === "remote" ? REMOTE_URL : LOCALHOST_URL);
  const fetchImpl = opts.fetch ?? globalThis.fetch;
  if (!fetchImpl) {
    throw new Error(
      "global fetch is not available; pass `fetch` in options (Node <18?)",
    );
  }

  return {
    async send(input) {
      const res = await fetchImpl(`${base}/api/cms/alerts/ingest`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${opts.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      let body: unknown = null;
      const text = await res.text();
      if (text) {
        try {
          body = JSON.parse(text);
        } catch {
          body = text;
        }
      }

      if (!res.ok) {
        const message =
          (body && typeof body === "object" && "error" in body
            ? String((body as { error: unknown }).error)
            : `HTTP ${res.status}`) + ` (${res.status})`;
        throw new AlertsError(res.status, body, message);
      }

      if (
        !body ||
        typeof body !== "object" ||
        typeof (body as { id: unknown }).id !== "number"
      ) {
        throw new AlertsError(res.status, body, "malformed success response");
      }
      return { id: (body as { id: number }).id };
    },
  };
}
