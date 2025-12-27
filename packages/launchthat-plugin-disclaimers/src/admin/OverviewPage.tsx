"use client";

import type { PluginSettingComponentProps } from "launchthat-plugin-core";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

export const DisclaimersOverviewPage = (_props: PluginSettingComponentProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Disclaimers</CardTitle>
          <CardDescription>
            Manage disclaimer templates and view issued disclaimers.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <a href="/admin/edit?post_type=disclaimertemplates">Templates</a>
          </Button>
          <Button asChild>
            <a href="/admin/edit?post_type=disclaimers">Issued disclaimers</a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};



