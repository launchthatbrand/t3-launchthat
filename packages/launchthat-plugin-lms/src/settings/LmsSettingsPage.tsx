"use client";

import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useCallback, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { LogEntityList } from "launchthat-plugin-logs/admin";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { LmsGeneralSettings } from "./LmsGeneralSettings";
import { LmsPermalinksSettings } from "./LmsPermalinksSettings";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const apiAny: any = api;

export const LmsSettingsPage = (props: PluginSettingComponentProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchParamsString = searchParams.toString();

  const orgId = props.organizationId ?? undefined;
  const me = useQuery(apiAny.core.users.queries.getMe, {});
  const actorUserId = (me as { _id?: unknown } | null)?._id;

  const tabValue = useMemo(() => {
    const params = new URLSearchParams(searchParamsString);
    const requested = (params.get("tab") ?? "general").toLowerCase().trim();
    if (
      requested !== "general" &&
      requested !== "permalinks" &&
      requested !== "logs"
    ) {
      return "general";
    }
    return requested;
  }, [searchParamsString]);

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParamsString);
      if (!value || value === "general") {
        params.delete("tab");
      } else {
        params.set("tab", value);
      }
      router.replace(`/admin/edit?${params.toString()}`);
    },
    [router, searchParamsString],
  );

  return (
    <Tabs
      value={tabValue}
      onValueChange={handleTabChange}
      className="container space-y-6"
      data-loading="false"
    >
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="permalinks">Permalinks</TabsTrigger>
        <TabsTrigger value="logs">Logs</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">General</h2>
          <p className="text-muted-foreground text-sm">
            Branding, descriptions and learner defaults.
          </p>
        </div>
        <LmsGeneralSettings {...props} />
      </TabsContent>
      <TabsContent value="permalinks" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Permalinks</h2>
          <p className="text-muted-foreground text-sm">
            Control base paths and slug formats for courses and lessons.
          </p>
        </div>
        <LmsPermalinksSettings {...props} />
      </TabsContent>
      <TabsContent value="logs" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Logs</h2>
          <p className="text-muted-foreground text-sm">
            LMS activity logs (access, completion, enrollments).
          </p>
        </div>
        {orgId && actorUserId ? (
          <LogEntityList
            orgId={orgId as any}
            actorUserId={actorUserId as any}
            listLogsQuery={apiAny.core.logs.queries.listLogsForOrg}
            listEmailSuggestionsQuery={
              apiAny.core.logs.queries.listEmailSuggestionsForOrg
            }
            title="LMS logs"
            description="Filter by email to investigate user activity."
            limit={200}
            initialPluginKey="lms"
            hidePluginFilter
          />
        ) : null}
      </TabsContent>
    </Tabs>
  );
};
