import React from "react";
import { UserPublicProfileShell } from "./UserPublicProfileShell";
import { redirect } from "next/navigation";

const slugifyUsername = (value: string): string =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "");

export default async function PublicUserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const canonical = slugifyUsername(decoded);
  if (canonical && canonical !== decoded.toLowerCase().trim()) {
    redirect(`/u/${encodeURIComponent(canonical)}`);
  }

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30">
      <UserPublicProfileShell username={canonical || decoded.toLowerCase().trim()}>
        {children}
      </UserPublicProfileShell>
    </div>
  );
}
