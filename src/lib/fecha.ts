/**
 * Calendar date (YYYY-MM-DD) of a timestamp in the viewer's own timezone.
 * Deadlines are stored as the end of the day where the company operates
 * (e.g. 23:59 in Colombia = 04:59 UTC the next day), so slicing the ISO
 * string would show the wrong day.
 */
export function fechaLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function haVencido(iso: string | undefined | null): boolean {
  return !iso || new Date(iso).getTime() <= Date.now();
}

/** Remaining time as H:MM:SS (or MM:SS under an hour) — rounds can last up to 24 h. */
export function cuentaRegresiva(deadlineMs: number, ahora = Date.now()): string {
  const restante = Math.max(0, deadlineMs - ahora);
  const h = Math.floor(restante / 3_600_000);
  const min = Math.floor((restante % 3_600_000) / 60_000);
  const sec = Math.floor((restante % 60_000) / 1000);
  const mmss = `${String(min).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return h > 0 ? `${h}:${mmss}` : mmss;
}
