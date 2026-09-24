import { describe, expect, it, vi, beforeEach } from "vitest";
import type { AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { invalidateApiCache, withResponseCache } from "./responseCache";

function cfg(method: string, url: string, extra: Partial<InternalAxiosRequestConfig> = {}) {
  return { method, url, headers: {}, ...extra } as unknown as InternalAxiosRequestConfig;
}

describe("withResponseCache", () => {
  const base = vi.fn(async (config: InternalAxiosRequestConfig) => ({ data: config.url, config }) as AxiosResponse);
  const adapter = withResponseCache(base);

  beforeEach(() => {
    base.mockClear();
    invalidateApiCache();
  });

  it("reutiliza GET idénticos y comparte los que están en vuelo", async () => {
    await Promise.all([adapter(cfg("get", "/contratos")), adapter(cfg("get", "/contratos"))]);
    await adapter(cfg("get", "/contratos"));
    expect(base).toHaveBeenCalledTimes(1);
    await adapter(cfg("get", "/contratos", { params: { page: 2 } }));
    expect(base).toHaveBeenCalledTimes(2);
  });

  it("una mutación limpia la caché", async () => {
    await adapter(cfg("get", "/contratos"));
    await adapter(cfg("post", "/contratos"));
    await adapter(cfg("get", "/contratos"));
    expect(base).toHaveBeenCalledTimes(3);
  });

  it("separa por empresa activa y no cachea endpoints en vivo ni descargas", async () => {
    await adapter(cfg("get", "/contratos", { headers: { "x-company-id": "a" } as never }));
    await adapter(cfg("get", "/contratos", { headers: { "x-company-id": "b" } as never }));
    await adapter(cfg("get", "/notificaciones"));
    await adapter(cfg("get", "/notificaciones"));
    await adapter(cfg("get", "/auth/me"));
    await adapter(cfg("get", "/auth/me"));
    await adapter(cfg("get", "/audit-log/export", { responseType: "blob" }));
    await adapter(cfg("get", "/audit-log/export", { responseType: "blob" }));
    expect(base).toHaveBeenCalledTimes(8);
  });

  it("no guarda errores", async () => {
    base.mockRejectedValueOnce(new Error("boom"));
    await expect(adapter(cfg("get", "/x"))).rejects.toThrow("boom");
    await adapter(cfg("get", "/x"));
    expect(base).toHaveBeenCalledTimes(2);
  });
});
