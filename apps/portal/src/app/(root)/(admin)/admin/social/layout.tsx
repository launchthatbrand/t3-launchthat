"use client";

import type { ReactNode } from "react";
import { PortalSocialFeedProvider } from "@/src/providers/SocialFeedProvider";

export default function AdminSocialLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <PortalSocialFeedProvider>{children}</PortalSocialFeedProvider>;
}
