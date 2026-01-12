"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { LogEntityList } from "launchthat-plugin-logs/admin";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

import {
  AdminLayout,
  AdminLayoutContent,
  AdminLayoutHeader,
  AdminLayoutMain,
} from "~/components/admin/AdminLayout";
import { useTenant } from "~/context/TenantContext";
import { useConvexUser } from "~/hooks/useConvexUser";

export default function AdminLogsPage() {
  const tenant = useTenant();
  const orgId: Id<"organizations"> | undefined = tenant?._id;
  const { user: convexUser } = useConvexUser();

  const actorUserId = (convexUser as { _id?: Id<"users"> } | null)?._id;
  const isUserLoading = convexUser === undefined;

  return (
    <AdminLayout
      title="Logs"
      description="Unified org-scoped logs across the Portal and plugins."
    >
      <AdminLayoutHeader />
      <AdminLayoutContent className="flex flex-1">
        <AdminLayoutMain className="flex-1">
          <div className="container py-4">
            {isUserLoading ? (
              <Card>
                <CardHeader>
                  <CardTitle>Logs</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-64 w-full" />
                </CardContent>
              </Card>
            ) : !orgId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Logs</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  Tenant context is missing for this host. This usually means
                  the current domain isn’t resolving to an organization.
                </CardContent>
              </Card>
            ) : !actorUserId ? (
              <Card>
                <CardHeader>
                  <CardTitle>Logs</CardTitle>
                </CardHeader>
                <CardContent className="text-muted-foreground text-sm">
                  You’re not signed in (or your session hasn’t been established
                  on this host yet). Try refreshing once, or sign in again.
                </CardContent>
              </Card>
            ) : (
              <LogEntityList
                orgId={orgId}
                actorUserId={actorUserId}
                listLogsQuery={api.core.logs.queries.listLogsForOrg}
                listEmailSuggestionsQuery={
                  api.core.logs.queries.listEmailSuggestionsForOrg
                }
                title="Logs"
                description="Filter by source or search across columns."
                limit={500}
              />
            )}
          </div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
