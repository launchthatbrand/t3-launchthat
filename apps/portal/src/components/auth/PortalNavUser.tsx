"use client";

import { useClerk, useSession } from "@clerk/nextjs";

import { NavUser } from "@acme/ui/general/nav-user";

export function PortalNavUser() {
  const { session } = useSession();
  const { openSignIn, signOut } = useClerk();

  if (!session) {
    return (
      <NavUser
        className="!ml-auto"
        isAuthenticated={false}
        onSignIn={() => {
          if (openSignIn) {
            void openSignIn({});
          }
        }}
      />
    );
  }

  return (
    <NavUser
      className="!ml-auto"
      isAuthenticated
      user={{
        name: session.user.fullName ?? session.user.username ?? undefined,
        email: session.user.emailAddresses[0]?.emailAddress ?? undefined,
        avatar: session.user.imageUrl ?? undefined,
      }}
      onSignOut={() => signOut()}
    />
  );
}

