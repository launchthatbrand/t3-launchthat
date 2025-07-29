"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  Clock,
  Code,
  Database,
  Eye,
  Globe,
  Info,
  Link as LinkIcon,
  MapPin,
  Monitor,
  User,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Id } from "@convex-config/_generated/dataModel";
import Link from "next/link";
import React from "react";
import { Separator } from "@acme/ui/separator";
import { api } from "@convex-config/_generated/api";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

interface Props {
  params: Promise<{
    auditLogId: string;
  }>;
}

export default function AuditLogDetailPage({ params }: Props) {
  const resolvedParams = React.use(params);
  const router = useRouter();
  const auditLogId = resolvedParams.auditLogId as Id<"auditLog">;

  // Get audit log entry
  const auditLogEntry = useQuery(api.core.getAuditLogEntry, {
    auditLogId,
  });

  // Format date/time
  const formatDateTime = (timestamp: number) => {
    return format(new Date(timestamp), "EEEE, MMMM do, yyyy 'at' h:mm:ss a");
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    const config = {
      info: { variant: "default" as const, icon: Info, label: "Info" },
      warning: {
        variant: "secondary" as const,
        icon: AlertTriangle,
        label: "Warning",
      },
      error: { variant: "destructive" as const, icon: XCircle, label: "Error" },
      critical: {
        variant: "destructive" as const,
        icon: AlertCircle,
        label: "Critical",
      },
    };

    const configItem = config[severity as keyof typeof config] || config.info;
    const { variant, icon: Icon, label } = configItem;
    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {label}
      </Badge>
    );
  };

  // Get category badge
  const getCategoryBadge = (category: string) => {
    const config = {
      authentication: { variant: "default" as const, label: "Authentication" },
      authorization: { variant: "secondary" as const, label: "Authorization" },
      data_access: { variant: "outline" as const, label: "Data Access" },
      data_modification: {
        variant: "secondary" as const,
        label: "Data Modification",
      },
      system: { variant: "default" as const, label: "System" },
      ecommerce: { variant: "default" as const, label: "E-commerce" },
      navigation: { variant: "outline" as const, label: "Navigation" },
      security: { variant: "destructive" as const, label: "Security" },
    };

    const configItem = config[category as keyof typeof config] || {
      variant: "outline" as const,
      label: category,
    };
    return <Badge variant={configItem.variant}>{configItem.label}</Badge>;
  };

  // Show loading state
  if (auditLogEntry === undefined) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading audit log entry...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show not found state
  if (auditLogEntry === null) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings/auditLog">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Audit Log Entry Not Found</h1>
        </div>
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center">
            <AlertCircle className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              The requested audit log entry could not be found.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" asChild>
              <Link href="/admin/settings/auditLog">
                <ChevronLeft className="h-4 w-4" />
              </Link>
            </Button>
            <h1 className="text-3xl font-bold">Audit Log Entry</h1>
          </div>
          <p className="mt-2 text-muted-foreground">
            Detailed information about this audit log entry
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Entry Overview
            </CardTitle>
            <div className="flex items-center gap-2">
              {getSeverityBadge(auditLogEntry.severity)}
              {getCategoryBadge(auditLogEntry.category)}
              <Badge
                variant={auditLogEntry.success ? "default" : "destructive"}
              >
                {auditLogEntry.success ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {auditLogEntry.success ? "Success" : "Failed"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Entry ID</p>
              <p className="font-mono text-sm text-muted-foreground">
                {auditLogEntry._id}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Timestamp</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(auditLogEntry.timestamp)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Action</p>
              <p className="text-sm font-medium">{auditLogEntry.action}</p>
            </div>
            {auditLogEntry.resource && (
              <div>
                <p className="text-sm font-medium">Resource</p>
                <p className="text-sm text-muted-foreground">
                  {auditLogEntry.resource}
                  {auditLogEntry.resourceId && ` (${auditLogEntry.resourceId})`}
                </p>
              </div>
            )}
          </div>

          {auditLogEntry.details && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium">Details</p>
                <div className="rounded-md bg-muted p-3 text-sm">
                  {auditLogEntry.details}
                </div>
              </div>
            </>
          )}

          {auditLogEntry.errorMessage && (
            <>
              <Separator />
              <div>
                <p className="mb-2 text-sm font-medium">Error Message</p>
                <div className="rounded-md border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
                  {auditLogEntry.errorMessage}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* User Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">User ID</p>
              <p className="font-mono text-sm text-muted-foreground">
                {auditLogEntry.userId || "Anonymous"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Session ID</p>
              <p className="font-mono text-sm text-muted-foreground">
                {auditLogEntry.sessionId || "N/A"}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Request Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Request Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">URI</p>
              <p className="break-all font-mono text-sm text-muted-foreground">
                {auditLogEntry.uri}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Method</p>
              <p className="text-sm text-muted-foreground">
                {auditLogEntry.method || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">IP Address</p>
              <p className="font-mono text-sm text-muted-foreground">
                {auditLogEntry.ipAddress || "N/A"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Processing Time</p>
              <p className="text-sm text-muted-foreground">
                {auditLogEntry.processingTime
                  ? `${auditLogEntry.processingTime}ms`
                  : "N/A"}
              </p>
            </div>
          </div>

          {auditLogEntry.referer && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium">Referer</p>
                <p className="break-all font-mono text-sm text-muted-foreground">
                  {auditLogEntry.referer}
                </p>
              </div>
            </>
          )}

          {auditLogEntry.userAgent && (
            <>
              <Separator />
              <div>
                <p className="text-sm font-medium">User Agent</p>
                <div className="rounded-md bg-muted p-3 font-mono text-sm">
                  {auditLogEntry.userAgent}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Location Information */}
      {(auditLogEntry.country ||
        auditLogEntry.region ||
        auditLogEntry.city) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Location Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {auditLogEntry.country && (
                <div>
                  <p className="text-sm font-medium">Country</p>
                  <p className="text-sm text-muted-foreground">
                    {auditLogEntry.country}
                  </p>
                </div>
              )}
              {auditLogEntry.region && (
                <div>
                  <p className="text-sm font-medium">Region</p>
                  <p className="text-sm text-muted-foreground">
                    {auditLogEntry.region}
                  </p>
                </div>
              )}
              {auditLogEntry.city && (
                <div>
                  <p className="text-sm font-medium">City</p>
                  <p className="text-sm text-muted-foreground">
                    {auditLogEntry.city}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Changes */}
      {(auditLogEntry.oldValues || auditLogEntry.newValues) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Changes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {auditLogEntry.oldValues && (
              <div>
                <p className="mb-2 text-sm font-medium">Old Values</p>
                <div className="overflow-auto rounded-md bg-muted p-3 font-mono text-sm">
                  <pre>
                    {JSON.stringify(
                      JSON.parse(auditLogEntry.oldValues),
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            )}
            {auditLogEntry.newValues && (
              <div>
                <p className="mb-2 text-sm font-medium">New Values</p>
                <div className="overflow-auto rounded-md bg-muted p-3 font-mono text-sm">
                  <pre>
                    {JSON.stringify(
                      JSON.parse(auditLogEntry.newValues),
                      null,
                      2,
                    )}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* System Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            System Information
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Created At</p>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(auditLogEntry._creationTime)}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium">Category</p>
              <p className="text-sm capitalize text-muted-foreground">
                {auditLogEntry.category.replace("_", " ")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
