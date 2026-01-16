export type DiscordOAuthTokenResponse = {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
};

export const exchangeDiscordCode = async (args: {
  clientId: string;
  clientSecret: string;
  code: string;
  redirectUri: string;
}): Promise<DiscordOAuthTokenResponse> => {
  const body = new URLSearchParams({
    client_id: args.clientId,
    client_secret: args.clientSecret,
    grant_type: "authorization_code",
    code: args.code,
    redirect_uri: args.redirectUri,
  });

  const res = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "token_exchange_failed");
    throw new Error(
      `Discord token exchange failed: ${res.status} ${text}`.slice(0, 400),
    );
  }

  const tokenJson = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
  };

  const accessToken =
    typeof tokenJson?.access_token === "string" ? tokenJson.access_token : "";
  if (!accessToken) {
    throw new Error("Discord token exchange returned no access token");
  }

  return {
    accessToken,
    refreshToken:
      typeof tokenJson?.refresh_token === "string"
        ? tokenJson.refresh_token
        : undefined,
    expiresIn:
      typeof tokenJson?.expires_in === "number"
        ? tokenJson.expires_in
        : undefined,
  };
};

export const fetchDiscordUser = async (accessToken: string): Promise<string> => {
  const res = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "me_failed");
    throw new Error(
      `Discord /users/@me failed: ${res.status} ${text}`.slice(0, 400),
    );
  }
  const meJson = (await res.json()) as { id?: string };
  const discordUserId = typeof meJson?.id === "string" ? meJson.id : "";
  if (!discordUserId) {
    throw new Error("Discord user id missing from /users/@me");
  }
  return discordUserId;
};
