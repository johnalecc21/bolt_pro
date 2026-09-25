import axios, { AxiosError } from "axios";
import type { ZodType } from "zod";
import { supabase } from "@/lib/supabase/client";
import { cachedDefaultAdapter, invalidateApiCache } from "@/lib/api/responseCache";
import { reportError } from "@/lib/monitoring";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});
api.defaults.adapter = cachedDefaultAdapter(api.defaults.adapter);

let activeCompanyId: string | null = null;

/** Called by AuthContext whenever the user's active company changes. */
export function setActiveCompanyId(companyId: string | null) {
  if (companyId !== activeCompanyId) invalidateApiCache();
  activeCompanyId = companyId;
}

/** A fresh id per request; the backend logs it and returns it on errors. */
function nuevoRequestId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

api.interceptors.request.use(async (config) => {
  config.headers["X-Request-Id"] = nuevoRequestId();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (activeCompanyId) {
    config.headers["x-company-id"] = activeCompanyId;
  }
  return config;
});

let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

// Only ever refresh once per request, and once at a time across the whole app —
// otherwise a page that fires several parallel requests would each race their
// own refreshSession() call the instant the token goes stale.
let refreshInFlight: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = supabase.auth
      .refreshSession()
      .then(({ data }) => !!data.session)
      .catch(() => false)
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as (typeof error.config & { _retried?: boolean }) | undefined;
    if (error.response?.status === 401 && config && !config._retried) {
      config._retried = true;
      // A 401 doesn't necessarily mean the session is dead — the access token may
      // have simply gone stale (e.g. the tab was backgrounded and the SDK's own
      // refresh timer got throttled). Try a real refresh before giving up on it.
      const refreshed = await tryRefreshSession();
      if (refreshed) {
        return api(config);
      }
      onUnauthorized?.();
    }
    // Server failures and unreachable backend are reported with the request
    // id, so the error tracker entry leads to the backend log lines of that
    // same request. 4xx are expected answers (validation, permissions) and
    // are not reported.
    const status = error.response?.status;
    if (!axios.isCancel(error) && (status === undefined || status >= 500)) {
      reportError(error, {
        tags: { requestId: requestIdDe(error) ?? "sin-id", status: String(status ?? "sin-respuesta") },
        extra: {
          metodo: config?.method?.toUpperCase(),
          ruta: config?.url,
          codigo: error.code,
          respuesta: error.response?.data,
        },
      });
    }
    return Promise.reject(error);
  },
);

/** The id of the failed request: from the response header, the error body or what we sent. */
export function requestIdDe(err: unknown): string | undefined {
  if (!axios.isAxiosError(err)) return undefined;
  const header = err.response?.headers?.["x-request-id"];
  if (typeof header === "string" && header) return header;
  const body = err.response?.data as { requestId?: string } | undefined;
  if (body?.requestId) return body.requestId;
  const enviado = err.config?.headers?.["X-Request-Id"];
  return typeof enviado === "string" ? enviado : undefined;
}

/**
 * Parses a backend response against a zod schema instead of trusting axios's
 * cast — for endpoints where a silently-wrong field shape is expensive
 * (money, signatures, approvals) rather than just a broken render.
 */
export function parseApiResponse<T>(schema: ZodType<T>, data: unknown, context: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`Respuesta inesperada del backend (${context}):`, result.error.flatten());
    // The screen would otherwise show wrong data: this is always a bug.
    reportError(new Error(`Respuesta inesperada del backend (${context})`), {
      tags: { tipo: "contrato-api", contexto: context },
      extra: { problemas: result.error.flatten() },
    });
    throw new Error(`Respuesta inesperada del servidor (${context}). Intenta de nuevo o contacta soporte.`);
  }
  return result.data;
}

export function apiErrorMessage(err: unknown, fallback = "Ocurrió un error. Intenta de nuevo."): string {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    // Unexpected failures carry a short reference the user can give support;
    // it is the request id in the backend logs and the error tracker.
    const ref = status === undefined || status >= 500 ? requestIdDe(err) : undefined;
    const conRef = (m: string) => (ref ? `${m} (ref. ${ref.slice(0, 8)})` : m);
    if (status === undefined && !err.response) {
      return conRef("No pudimos conectar con el servidor. Revisa tu conexión e intenta de nuevo.");
    }
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return conRef(data.message.join(" "));
    if (typeof data?.message === "string") return conRef(data.message);
    if (ref) return conRef(fallback);
  }
  // Covers Supabase's AuthError/PostgrestError and plain Error instances.
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return fallback;
}
