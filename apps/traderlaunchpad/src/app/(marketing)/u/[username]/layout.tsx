import React from "react";
import { UserPublicProfileShell } from "./UserPublicProfileShell";

export default async function PublicUserLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const decoded = decodeURIComponent(username);
  const usernameSlug = decoded.toLowerCase().trim();

  return (
    <div className="relative min-h-screen text-white selection:bg-orange-500/30">
      <main className="relative z-10">
        <section className="container mx-auto max-w-7xl px-4">
          <UserPublicProfileShell username={usernameSlug}>{children}</UserPublicProfileShell>
        </section>
      </main>
    </div>
  );
}
