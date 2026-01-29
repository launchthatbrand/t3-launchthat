type JsonResult<T> = { ok: true; data: T } | { ok: false; error: string };

export const fetchAuthedWidgetJson = async <T>(args: {
  apiBase: string;
  path: string;
  installationId: string;
  apiKey: string;
  query?: Record<string, string | number | boolean | null | undefined>;
}): Promise<JsonResult<T>> => {
  const apiBaseClean = String(args.apiBase ?? "").trim().replace(/\/+$/, "").replace(/\/api$/, "");
  const path = String(args.path ?? "");
  const installationId = String(args.installationId ?? "").trim();
  const apiKey = String(args.apiKey ?? "").trim();

  if (!apiBaseClean) return { ok: false, error: "Missing apiBase" };
  if (!path.startsWith("/")) return { ok: false, error: "Invalid path" };
  if (!installationId) return { ok: false, error: "Missing installationId" };
  if (!apiKey) return { ok: false, error: "Missing apiKey" };

  const url = new URL(`${apiBaseClean}${path}`);
  const q = args.query ?? {};
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null) continue;
    url.searchParams.set(k, String(v));
  }

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-TDRLP-Widget-Id": installationId,
      "X-TDRLP-Widget-Key": apiKey,
    },
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, error: text || `Request failed (${res.status})` };
  }

  const jsonUnknown: unknown = await res.json().catch(() => null);
  if (!jsonUnknown || typeof jsonUnknown !== "object") return { ok: false, error: "Invalid response" };

  const ok = Boolean((jsonUnknown as any).ok);
  if (!ok) {
    const error = typeof (jsonUnknown as any).error === "string" ? (jsonUnknown as any).error : "Request failed";
    return { ok: false, error };
  }

  return { ok: true, data: jsonUnknown as T };
};

