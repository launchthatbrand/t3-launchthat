"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import type { PluginSettingComponentProps } from "~/lib/plugins/types";
import { LmsGeneralSettings } from "./lms-general-settings";
import { LmsPermalinksSettings } from "./lms-permalinks-settings";

export function LmsSettingsPage(props: PluginSettingComponentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isNavigating, startTransition] = useTransition();

  const desiredTab = useMemo(
    () => searchParams.get("tab") ?? "general",
    [searchParams],
  );

  const [tabValue, setTabValue] = useState(desiredTab);

  useEffect(() => {
    setTabValue(desiredTab);
  }, [desiredTab]);

  const handleTabChange = (nextTab: string) => {
    setTabValue(nextTab);
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      if (!nextTab || nextTab === "general") {
        params.delete("tab");
      } else {
        params.set("tab", nextTab);
      }
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, {
        scroll: false,
      });
    });
  };

  return (
    <Tabs
      value={tabValue}
      onValueChange={handleTabChange}
      className="space-y-6"
      data-loading={isNavigating ? "true" : "false"}
    >
      <TabsList className="bg-transparent">
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="permalinks">Permalinks</TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">General</h2>
          <p className="text-sm text-muted-foreground">
            Branding, descriptions and learner defaults.
          </p>
        </div>
        <LmsGeneralSettings {...props} />
      </TabsContent>
      <TabsContent value="permalinks" className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Permalinks</h2>
          <p className="text-sm text-muted-foreground">
            Control base paths and slug formats for courses and lessons.
          </p>
        </div>
        <LmsPermalinksSettings {...props} />
      </TabsContent>
    </Tabs>
  );
}
