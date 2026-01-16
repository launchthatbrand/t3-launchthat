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
