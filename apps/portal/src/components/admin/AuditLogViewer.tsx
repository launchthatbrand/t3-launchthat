"use client";

import React, { useState } from "react";
import { api } from "@convex-config/_generated/api";
import { Id } from "@convex-config/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { usePaginatedQuery } from "convex/react";
import { format } from "date-fns";
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

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { CopyText } from "@acme/ui/copy-text";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { usePDFExportWithPreview } from "@acme/ui/pdf-export";
import { toast } from "@acme/ui/toast";

import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Shared audit log types and utilities
export interface AuditLog {
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

// Shared configuration for severity badges
export const severityConfig = {
  info: {
    variant: "secondary" as const,
    icon: Info,
    color: "text-blue-600",
    label: "Info",
  },
  warning: {
    variant: "outline" as const,
    icon: AlertTriangle,
    color: "text-yellow-600",
    label: "Warning",
  },
  error: {
    variant: "destructive" as const,
    icon: XCircle,
    color: "text-red-600",
    label: "Error",
  },
  critical: {
    variant: "destructive" as const,
    icon: AlertCircle,
    color: "text-red-800",
    label: "Critical",
  },
};

// Shared configuration for category badges
export const categoryConfig = {
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

// Shared badge rendering functions
export const getSeverityBadge = (severity: AuditLog["severity"]) => {
  const config = severityConfig[severity];
  const IconComponent = config.icon;
  return (
    <Badge variant={config.variant} className="flex items-center gap-1">
      <IconComponent className={`h-3 w-3 ${config.color}`} />
      {config.label}
    </Badge>
  );
};

export const getCategoryBadge = (category: AuditLog["category"]) => {
  const config = categoryConfig[category];
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const getSuccessBadge = (success: boolean) => {
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
};

// Shared column definitions factory
export const createAuditLogColumns = (
  options: {
    showResourceId?: boolean;
    showUserColumn?: boolean;
    onRowClick?: (auditLog: AuditLog) => void;
  } = {},
): ColumnDef<AuditLog>[] => {
  const { showResourceId = true, showUserColumn = false } = options;

  const baseColumns: ColumnDef<AuditLog>[] = [
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
  ];

  if (showResourceId) {
    baseColumns.push({
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
    });
  }

  baseColumns.push(
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
      cell: ({ row }) => getSeverityBadge(row.original.severity),
    },
    {
      id: "category",
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => getCategoryBadge(row.original.category),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "success",
      cell: ({ row }) => getSuccessBadge(row.original.success),
    },
  );

  if (showUserColumn) {
    baseColumns.push({
      id: "userId",
      header: "User",
      accessorKey: "userId",
      cell: ({ row }) => {
        const userId = row.original.userId;
        return userId ? (
          <div className="font-mono text-sm">{userId.slice(-8)}</div>
        ) : (
          <span className="text-muted-foreground">Anonymous</span>
        );
      },
    });
  }

  return baseColumns;
};

// Shared filter configurations
export const auditLogFilters: FilterConfig<AuditLog>[] = [
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

// Props for the embeddable audit log table
interface AuditLogTableProps {
  userId?: Id<"users">;
  userName?: string;
  userEmail?: string;
  onPDFGenerated?: (pdfBlob: Blob, filename: string) => void;
  exportButtonText?: string;
  showSummaryCards?: boolean;
  showResourceDetails?: boolean;
  className?: string;
  apiQuery?: "getUserAuditLog" | "getAuditLogEntries";
  queryArgs?: Record<string, unknown>;
}

// Props for the dialog wrapper
interface AuditLogViewerProps {
  userId: Id<"users">;
  userName?: string;
  userEmail?: string;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onPDFGenerated?: (pdfBlob: Blob, filename: string) => void;
  exportButtonText?: string;
}

// Reusable audit log table component
export const AuditLogTable: React.FC<AuditLogTableProps> = ({
  userId,
  userName,
  userEmail,
  onPDFGenerated,
  exportButtonText = "Export PDF",
  showSummaryCards = true,
  showResourceDetails = true,
  className,
  apiQuery = "getUserAuditLog",
  queryArgs,
}) => {
  // Determine which API to call and what args to use
  const apiEndpoint =
    apiQuery === "getUserAuditLog"
      ? api.core.auditLog.getUserAuditLog
      : api.core.auditLog.getAuditLogEntries;

  const finalArgs = userId ? { userId, ...queryArgs } : (queryArgs ?? {});

  // Get paginated audit log data
  const {
    results: auditLogData,
    status: paginationStatus,
    loadMore,
  } = usePaginatedQuery(apiEndpoint, finalArgs, { initialNumItems: 25 });

  // PDF Export functionality
  const { openPreview, PreviewDialog } = usePDFExportWithPreview();

  // Use the shared column factory
  const columns = createAuditLogColumns({
    showResourceId: showResourceDetails,
    showUserColumn: !userId, // Show user column only when not filtering by specific user
  });

  // Entity actions for audit log entries
  const actions: EntityAction<AuditLog>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (auditLog) => {
        console.log("Audit log details:", auditLog);
      },
      variant: "outline",
    },
  ];

  // PDF Export function
  const handleExportToPDF = async () => {
    if (!auditLogData?.length) {
      toast.error("No audit log data to export");
      return;
    }

    // If onPDFGenerated is provided, generate PDF directly without preview
    if (onPDFGenerated) {
      try {
        const { pdf, Document, Page, Text, View, StyleSheet } = await import(
          "@react-pdf/renderer"
        );

        // Simple PDF document without custom fonts
        const styles = StyleSheet.create({
          page: {
            flexDirection: "column",
            backgroundColor: "#FFFFFF",
            padding: 30,
          },
          title: {
            fontSize: 20,
            marginBottom: 20,
            textAlign: "center",
          },
          subtitle: {
            fontSize: 14,
            marginBottom: 20,
            textAlign: "center",
            color: "#666666",
          },
          table: {
            width: "auto",
            marginTop: 20,
          },
          tableRow: {
            margin: "auto",
            flexDirection: "row",
          },
          tableColHeader: {
            width: "16%",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#000000",
            backgroundColor: "#f0f0f0",
            padding: 5,
          },
          tableCol: {
            width: "16%",
            borderStyle: "solid",
            borderWidth: 1,
            borderColor: "#000000",
            padding: 5,
          },
          tableCellHeader: {
            fontSize: 10,
            fontWeight: "bold",
          },
          tableCell: {
            fontSize: 8,
          },
          metadata: {
            marginTop: 20,
            fontSize: 8,
            color: "#666666",
          },
        });

        const formatValue = (value: unknown): string => {
          if (value === null || value === undefined) return "-";
          if (typeof value === "boolean") return value ? "Success" : "Failed";
          if (typeof value === "string") return value;
          if (typeof value === "number")
            return new Date(value).toLocaleString();
          return String(value);
        };

        // Create PDF document as JSX
        const docElement = (
          <Document>
            <Page size="A4" style={styles.page}>
              <Text style={styles.title}>
                {userId ? "User Audit Log" : "System Audit Log"}
              </Text>
              <Text style={styles.subtitle}>
                {userId
                  ? `Activity log for ${userName ?? userEmail ?? "user"}`
                  : "System-wide activity log"}
              </Text>

              <View style={styles.table}>
                {/* Table Header */}
                <View style={styles.tableRow}>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Timestamp</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Action</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>URI</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Severity</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Category</Text>
                  </View>
                  <View style={styles.tableColHeader}>
                    <Text style={styles.tableCellHeader}>Status</Text>
                  </View>
                </View>

                {/* Table Rows - limit to first 50 for performance */}
                {auditLogData.slice(0, 50).map((log, index) => (
                  <View key={index} style={styles.tableRow}>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {formatValue(log.timestamp)}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {formatValue(log.action)}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {formatValue(log.uri)}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {formatValue(log.severity)}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {formatValue(log.category)}
                      </Text>
                    </View>
                    <View style={styles.tableCol}>
                      <Text style={styles.tableCell}>
                        {formatValue(log.success)}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>

              {/* Metadata */}
              <View style={styles.metadata}>
                <Text>Export Date: {new Date().toLocaleString()}</Text>
                <Text>Total Records: {auditLogData.length}</Text>
                <Text>Generated By: Portal Admin</Text>
                {userId && (
                  <Text>User: {userName ?? userEmail ?? `ID: ${userId}`}</Text>
                )}
                {auditLogData.length > 50 && (
                  <Text>Note: Showing first 50 records only</Text>
                )}
              </View>
            </Page>
          </Document>
        );

        // Generate PDF
        const blob = await pdf(docElement).toBlob();
        const filename = `audit_log_${userName ?? userEmail ?? userId ?? "system"}_${new Date().toISOString().split("T")[0]}.pdf`;

        // Call the callback with the generated PDF
        onPDFGenerated(blob, filename);
        return;
      } catch (error) {
        console.error("PDF generation error:", error);
        toast.error("Failed to generate PDF. Please try again.");
        return;
      }
    }

    // For standalone usage, show preview dialog
    const filename = `audit_log_${userName ?? userEmail ?? userId ?? "system"}_${new Date().toISOString().split("T")[0]}.pdf`;

    await openPreview({
      title: userId ? "User Audit Log" : "System Audit Log",
      subtitle: userId
        ? `Activity log for ${userName ?? userEmail ?? "user"}`
        : "System-wide activity log",
      filename,
      data: auditLogData as Record<string, unknown>[],
      columns: [
        { key: "timestamp", header: "Timestamp" },
        { key: "action", header: "Action" },
        { key: "uri", header: "URI" },
        { key: "severity", header: "Severity" },
        { key: "category", header: "Category" },
        { key: "success", header: "Status" },
      ],
      pageOrientation: "portrait",
      includeMetadata: true,
      customMetadata: {
        ...(userId && { User: userName ?? userEmail ?? `ID: ${userId}` }),
        "Export Date": new Date().toLocaleString(),
        "Total Records": auditLogData.length.toString(),
        "Generated By": "Portal Admin",
        "Filter Applied": "All Records",
      },
      customActions: [],
      showSaveButton: true,
    });
  };

  const tableActions = (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExportToPDF}
      disabled={!auditLogData?.length}
    >
      <Download className="mr-2 h-4 w-4" />
      {exportButtonText}
    </Button>
  );

  return (
    <div className={className}>
      <div className="space-y-4">
        {/* Summary Statistics */}
        {showSummaryCards && auditLogData?.length && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Database className="h-4 w-4 text-blue-600" />
                  <div>
                    <p className="text-sm font-medium">Total Entries</p>
                    <p className="text-2xl font-bold">{auditLogData.length}</p>
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
            filters={auditLogFilters}
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
                disabled={false}
              >
                Load More
              </Button>
            </div>
          )}

          {paginationStatus === "LoadingMore" && (
            <div className="flex justify-center border-t p-4">
              <Button variant="outline" disabled>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
                Loading...
              </Button>
            </div>
          )}
        </div>
      </div>

      <PreviewDialog />
    </div>
  );
};

// Original dialog wrapper component for standalone use
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

  const dialogOpen = open ?? isOpen;
  const setDialogOpen = onOpenChange ?? setIsOpen;

  const DefaultTrigger = (
    <Button variant="outline" size="sm">
      <Activity className="mr-2 h-4 w-4" />
      View Audit Log
    </Button>
  );

  return (
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

        <AuditLogTable
          userId={userId}
          userName={userName}
          userEmail={userEmail}
          onPDFGenerated={onPDFGenerated}
          exportButtonText={exportButtonText}
          showSummaryCards={true}
        />
      </DialogContent>
    </Dialog>
  );
};
