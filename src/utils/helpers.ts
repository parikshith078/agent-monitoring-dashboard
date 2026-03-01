// ─── Pure utility helpers ─────────────────────────────────────────────────────

export function elapsed(start: number | null, end: number | null): string {
  if (!start) return "—";
  const diff = (end ?? Math.floor(Date.now() / 1000)) - start;
  if (diff < 60) return `${diff}s`;
  return `${Math.floor(diff / 60)}m ${diff % 60}s`;
}

export function ts(unix: number | null): string {
  if (!unix) return "—";
  return new Date(unix * 1000).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function tryParseJSON(str: string): Record<string, unknown> | null {
  const trimmed = str.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function isRunning(status: string): boolean {
  return status === "IN_PROGRESS" || status === "in_progress";
}
