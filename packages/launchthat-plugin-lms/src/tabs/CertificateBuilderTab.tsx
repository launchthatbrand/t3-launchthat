"use client";

import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";

import { Card, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";

import type { Id } from "../lib/convexId";
import { CertificateBuilderScreen } from "../screens/CertificateBuilderScreen";

export const CertificateBuilderTab = ({
  postId,
  organizationId,
}: PluginSingleViewComponentProps) => {
  const normalizedOrganizationId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;

  if (!postId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save required</CardTitle>
          <CardDescription>
            Save this certificate entry first, then reopen the Builder tab to
            design it.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <CertificateBuilderScreen
      certificateId={postId as Id<"posts">}
      organizationId={normalizedOrganizationId}
    />
  );
};

