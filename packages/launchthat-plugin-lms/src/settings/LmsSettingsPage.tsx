"use client";

import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { LmsGeneralSettings } from "./LmsGeneralSettings";
import { LmsPermalinksSettings } from "./LmsPermalinksSettings";

export const LmsSettingsPage = (props: PluginSettingComponentProps) => {
  const [tabValue, setTabValue] = useState("general");

  return (
    <Tabs
      value={tabValue}
      onValueChange={setTabValue}
      className="container space-y-6"
      data-loading="false"
    >
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="permalinks">Permalinks</TabsTrigger>
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
    </Tabs>
  );
};
