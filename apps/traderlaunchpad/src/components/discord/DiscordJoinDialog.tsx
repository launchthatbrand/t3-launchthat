"use client";

import * as React from "react";
import { useAction, useQuery, useConvexAuth } from "convex/react";
import { usePathname, useSearchParams } from "next/navigation";

import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { Button } from "@acme/ui/button";
import { api } from "@convex-config/_generated/api";
import { useDiscordOAuthCallback, stripDiscordOauthParams } from "./useDiscordOAuthCallback";

const normalizeInviteUrl = (value: string | null): string | null => {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return null;
  if (raw.startsWith("http://") || raw.startsWith("https://")) return raw;
  return `https://${raw.replace(/^\/+/, "")}`;
};

export const DiscordJoinDialog = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading } = useConvexAuth();

  const platformLink = useQuery(api.platformDiscord.queries.getMyDiscordUserLink, {}) as
    | {
        linkedDiscordUserId: string | null;
        inviteUrl: string | null;
        guildId: string | null;
      }
    | undefined;

  const startPlatformUserLink = useAction(api.platformDiscord.actions.startUserLink);
  const completePlatformUserLink = useAction(api.platformDiscord.actions.completeUserLink);

  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  useDiscordOAuthCallback({
    scope: "platform",
    onCompletePlatform: ({ state, code }) =>
      completePlatformUserLink({ state, code }),
    requireAuth: true,
  });

  React.useEffect(() => {
    if (!isAuthenticated || isLoading) return;
    if (!platformLink) return;
    if (platformLink.linkedDiscordUserId) return;
    if (!platformLink.guildId && !platformLink.inviteUrl) return;
    const oauthState = (searchParams.get("state") ?? "").trim();
    const oauthCode = (searchParams.get("code") ?? "").trim();
    if (oauthState || oauthCode) return;
    if (
      pathname.startsWith("/sign-in") ||
      pathname.startsWith("/sign-up") ||
      pathname.startsWith("/auth")
    )
      return;
    if (pathname.startsWith("/platform/integrations/discord")) return;
    if (pathname.startsWith("/admin/integrations/discord")) return;

    const key = `tlp_discord_join_declined:${platformLink.guildId ?? "platform"}`;
    if (typeof window !== "undefined" && window.localStorage.getItem(key) === "1") return;
    const timer = window.setTimeout(() => setOpen(true), 600);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, isLoading, pathname, platformLink]);

  const handleDecline = () => {
    const key = `tlp_discord_join_declined:${platformLink?.guildId ?? "platform"}`;
    try {
      window.localStorage.setItem(key, "1");
    } catch {
      // ignore
    }
    setOpen(false);
  };

  const handleConnect = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const url = new URL(stripDiscordOauthParams(window.location.href));
      url.searchParams.set("discordScope", "platform");
      const returnTo = url.toString();
      const result = (await startPlatformUserLink({ returnTo })) as { url?: string };
      if (result?.url) {
        window.location.assign(result.url);
      }
    } finally {
      setBusy(false);
    }
  };

  const inviteUrl = normalizeInviteUrl(platformLink?.inviteUrl ?? null);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join TraderLaunchpad Discord?</DialogTitle>
          <DialogDescription>
            Connect your Discord account to join the TraderLaunchpad server and unlock platform updates, discussions, and
            member tools.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2">
          <Button variant="outline" className="text-foreground" onClick={handleDecline} disabled={busy}>
            Not now
          </Button>
          {inviteUrl ? (
            <Button variant="outline" onClick={() => window.open(inviteUrl, "_blank")} disabled={busy}>
              Open Discord
            </Button>
          ) : null}
          <Button onClick={handleConnect} disabled={busy}>
            {busy ? "Connecting…" : "Connect Discord"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
