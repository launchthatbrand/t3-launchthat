"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { LmsGeneralSettings } from "./LmsGeneralSettings";
import { LmsPermalinksSettings } from "./LmsPermalinksSettings";
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useState } from "react";

export const LmsSettingsPage = (props: PluginSettingComponentProps) => {
  const [tabValue, setTabValue] = useState("general");

  return (
    <Tabs
      value={tabValue}
      onValueChange={setTabValue}
      className="space-y-6"
      data-loading="false"
    >
      <TabsList>
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
};

