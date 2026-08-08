import axios, { AxiosError } from "axios";
import { supabase } from "@/lib/supabase/client";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? "http://localhost:3001",
});

let activeCompanyId: string | null = null;

/** Called by AuthContext whenever the user's active company changes. */
export function setActiveCompanyId(companyId: string | null) {
  activeCompanyId = companyId;
}

api.interceptors.request.use(async (config) => {
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
    return Promise.reject(error);
  },
);

export function apiErrorMessage(err: unknown, fallback = "Ocurrió un error. Intenta de nuevo."): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { message?: string | string[] } | undefined;
    if (Array.isArray(data?.message)) return data.message.join(" ");
    if (typeof data?.message === "string") return data.message;
  }
  // Covers Supabase's AuthError/PostgrestError and plain Error instances.
  if (err && typeof err === "object" && "message" in err && typeof err.message === "string" && err.message) {
    return err.message;
  }
  return fallback;
}
