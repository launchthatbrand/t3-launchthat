import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";

export default async function JournalLayout(props: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in");
  }

  return (
    <main className="container mx-auto max-w-5xl space-y-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">TraderLaunchpad</h1>
          <p className="text-muted-foreground text-sm">
            Your private journal (standalone app).
          </p>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-3 text-sm">
            <Link className="hover:underline" href="/journal/dashboard">
              Dashboard
            </Link>
            <Link className="hover:underline" href="/journal/orders">
              Orders
            </Link>
            <Link className="hover:underline" href="/journal/settings">
              Settings
            </Link>
          </nav>
          <TraderLaunchpadNavUser afterSignOutUrl="/sign-in" />
        </div>
      </header>

      {props.children}
    </main>
  );
}


