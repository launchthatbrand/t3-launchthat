"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  Eye,
  Info,
  XCircle,
} from "lucide-react";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import React, { useState } from "react";
import {
  convertToPDFColumns,
  usePDFExportWithPreview,
} from "@acme/ui/pdf-export";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { ColumnDef } from "@tanstack/react-table";
import { CopyText } from "@acme/ui/copy-text";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { Id } from "@convex-config/_generated/dataModel";
import { api } from "@convex-config/_generated/api";
import { format } from "date-fns";
import { toast } from "@acme/ui/toast";
import { usePaginatedQuery } from "convex/react";

interface AuditLogViewerProps {
  userId: Id<"users">;
  userName?: string;
  userEmail?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // New: Callback for when PDF is generated
  onPDFGenerated?: (pdfBlob: Blob, filename: string) => void;
  // New: Custom button text for different contexts
  exportButtonText?: string;
}

// Type for the audit log entries returned by getUserAuditLog
interface AuditLog {
  _id: Id<"auditLog">;
  _creationTime: number;
  action: string;
  resource?: string;
  resourceId?: string;
  uri: string;
  method?: string;
  userAgent?: string;
  referer?: string;
  ipAddress?: string;
  country?: string;
  region?: string;
  city?: string;
  severity: "info" | "warning" | "error" | "critical";
  category:
    | "authentication"
    | "authorization"
    | "data_access"
    | "data_modification"
    | "system"
    | "ecommerce"
    | "navigation"
    | "security";
  details?: string;
  oldValues?: string;
  newValues?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: number;
  processingTime?: number;
  sessionId?: string;
  userId?: Id<"users">;
}

export const AuditLogViewer: React.FC<AuditLogViewerProps> = ({
  userId,
  userName,
  userEmail,
  trigger,
  open,
  onOpenChange,
  onPDFGenerated,
  exportButtonText = "Export PDF",
}) => {
  const [isOpen, setIsOpen] = useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  // Get paginated audit log data for this user
  const {
    results: auditLogData,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(
    api.core.auditLog.getUserAuditLog,
    { userId },
    { initialNumItems: 25 },
  );

  // PDF Export functionality with preview
  const { openPreview, PreviewDialog, exportToPDF } = usePDFExportWithPreview();

  // Define columns for the audit log table
  const columns: ColumnDef<AuditLog>[] = [
    {
      id: "timestamp",
      header: "Timestamp",
      accessorKey: "timestamp",
      cell: ({ row }) => (
        <div className="text-sm">
          {format(new Date(row.original.timestamp), "MMM dd, yyyy HH:mm:ss")}
        </div>
      ),
    },
    {
      id: "action",
      header: "Action",
      accessorKey: "action",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.action}</span>
      ),
    },
    {
      id: "resource",
      header: "Resource",
      accessorKey: "resource",
      cell: ({ row }) => {
        const resource = row.original.resource;
        const resourceId = row.original.resourceId;
        return (
          <div className="flex flex-col gap-1">
            {resource && <span className="text-sm">{resource}</span>}
            {resourceId && (
              <CopyText value={resourceId} className="max-w-fit">
                <span className="font-mono text-xs text-muted-foreground">
                  {resourceId}
                </span>
              </CopyText>
            )}
          </div>
        );
      },
    },
    {
      id: "uri",
      header: "URI",
      accessorKey: "uri",
      cell: ({ row }) => (
        <CopyText value={row.original.uri} className="max-w-fit">
          <span className="font-mono text-xs">{row.original.uri}</span>
        </CopyText>
      ),
    },
    {
      id: "severity",
      header: "Severity",
      accessorKey: "severity",
      cell: ({ row }) => {
        const severity = row.original.severity;
        const severityConfig = {
          info: {
            variant: "secondary" as const,
            icon: Info,
            color: "text-blue-600",
          },
          warning: {
            variant: "outline" as const,
            icon: AlertTriangle,
            color: "text-yellow-600",
          },
          error: {
            variant: "destructive" as const,
            icon: XCircle,
            color: "text-red-600",
          },
          critical: {
            variant: "destructive" as const,
            icon: AlertCircle,
            color: "text-red-800",
          },
        };
        const config = severityConfig[severity];
        const IconComponent = config.icon;
        return (
          <Badge variant={config.variant} className="flex items-center gap-1">
            <IconComponent className={`h-3 w-3 ${config.color}`} />
            {severity}
          </Badge>
        );
      },
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => {
        const category = row.original.category;
        const categoryConfig = {
          authentication: { variant: "default" as const, label: "Auth" },
          authorization: { variant: "secondary" as const, label: "Authz" },
          data_access: { variant: "outline" as const, label: "Data Read" },
          data_modification: {
            variant: "destructive" as const,
            label: "Data Write",
          },
          system: { variant: "secondary" as const, label: "System" },
          ecommerce: { variant: "default" as const, label: "Commerce" },
          navigation: { variant: "outline" as const, label: "Nav" },
          security: { variant: "destructive" as const, label: "Security" },
        };
        const config = categoryConfig[category] ?? categoryConfig.system;
        return <Badge variant={config.variant}>{config.label}</Badge>;
      },
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "success",
      cell: ({ row }) => {
        const success = row.original.success;
        return (
          <Badge variant={success ? "default" : "destructive"}>
            {success ? (
              <CheckCircle className="mr-1 h-3 w-3" />
            ) : (
              <XCircle className="mr-1 h-3 w-3" />
            )}
            {success ? "Success" : "Failed"}
          </Badge>
        );
      },
    },
  ];

  // Define filter configurations
  const filters: FilterConfig<AuditLog>[] = [
    {
      id: "action",
      label: "Action",
      type: "text",
      field: "action",
    },
    {
      id: "severity",
      label: "Severity",
      type: "select",
      field: "severity",
      options: [
        { label: "Info", value: "info" },
        { label: "Warning", value: "warning" },
        { label: "Error", value: "error" },
        { label: "Critical", value: "critical" },
      ],
    },
    {
      id: "success",
      label: "Status",
      type: "select",
      field: "success",
      options: [
        { label: "Success", value: true },
        { label: "Failure", value: false },
      ],
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      field: "category",
      options: [
        { label: "Authentication", value: "authentication" },
        { label: "Authorization", value: "authorization" },
        { label: "Data Access", value: "data_access" },
        { label: "Data Modification", value: "data_modification" },
        { label: "System", value: "system" },
        { label: "Ecommerce", value: "ecommerce" },
        { label: "Navigation", value: "navigation" },
        { label: "Security", value: "security" },
      ],
    },
    {
      id: "resource",
      label: "Resource",
      type: "text",
      field: "resource",
    },
    {
      id: "uri",
      label: "URI",
      type: "text",
      field: "uri",
    },
  ];

  // Entity actions for audit log entries
  const actions: EntityAction<AuditLog>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (auditLog) => {
        // For now, just show the details in console
        // Could open a detailed view dialog in the future
        console.log("Audit log details:", auditLog);
      },
      variant: "outline",
    },
  ];

  // PDF Export function with preview - ALWAYS show preview first
  const handleExportToPDF = async () => {
    if (!auditLogData?.length) {
      toast.error("No audit log data to export");
      return;
    }

    const pdfColumns = convertToPDFColumns(columns);
    const filename = `audit_log_${userName ?? userEmail ?? userId}_${new Date().toISOString().split("T")[0]}.pdf`;

    // Determine actions based on whether we have an attachment callback
    const actions = [];

    // If onPDFGenerated callback is provided, add attachment action
    if (onPDFGenerated) {
      actions.push({
        label: "Attach as Evidence",
        variant: "primary" as const,
        icon: <Download className="h-4 w-4" />,
        onClick: async (pdfBlob: Blob, filename: string) => {
          try {
            await onPDFGenerated(pdfBlob, filename);
            toast.success("PDF attached successfully!");
          } catch (error) {
            console.error("PDF attachment error:", error);
            toast.error("Failed to attach PDF. Please try again.");
          }
        },
        disabled: false,
      });
    }

    // ALWAYS open preview dialog (with conditional actions and save button)
    openPreview({
      title: "User Audit Log",
      subtitle: `Activity log for ${userName ?? userEmail ?? "user"}`,
      filename,
      data: auditLogData,
      columns: pdfColumns,
      pageOrientation: "portrait",
      includeMetadata: true,
      customMetadata: {
        User: userName ?? userEmail ?? `ID: ${userId}`,
        "Export Date": new Date().toLocaleString(),
        "Total Records": auditLogData.length.toString(),
        "Generated By": "Portal Admin",
        "Filter Applied": "All Records",
      },
      // Custom actions for attachment scenarios
      customActions: actions,
      // Show save button unless we're in attachment-only mode
      showSaveButton: !onPDFGenerated || actions.length === 0,
    });
  };

  const DefaultTrigger = (
    <Button variant="outline" size="sm">
      <Activity className="mr-2 h-4 w-4" />
      View Audit Log
    </Button>
  );

  const tableActions = (
    <>
      {/* Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleExportToPDF}
        disabled={!auditLogData?.length}
      >
        <Download className="mr-2 h-4 w-4" />
        {exportButtonText}
      </Button>
    </>
  );

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogTrigger asChild>{trigger ?? DefaultTrigger}</DialogTrigger>
        <DialogContent className="h-full max-h-[90vh] max-w-7xl overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2 text-2xl">
                  <Activity className="h-5 w-5" />
                  User Activity Audit Log
                  {userName && (
                    <span className="text-base font-normal text-muted-foreground">
                      - {userName}
                    </span>
                  )}
                </DialogTitle>
                {userEmail && (
                  <p className="text-sm text-muted-foreground">{userEmail}</p>
                )}
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4">
            {/* Summary Statistics */}
            {auditLogData?.length && (
              <div className="sticky top-0 z-20 grid grid-cols-1 gap-4 bg-white md:grid-cols-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium">Total Entries</p>
                        <p className="text-2xl font-bold">
                          {auditLogData.length}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <div>
                        <p className="text-sm font-medium">Success</p>
                        <p className="text-2xl font-bold">
                          {
                            auditLogData.filter((log) => log.success === true)
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <div>
                        <p className="text-sm font-medium">Failures</p>
                        <p className="text-2xl font-bold">
                          {
                            auditLogData.filter((log) => log.success === false)
                              .length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600" />
                      <div>
                        <p className="text-sm font-medium">Warnings</p>
                        <p className="text-2xl font-bold">
                          {
                            auditLogData.filter(
                              (log) =>
                                log.severity === "warning" ||
                                log.severity === "error",
                            ).length
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Audit Log Table */}
            <div className="overflow-hidden">
              <EntityList<AuditLog>
                data={auditLogData ?? []}
                columns={columns}
                filters={filters}
                isLoading={
                  auditLogData === undefined ||
                  paginationStatus === "LoadingFirstPage"
                }
                defaultViewMode="list"
                viewModes={["list"]}
                actions={tableActions}
                entityActions={actions}
                enableSearch={true}
                emptyState={
                  <div className="flex h-32 flex-col items-center justify-center">
                    <Activity className="mb-2 h-8 w-8 text-muted-foreground" />
                    <h3 className="text-lg font-medium">No Audit Logs Found</h3>
                    <p className="text-muted-foreground">
                      No activity has been logged for this user yet
                    </p>
                  </div>
                }
                initialSort={{
                  id: "timestamp",
                  direction: "desc",
                }}
              />

              {/* Load More Button */}
              {paginationStatus === "CanLoadMore" && (
                <div className="flex justify-center border-t p-4">
                  <Button
                    variant="outline"
                    onClick={() => loadMore(25)}
                    disabled={paginationStatus === "LoadingMore"}
                  >
                    {paginationStatus === "LoadingMore" ? (
                      <>
                        <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                        Loading...
                      </>
                    ) : (
                      "Load More"
                    )}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Dialog */}
      <PreviewDialog />
    </>
  );
};
