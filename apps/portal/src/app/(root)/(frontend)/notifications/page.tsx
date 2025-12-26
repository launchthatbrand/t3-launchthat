"use client";

import { useClerk } from "@clerk/nextjs";

import { useTenant } from "~/context/TenantContext";
import { NotificationsList } from "~/components/notifications/NotificationsList";

export default function NotificationsPage() {
  const { user } = useClerk();
  const clerkId = user?.id;
  const tenant = useTenant();
  const orgId = tenant?._id;

  return (
    <div className="container mx-auto max-w-3xl px-4 py-6">
      <NotificationsList clerkId={clerkId} orgId={orgId ?? undefined} />
    </div>
  );
}


