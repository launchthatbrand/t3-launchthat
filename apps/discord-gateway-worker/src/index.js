import crypto from "node:crypto";
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
  }
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

    // Ignore our own bot messages to avoid loops.
    if (message.author?.id && message.author.id === client.user?.id) return;

    await postEvent({
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
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[messageCreate] error", err);
  }
});

await client.login(DISCORD_BOT_TOKEN);
