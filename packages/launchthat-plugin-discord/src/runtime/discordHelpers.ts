export const fetchDiscordProfile = async (accessToken: string) => {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "me_failed");
    throw new Error(
      `Discord /users/@me failed: ${res.status} ${text}`.slice(0, 400),
    );
  }
  const meJson = (await res.json()) as {
    id?: string;
    username?: string;
    discriminator?: string;
    avatar?: string;
    global_name?: string;
  };
  const discordUserId = typeof meJson?.id === "string" ? meJson.id : "";
  if (!discordUserId) {
    throw new Error("Discord user id missing from /users/@me");
  }
  return {
    discordUserId,
    username: typeof meJson.username === "string" ? meJson.username : undefined,
    discriminator:
      typeof meJson.discriminator === "string" ? meJson.discriminator : undefined,
    avatar: typeof meJson.avatar === "string" ? meJson.avatar : undefined,
    globalName:
      typeof meJson.global_name === "string" ? meJson.global_name : undefined,
  };
};

export const addGuildMember = async (args: {
  botToken: string;
  guildId: string;
  discordUserId: string;
  accessToken: string;
}): Promise<boolean> => {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${encodeURIComponent(args.guildId)}/members/${encodeURIComponent(args.discordUserId)}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bot ${args.botToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ access_token: args.accessToken }),
    },
  );
  if (res.status === 204 || res.status === 201) return true;
  if (res.status === 409) return true; // already a member
  const text = await res.text().catch(() => "");
  console.log("[discord.addGuildMember] failed", res.status, text.slice(0, 300));
  return false;
};

export const verifyGuildMembership = async (args: {
  botToken: string;
  guildId: string;
  discordUserId: string;
}): Promise<boolean> => {
  const res = await fetch(
    `https://discord.com/api/v10/guilds/${encodeURIComponent(args.guildId)}/members/${encodeURIComponent(args.discordUserId)}`,
    {
      headers: { Authorization: `Bot ${args.botToken}` },
    },
  );
  if (res.status === 404) return false;
  if (res.ok) return true;
  const text = await res.text().catch(() => "");
  throw new Error(
    `Discord membership check failed: ${res.status} ${text}`.slice(0, 400),
  );
};
