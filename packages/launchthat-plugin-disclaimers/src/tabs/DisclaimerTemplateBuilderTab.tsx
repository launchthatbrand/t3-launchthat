"use client";

import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";

import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import { DisclaimerTemplateBuilderScreen } from "../screens/DisclaimerTemplateBuilderScreen";

export const DisclaimerTemplateBuilderTab = ({
  postId,
  organizationId,
}: PluginSingleViewComponentProps) => {
  if (!postId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save required</CardTitle>
          <CardDescription>
            Save this disclaimer template first, then reopen the Builder tab to
            design it.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <DisclaimerTemplateBuilderScreen
      templatePostId={postId}
      organizationId={organizationId ? String(organizationId) : undefined}
    />
  );
};













