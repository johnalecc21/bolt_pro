import axios, { type AxiosAdapter, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";

/**
 * Short-lived cache for GET responses, so moving between screens (list →
 * detail → back) or several components asking for the same data doesn't pay
 * a network round trip each time. Identical in-flight GETs are also shared.
 *
 * Safety rules: any non-GET request (a mutation) clears everything; so does
 * switching company or logging out; and `reload()` from useApiData bypasses
 * it. Endpoints whose value is "right now" are never cached.
 */
const TTL_MS = 15_000;
const MAX_ENTRIES = 200;
const NEVER_CACHE = /\/(notificaciones|subasta|health|auth)(\/|$|\?)/;

const entries = new Map<string, { at: number; response: Promise<AxiosResponse> }>();

export function invalidateApiCache() {
  entries.clear();
}

function keyFor(config: InternalAxiosRequestConfig) {
  const headers = config.headers ?? {};
  return JSON.stringify([
    config.url,
    config.params ?? null,
    headers["x-company-id"] ?? null,
    headers.Authorization ?? null,
  ]);
}

export function withResponseCache(adapter: AxiosAdapter): AxiosAdapter {
  return async (config) => {
    const method = (config.method ?? "get").toLowerCase();
    const cacheable = method === "get" && !config.responseType && !NEVER_CACHE.test(config.url ?? "");

    if (!cacheable) {
      try {
        return await adapter(config);
      } finally {
        if (method !== "get" && method !== "head" && method !== "options") invalidateApiCache();
      }
    }

    const key = keyFor(config);
    const hit = entries.get(key);
    if (hit && Date.now() - hit.at < TTL_MS) {
      const res = await hit.response;
      return { ...res, config };
    }

    const response = adapter(config);
    entries.set(key, { at: Date.now(), response });
    if (entries.size > MAX_ENTRIES) entries.delete(entries.keys().next().value as string);
    response.catch(() => {
      if (entries.get(key)?.response === response) entries.delete(key);
    });
    return response;
  };
}

export function cachedDefaultAdapter(defaultAdapter: unknown): AxiosAdapter {
  return withResponseCache(axios.getAdapter(defaultAdapter as Parameters<typeof axios.getAdapter>[0]));
}
