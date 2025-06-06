import type { Metadata } from "next";

import { InvitationsPageClient } from "./InvitationsPageClient";

export const metadata: Metadata = {
  title: "Invitations | WSA App",
  description: "Manage your group invitations and requests",
};

export default function InvitationsPage() {
  return <InvitationsPageClient />;
}
