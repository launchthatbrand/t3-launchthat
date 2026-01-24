"use client";

import React from "react";
import { useQuery } from "convex/react";

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
  const row = useQuery(api.publicProfiles.getUserPublicProfileByUsername, {
    username: props.username,
  }) as UserRow | null | undefined;

  if (!row) {
    return <div className="py-10 text-sm text-white/60">User not found.</div>;
  }

  return (
    <>
      <UserPublicProfile
        mode="public"
        canEdit={false}
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

      <div className="mt-10">{props.children}</div>
    </>
  );
}

