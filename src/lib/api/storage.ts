import { supabase } from "@/lib/supabase/client";

export const MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Was copy-pasted into requerimientos.ts, contratos.ts and homologacion.ts —
 * each still owns its own upload-url/confirm endpoints (those genuinely
 * differ per domain), this only covers the identical size-check + actual
 * Supabase upload step. */
export function assertFileSizeOk(file: File) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("El archivo supera el tamaño máximo permitido (10 MB). Comprime el PDF e inténtalo de nuevo.");
  }
}

export async function uploadToSignedUrl(bucket: string, path: string, token: string, file: File) {
  const { error } = await supabase.storage.from(bucket).uploadToSignedUrl(path, token, file);
  if (error) throw error;
}
