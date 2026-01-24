"use client";

import React from "react";

type ViewerUser = {
  email?: string;
  name?: string;
  avatarUrl?: string;
  coverUrl?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export function ProfileHeaderClient(props: {
  username: string;
  onViewerMatch: (viewer: { displayName?: string; avatarUrl?: string; coverUrl?: string }) => void;
}) {
  React.useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const res = await fetch("/api/me", { credentials: "include" });
        const jsonUnknown: unknown = await res.json().catch(() => null);
        if (!jsonUnknown || typeof jsonUnknown !== "object") return;
        const user = (jsonUnknown as { user?: unknown }).user;
        if (!user || typeof user !== "object") return;

        const u = user as ViewerUser;
        const email = typeof u.email === "string" ? u.email : "";
        const name = typeof u.name === "string" ? u.name : "";
        const fallback = email ? (email.split("@")[0] ?? "") : "";
        const slug = slugify(name || fallback || "");
        if (!slug || slug !== props.username) return;

        if (cancelled) return;
        props.onViewerMatch({
          displayName: name || fallback || undefined,
          avatarUrl: typeof u.avatarUrl === "string" ? u.avatarUrl : undefined,
          coverUrl: typeof u.coverUrl === "string" ? u.coverUrl : undefined,
        });
      } catch {
        // ignore
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [props.username, props.onViewerMatch]);

  return null;
}

