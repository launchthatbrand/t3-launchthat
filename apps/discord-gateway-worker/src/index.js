import crypto from "node:crypto";
import http from "node:http";
import process from "node:process";
import { Client, GatewayIntentBits, Partials } from "discord.js";

const requiredEnv = (key) => {
  const v = process.env[key];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing required env: ${key}`);
  }
  return String(v).trim();
};

const DISCORD_BOT_TOKEN = requiredEnv("DISCORD_BOT_TOKEN");
const DISCORD_RELAY_URL = requiredEnv("DISCORD_RELAY_URL");
const DISCORD_RELAY_SECRET = requiredEnv("DISCORD_RELAY_SECRET");

// DigitalOcean App Platform health checks expect the process to listen on $PORT
// (commonly 8080) and respond to HTTP requests. The worker is primarily a long-
// running Discord Gateway client, so we expose a tiny health server.
const HEALTH_PORT = Number(process.env.PORT || "8080");
const HEALTH_HOST = "0.0.0.0";

const healthServer = http.createServer((req, res) => {
  const url = req.url || "/";
  if (url === "/" || url === "/health") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404, { "content-type": "text/plain" });
  res.end("not found");
});

healthServer.listen(HEALTH_PORT, HEALTH_HOST, () => {
  // eslint-disable-next-line no-console
  console.log(
    `[discord-worker] health server listening on http://${HEALTH_HOST}:${HEALTH_PORT}`,
  );
});

const signBody = (bodyText) =>
  crypto
    .createHmac("sha256", DISCORD_RELAY_SECRET)
    .update(bodyText, "utf8")
    .digest("base64");

const postEvent = async (event) => {
  const bodyText = JSON.stringify(event);
  const signature = signBody(bodyText);
  const res = await fetch(DISCORD_RELAY_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-relay-signature": signature,
    },
    body: bodyText,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    // eslint-disable-next-line no-console
    console.warn("[relay] failed", res.status, text);
    return { ok: false };
  }
  try {
    return await res.json();
  } catch {
    return { ok: true };
  }
};

// Typing indicator support
// Discord's typing indicator expires quickly, so we refresh it on an interval.
const TYPING_INTERVAL_MS = Number(
  process.env.DISCORD_TYPING_INTERVAL_MS || "7000",
);
const TYPING_MAX_MS = Number(process.env.DISCORD_TYPING_MAX_MS || "60000");
const typingByThreadId = new Map();

const stopTyping = (threadId) => {
  const state = typingByThreadId.get(threadId);
  if (!state) return;
  clearInterval(state.intervalId);
  clearTimeout(state.timeoutId);
  typingByThreadId.delete(threadId);
};

const startTyping = (thread) => {
  const threadId = thread?.id;
  if (!threadId) return;

  const existing = typingByThreadId.get(threadId);
  if (existing) {
    // Extend max timeout window for ongoing conversation.
    clearTimeout(existing.timeoutId);
    existing.timeoutId = setTimeout(() => stopTyping(threadId), TYPING_MAX_MS);
    return;
  }

  // Fire immediately for snappy feedback.
  thread.sendTyping().catch(() => {});

  const intervalId = setInterval(() => {
    thread.sendTyping().catch(() => {});
  }, TYPING_INTERVAL_MS);

  const timeoutId = setTimeout(() => stopTyping(threadId), TYPING_MAX_MS);
  typingByThreadId.set(threadId, { intervalId, timeoutId });
};

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.on("ready", () => {
  // eslint-disable-next-line no-console
  console.log(`[discord-worker] logged in as ${client.user?.tag ?? "unknown"}`);
});

client.on("threadCreate", async (thread) => {
  try {
    const guildId = thread.guild?.id;
    const forumChannelId = thread.parentId ?? null;
    if (!guildId) return;
    await postEvent({
      type: "thread_create",
      guildId,
      forumChannelId,
      threadId: thread.id,
      threadName: thread.name ?? null,
      createdByDiscordUserId: thread.ownerId ?? null,
      createdAt: Date.now(),
    });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[threadCreate] error", err);
  }
});

client.on("messageCreate", async (message) => {
  try {
    const guildId = message.guild?.id;
    if (!guildId) return;
    if (!message.channel?.isThread?.()) return;

    const thread = message.channel;
    const forumChannelId = thread.parentId ?? null;

    // Stop typing when our bot posts a message in the thread (best-effort signal
    // that the AI finished responding).
    if (message.author?.id && message.author.id === client.user?.id) {
      stopTyping(thread.id);
      return;
    }

    const relayResult = await postEvent({
      type: "message_create",
      guildId,
      threadId: thread.id,
      forumChannelId,
      messageId: message.id,
      authorId: message.author?.id ?? "",
      authorIsBot: Boolean(message.author?.bot),
      content: message.content ?? "",
      createdAt: message.createdTimestamp ?? Date.now(),
    });

    // Only show typing indicator if the relay tells us this message is eligible for an AI reply.
    if (relayResult?.shouldType) {
      startTyping(thread);
    } else {
      stopTyping(thread.id);
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[messageCreate] error", err);
  }
});

await client.login(DISCORD_BOT_TOKEN);

const shutdown = (signal) => {
  // eslint-disable-next-line no-console
  console.log(`[discord-worker] shutting down (${signal})`);
  for (const threadId of typingByThreadId.keys()) {
    stopTyping(threadId);
  }
  try {
    healthServer.close(() => {});
  } catch {
    // ignore
  }
  try {
    client.destroy();
  } catch {
    // ignore
  }
  process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
