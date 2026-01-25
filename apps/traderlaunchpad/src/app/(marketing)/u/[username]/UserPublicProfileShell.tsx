"use client";

import React from "react";
import { useQuery } from "convex/react";
import { usePathname } from "next/navigation";

import { api } from "@convex-config/_generated/api";
import { UserPublicProfile } from "~/components/publicProfiles/UserPublicProfile";

interface UserRow {
  _id: string;
  publicUsername: string;
  displayName: string;
  bio?: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  publicProfileConfig?: unknown;
}

export function UserPublicProfileShell(props: {
  username: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const row = useQuery(api.publicProfiles.getUserPublicProfileByUsername, {
    username: props.username,
  }) as UserRow | null | undefined;

  // Hooks must run unconditionally before any return.
  const resolvedUsername = row?.publicUsername ?? props.username;
  const baseHref = `/u/${encodeURIComponent(resolvedUsername)}`;
  const tabs = [
    {
      label: "Dashboard",
      href: baseHref,
      isActive: pathname === baseHref || pathname === `${baseHref}/`,
    },
    {
      label: "TradeIdeas",
      href: `${baseHref}/tradeideas`,
      isActive: pathname?.startsWith(`${baseHref}/tradeideas`),
    },
    {
      label: "Orders",
      href: `${baseHref}/orders`,
      isActive: pathname?.startsWith(`${baseHref}/orders`),
    },
  ];

  if (!row) {
    return <div className="py-10 text-sm text-white/60">User not found.</div>;
  }

  return (
    <>
      <UserPublicProfile
        mode="public"
        canEdit={false}
        tabs={tabs}
        user={{
          _id: row._id,
          publicUsername: row.publicUsername,
          displayName: row.displayName,
          bio: row.bio,
          avatarUrl: row.avatarUrl,
          coverUrl: row.coverUrl,
          publicProfileConfig: row.publicProfileConfig as any,
        }}
      />

      <div className="mt-8">{props.children}</div>
    </>
  );
}

