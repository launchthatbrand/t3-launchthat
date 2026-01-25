import { decryptSecret } from "./crypto";

export type ResolveBotTokenArgs = {
  botMode: "global" | "custom";
  globalBotToken?: string;
  secretsKey?: string;
  customBotTokenEncrypted?: string;
  botTokenEncrypted?: string;
};

export const resolveOrgBotToken = async (args: ResolveBotTokenArgs): Promise<string> => {
  if (args.botMode === "global") {
    if (!args.globalBotToken) {
      throw new Error("Missing DISCORD_GLOBAL_BOT_TOKEN");
    }
    return args.globalBotToken;
  }

  if (!args.secretsKey) {
    throw new Error(
      "Missing DISCORD_SECRETS_KEY (required to decrypt custom bot token)",
    );
  }

  const encrypted =
    typeof args.customBotTokenEncrypted === "string" &&
    args.customBotTokenEncrypted.trim()
      ? args.customBotTokenEncrypted.trim()
      : typeof args.botTokenEncrypted === "string" &&
          args.botTokenEncrypted.trim()
        ? args.botTokenEncrypted.trim()
        : "";

  if (!encrypted) {
    throw new Error("Discord custom bot token not configured");
  }

  return await decryptSecret(encrypted, args.secretsKey);
};

export type ResolveDiscordCredentialsArgs = {
  botMode: "global" | "custom";
  globalClientId?: string;
  globalClientSecret?: string;
  globalBotToken?: string;
  secretsKey?: string;
  customClientId?: string;
  clientId?: string;
  customClientSecretEncrypted?: string;
  clientSecretEncrypted?: string;
  customBotTokenEncrypted?: string;
  botTokenEncrypted?: string;
};

export const resolveDiscordCredentials = async (
  args: ResolveDiscordCredentialsArgs,
): Promise<{
  botMode: "global" | "custom";
  clientId: string;
  clientSecret: string;
  botToken: string;
}> => {
  if (args.botMode === "global") {
    if (
      !args.globalClientId ||
      !args.globalClientSecret ||
      !args.globalBotToken
    ) {
      throw new Error(
        "Missing DISCORD_GLOBAL_* env vars (client id/secret + bot token required for global bot mode)",
      );
    }
    return {
      botMode: "global",
      clientId: args.globalClientId,
      clientSecret: args.globalClientSecret,
      botToken: args.globalBotToken,
    };
  }

  if (!args.secretsKey) {
    throw new Error("Missing DISCORD_SECRETS_KEY");
  }

  const clientId =
    (typeof args.customClientId === "string" && args.customClientId.trim()) ||
    (typeof args.clientId === "string" && args.clientId.trim()) ||
    "";
  const clientSecretEncrypted =
    (typeof args.customClientSecretEncrypted === "string" &&
      args.customClientSecretEncrypted) ||
    (typeof args.clientSecretEncrypted === "string" &&
      args.clientSecretEncrypted) ||
    "";
  const botTokenEncrypted =
    (typeof args.customBotTokenEncrypted === "string" &&
      args.customBotTokenEncrypted) ||
    (typeof args.botTokenEncrypted === "string" && args.botTokenEncrypted) ||
    "";

  if (!clientId || !clientSecretEncrypted || !botTokenEncrypted) {
    throw new Error(
      "Discord custom bot credentials are incomplete for this organization",
    );
  }

  return {
    botMode: "custom",
    clientId,
    clientSecret: await decryptSecret(clientSecretEncrypted, args.secretsKey),
    botToken: await decryptSecret(botTokenEncrypted, args.secretsKey),
  };
};
