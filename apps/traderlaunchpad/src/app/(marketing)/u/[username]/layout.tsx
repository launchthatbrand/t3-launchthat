import { demoPublicProfiles, demoPublicUsers } from "@acme/demo-data";

import React from "react";
import { PublicUserHeaderClient } from "./PublicUserHeaderClient";

interface PublicUserLite {
  username: string;
  displayName?: string;
  avatarUrl?: string;
  isPublic?: boolean;
  bio?: string;
  primaryBroker?: string;
  stats?: {
    followers?: number;
    following?: number;
    likes?: number;
  };
}

interface PublicProfileLite {
  username: string;
  avatarUrl?: string;
}

const safeNumber = (v: unknown, fallback = 0): number =>
  typeof v === "number" && Number.isFinite(v) ? v : fallback;

export default async function PublicUserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);

  const users = demoPublicUsers as unknown as PublicUserLite[];
  const user = users.find((u) => u.username.toLowerCase() === decoded.toLowerCase());

  const profiles = demoPublicProfiles as unknown as PublicProfileLite[];
  const profileOnly = profiles.find((p) => p.username.toLowerCase() === decoded.toLowerCase());

  const displayName = user?.displayName ?? profileOnly?.username ?? decoded;
  const avatarUrl = user?.avatarUrl ?? profileOnly?.avatarUrl;
  const bio =
    user?.bio ??
    "Public profile preview. Connect your broker, journal trades, and share your edge with the fleet.";
  const primaryBroker = user?.primaryBroker ?? "—";

  const followers = safeNumber(user?.stats?.followers, 0);
  const following = safeNumber(user?.stats?.following, 0);
  const likes = safeNumber(user?.stats?.likes, 0);

  const base = `/u/${encodeURIComponent(decoded)}`;
  const usernameSlug = decoded.toLowerCase();

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30">
      <main className="relative z-10">
        <section className="container mx-auto max-w-7xl px-4">
          <PublicUserHeaderClient
            username={usernameSlug}
            baseHref={base}
            displayName={displayName}
            bio={bio}
            avatarUrl={avatarUrl ?? undefined}
            coverUrl={undefined}
            primaryBroker={primaryBroker}
            followers={followers}
            following={following}
            likes={likes}
            isPrivateLabel={user?.isPublic === false ? "Private" : "Live preview"}
          />

          <div className="mt-10">{children}</div>
        </section>
      </main>
    </div>
  );
}
