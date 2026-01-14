import "server-only";

import React from "react";
import { createHash } from "crypto";
import { redirect } from "next/navigation";

import type { Doc, Id } from "@/convex/_generated/dataModel";

import { AccessDeniedPage } from "~/components/access/AccessDeniedPage";
import { TraderLaunchpadJournalShell } from "~/components/traderlaunchpad/journal/TraderLaunchpadJournalShell";
import { TraderLaunchpadJournalPage } from "~/components/traderlaunchpad/journal/TraderLaunchpadJournalPage";
import { TraderLaunchpadPublicJournalPage } from "~/components/traderlaunchpad/journal/TraderLaunchpadPublicJournalPage";
import { TraderLaunchpadLeaderboardPage } from "~/components/traderlaunchpad/journal/TraderLaunchpadLeaderboardPage";

type FrontendRouteHandlerContext = {
  segments: string[];
  searchParams?: Record<string, string | string[] | undefined>;
  organizationId: Id<"organizations"> | null;
  enabledPluginIds: string[];
  fetchQuery: any;
  api: any;
  tenantSessionId?: string | null;
};

const sha256Base64Url = (value: string): string => {
  const hash = createHash("sha256").update(value, "utf8").digest("base64");
  return hash.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
};

const resolveViewer = async (
  ctx: FrontendRouteHandlerContext,
): Promise<Doc<"users"> | null> => {
  // Match the post-type route auth behavior: only trust our tenant session cookie.
  if (typeof ctx.tenantSessionId !== "string" || !ctx.tenantSessionId.trim()) {
    return null;
  }
  try {
    const sessionIdHash = sha256Base64Url(ctx.tenantSessionId.trim());
    const sessionResult = await ctx.fetchQuery(
      ctx.api.auth.sessions.getTenantSessionByIdHash,
      { sessionIdHash },
    );
    const session =
      sessionResult && typeof sessionResult === "object"
        ? (sessionResult as {
            clerkUserId?: unknown;
            organizationId?: unknown;
          })
        : null;

    const clerkUserId =
      typeof session?.clerkUserId === "string" ? session.clerkUserId : null;
    const sessionOrgId =
      typeof session?.organizationId === "string" ? session.organizationId : null;

    // Ensure session is for the active tenant (defense-in-depth).
    if (
      !clerkUserId ||
      (ctx.organizationId &&
        (!sessionOrgId || sessionOrgId !== String(ctx.organizationId)))
    ) {
      return null;
    }

    const user = await ctx.fetchQuery(ctx.api.core.users.queries.getUserByClerkId, {
      clerkId: clerkUserId,
    });
    return user ?? null;
  } catch {
    return null;
  }
};

export async function resolveTraderLaunchpadJournalRoute(
  ctx: FrontendRouteHandlerContext,
): Promise<React.ReactNode | null> {
  const [root, s1, s2, s3] = ctx.segments;
  if ((root ?? "").toLowerCase() !== "journal") return null;

  // Public leaderboard: /journal/leaderboard
  if ((s1 ?? "").toLowerCase() === "leaderboard") {
    return (
      <TraderLaunchpadJournalShell
        title="Journal Leaderboard"
        subtitle="Public stats across traders (MVP)."
        tabs={{ variant: "private" }}
      >
        <TraderLaunchpadLeaderboardPage />
      </TraderLaunchpadJournalShell>
    );
  }

  // Public journal routes:
  // /journal/u/:username
  // /journal/u/:username/orders|ideas|dashboard
  if ((s1 ?? "").toLowerCase() === "u") {
    const username = (s2 ?? "").trim();
    if (!username) return null;
    const subroute = (s3 ?? "dashboard").toLowerCase();
    return (
      <TraderLaunchpadJournalShell
        title={`@${username} Journal`}
        subtitle="Public view (read-only)."
        tabs={{ variant: "public", username }}
      >
        <TraderLaunchpadPublicJournalPage
          username={username}
          subroute={subroute}
        />
      </TraderLaunchpadJournalShell>
    );
  }

  // Private journal routes:
  // /journal/dashboard|orders|settings
  const subroute = (s1 ?? "dashboard").toLowerCase();
  const viewer = await resolveViewer(ctx);
  if (!viewer) {
    // If you prefer a sign-in redirect, change this to your auth route.
    redirect(`/auth/sign-in?redirect_url=${encodeURIComponent("/" + ctx.segments.join("/"))}`);
  }

  // Guard plugin usage if org not resolved.
  if (!ctx.organizationId) {
    return <AccessDeniedPage />;
  }

  return (
    <TraderLaunchpadJournalShell
      title="Journal"
      subtitle="Your private trading dashboard."
      tabs={{ variant: "private" }}
    >
      <TraderLaunchpadJournalPage
        subroute={subroute}
        organizationId={String(ctx.organizationId)}
        viewerUserId={String(viewer._id)}
      />
    </TraderLaunchpadJournalShell>
  );
}


