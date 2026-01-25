export type DiscordJsonResponse = {
  ok: boolean;
  status: number;
  text: string;
  json: unknown;
};

export type DiscordJsonResponseWithRetry = DiscordJsonResponse & {
  retryAfterMs?: number;
};

export const discordJson = async (args: {
  botToken: string;
  method: "POST" | "PATCH";
  url: string;
  body: unknown;
}): Promise<DiscordJsonResponse> => {
  const res = await fetch(args.url, {
    method: args.method,
    headers: {
      Authorization: `Bot ${args.botToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args.body),
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
};

export const discordMultipart = async (args: {
  botToken: string;
  method: "POST" | "PATCH";
  url: string;
  payloadJson: unknown;
  file: {
    name: string;
    bytes: Uint8Array;
    contentType?: string;
  };
}): Promise<DiscordJsonResponse> => {
  const form = new FormData();
  form.append("payload_json", JSON.stringify(args.payloadJson));

  const contentType = args.file.contentType ?? "application/octet-stream";
  // Ensure the bytes are backed by a plain ArrayBuffer (not SharedArrayBuffer) for BlobPart typing.
  const bytes = new Uint8Array(args.file.bytes);
  const blob = new Blob([bytes], { type: contentType });
  form.append("files[0]", blob, args.file.name);

  const res = await fetch(args.url, {
    method: args.method,
    headers: {
      Authorization: `Bot ${args.botToken}`,
      // Do NOT set content-type; fetch will add multipart boundary.
    },
    body: form,
  });

  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
};

export const discordJsonWithRetryAfter = async (args: {
  botToken: string;
  method: "POST" | "PATCH";
  url: string;
  body: unknown;
}): Promise<DiscordJsonResponseWithRetry> => {
  const res = await fetch(args.url, {
    method: args.method,
    headers: {
      Authorization: `Bot ${args.botToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify(args.body),
  });
  const retryAfter = res.headers.get("retry-after");
  const retryAfterMs = retryAfter
    ? Math.round(Number(retryAfter) * 1000)
    : undefined;
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json, retryAfterMs };
};

export const discordApi = async (args: {
  botToken: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  body?: unknown;
}): Promise<DiscordJsonResponse> => {
  const res = await fetch(args.url, {
    method: args.method,
    headers: {
      Authorization: `Bot ${args.botToken}`,
      "Content-Type": "application/json",
    },
    body: args.body ? JSON.stringify(args.body) : undefined,
  });
  const text = await res.text();
  let json: unknown = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }
  return { ok: res.ok, status: res.status, text, json };
};
