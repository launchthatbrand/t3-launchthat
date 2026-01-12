"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { api } from "@/convex/_generated/api";
import { LogEntityList } from "launchthat-plugin-logs/admin";

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

  return (
    <AdminLayout
      title="Logs"
      description="Unified org-scoped logs across the Portal and plugins."
    >
      <AdminLayoutHeader />
      <AdminLayoutContent className="flex flex-1">
        <AdminLayoutMain className="flex-1">
          <div className="container py-4">
            {orgId && actorUserId ? (
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
            ) : null}
          </div>
        </AdminLayoutMain>
      </AdminLayoutContent>
    </AdminLayout>
  );
}
