"use client";

import {
  Activity,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Database,
  Download,
  FileText,
  Info,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type {
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import React, { useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import type { ColumnDef } from "@tanstack/react-table";
import { CopyText } from "@acme/ui/copy-text";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { PDFColumn } from "@acme/ui/pdf-export";
import { format } from "date-fns";
import { toast } from "@acme/ui/toast";
import { usePDFExportWithPreview } from "@acme/ui/pdf-export";

// Mock data type for demonstration
interface MockAuditLog {
  id: string;
  action: string;
  resource?: string;
  resourceId?: string;
  uri: string;
  method: string;
  severity: "info" | "warning" | "error" | "critical";
  category: "auth" | "data" | "system" | "security";
  details?: string;
  success: boolean;
  errorMessage?: string;
  timestamp: number;
  processingTime: number;
  sessionId: string;
  userId: string;
}

// Generate mock data for demonstration
function generateMockData(count = 50): MockAuditLog[] {
  const actions = [
    "User Login",
    "User Logout",
    "Password Reset",
    "Profile Update",
    "Data Export",
    "File Upload",
    "Permission Change",
    "System Backup",
  ];

  const uris = [
    "/api/auth/login",
    "/api/auth/logout",
    "/api/users/profile",
    "/api/data/export",
    "/api/files/upload",
    "/api/admin/permissions",
    "/api/system/backup",
  ];

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];
  const categories: MockAuditLog["category"][] = [
    "auth",
    "data",
    "system",
    "security",
  ];

  const _severities: MockAuditLog["severity"][] = [
    "info",
    "warning",
    "error",
    "critical",
  ];

  return Array.from({ length: count }, (_, i) => {
    const success = Math.random() > 0.2; // 80% success rate
    const severity: MockAuditLog["severity"] = success
      ? Math.random() > 0.7
        ? "warning"
        : "info"
      : Math.random() > 0.5
        ? "error"
        : "critical";

    const timestamp =
      Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000);

    return {
      id: `audit_${i + 1}`,
      action:
        actions[Math.floor(Math.random() * actions.length)] ?? "Unknown Action",
      resource: Math.random() > 0.3 ? "products" : undefined,
      resourceId: Math.random() > 0.3 ? `res_${i + 1}` : undefined,
      uri: uris[Math.floor(Math.random() * uris.length)] ?? "/api/unknown",
      method: methods[Math.floor(Math.random() * methods.length)] ?? "GET",
      severity,
      category:
        categories[Math.floor(Math.random() * categories.length)] ?? "system",
      details: success ? undefined : "Authentication failed",
      success,
      errorMessage: success ? undefined : "Invalid credentials provided",
      timestamp,
      processingTime: Math.floor(Math.random() * 1000) + 50,
      sessionId: `sess_${Math.random().toString(36).substr(2, 9)}`,
      userId: `user_${Math.floor(Math.random() * 10) + 1}`,
    };
  });
}

export default function EntityListDemoPage() {
  const [mockData] = useState<MockAuditLog[]>(() => generateMockData(100));

  // PDF export functionality with preview
  const { openPreview, isGenerating, PreviewDialog } =
    usePDFExportWithPreview();

  // Get severity badge styling
  const getSeverityBadge = (severity: MockAuditLog["severity"]) => {
    const config = {
      info: { variant: "default" as const, icon: Info },
      warning: { variant: "secondary" as const, icon: AlertTriangle },
      error: { variant: "destructive" as const, icon: XCircle },
      critical: { variant: "destructive" as const, icon: AlertCircle },
    };
    const { variant, icon: IconComponent } = config[severity];

    return (
      <Badge variant={variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  // Table columns for EntityList
  const columns: ColumnDef<MockAuditLog>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm">{row.getValue("id")}</span>
          <CopyText value={row.getValue("id")}>
            {row.getValue("id")}
          </CopyText>
        </div>
      ),
    },
    {
      accessorKey: "timestamp",
      header: "Time",
      cell: ({ row }) => {
        const timestamp = row.getValue("timestamp");
        return (
          <div className="text-sm">
            <div>{format(new Date(timestamp as number), "MMM dd, yyyy")}</div>
            <div className="text-muted-foreground">
              {format(new Date(timestamp as number), "h:mm a")}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("action")}</div>
      ),
    },
    {
      accessorKey: "method",
      header: "Method",
      cell: ({ row }) => (
        <Badge variant="outline" className="font-mono">
          {row.getValue("method")}
        </Badge>
      ),
    },
    {
      accessorKey: "uri",
      header: "URI",
      cell: ({ row }) => (
        <code className="text-sm text-muted-foreground">
          {row.getValue("uri")}
        </code>
      ),
    },
    {
      accessorKey: "severity",
      header: "Severity",
      cell: ({ row }) => getSeverityBadge(row.getValue("severity")),
    },
    {
      accessorKey: "success",
      header: "Status",
      cell: ({ row }) => {
        const success = row.getValue("success");
        return success ? (
          <Badge variant="default" className="flex items-center gap-1">
            <CheckCircle className="h-3 w-3" />
            Success
          </Badge>
        ) : (
          <Badge variant="destructive" className="flex items-center gap-1">
            <XCircle className="h-3 w-3" />
            Failed
          </Badge>
        );
      },
    },
    {
      accessorKey: "processingTime",
      header: "Duration",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("processingTime")}ms
        </span>
      ),
    },
  ];

  // Convert table columns to PDF columns
  const convertToPDFColumns = (
    tableColumns: ColumnDef<MockAuditLog>[],
  ): PDFColumn[] => {
    return tableColumns
      .filter((col) => col.accessorKey)
      .map((col) => ({
        key: col.accessorKey as string,
        header:
          typeof col.header === "string"
            ? col.header
            : (col.accessorKey as string),
        getValue: (row: MockAuditLog) => {
          const key = col.accessorKey as keyof MockAuditLog;
          const value = row[key];

          // Handle specific formatting for PDF
          if (key === "timestamp") {
            return format(new Date(value as number), "MMM dd, yyyy h:mm a");
          }
          if (key === "success") {
            return value ? "Success" : "Failed";
          }
          if (key === "processingTime") {
            return `${value}ms`;
          }

          return String(value ?? "");
        },
      }));
  };

  // Custom attachment handler to demonstrate attachment workflow
  const handleAttachToRecord = async (pdfBlob: Blob, filename: string) => {
    // Simulate attachment to a record
    console.log("Attaching PDF to record:", filename, pdfBlob.size, "bytes");

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    toast.success(`PDF "${filename}" attached to record successfully!`);
  };

  // Demo of different export workflows
  const exportWorkflows = [
    {
      title: "Standard Export (Save to Computer)",
      description: "Opens preview with save button - typical EntityList usage",
      action: () => {
        const pdfColumns = convertToPDFColumns(columns);
        openPreview({
          title: "Demo Audit Logs",
          subtitle: "Standard export workflow demonstration",
          filename: `demo_standard_${new Date().toISOString().split("T")[0]}.pdf`,
          data: mockData,
          columns: pdfColumns,
          // Default: shows save button, no custom actions
        });
      },
    },
    {
      title: "Attachment Workflow (Custom Actions)",
      description:
        "Opens preview with custom attachment action - chargeback evidence usage",
      action: () => {
        const pdfColumns = convertToPDFColumns(columns);
        openPreview({
          title: "Demo Audit Logs",
          subtitle: "Attachment workflow demonstration",
          filename: `demo_attachment_${new Date().toISOString().split("T")[0]}.pdf`,
          data: mockData,
          columns: pdfColumns,
          customActions: [
            {
              label: "Attach to Record",
              variant: "primary",
              icon: <Download className="h-4 w-4" />,
              onClick: handleAttachToRecord,
              disabled: false,
            },
          ],
          showSaveButton: true, // Still allow saving alongside attachment
        });
      },
    },
    {
      title: "Attachment Only (No Save)",
      description:
        "Preview with attachment action only - attachment-only scenarios",
      action: () => {
        const pdfColumns = convertToPDFColumns(columns);
        openPreview({
          title: "Demo Audit Logs",
          subtitle: "Attachment-only workflow demonstration",
          filename: `demo_attach_only_${new Date().toISOString().split("T")[0]}.pdf`,
          data: mockData,
          columns: pdfColumns,
          customActions: [
            {
              label: "Attach as Evidence",
              variant: "primary",
              icon: <Download className="h-4 w-4" />,
              onClick: handleAttachToRecord,
              disabled: false,
            },
          ],
          showSaveButton: false, // Hide save button - attachment only
        });
      },
    },
  ];

  // Define filter configurations
  const _filters: FilterConfig<MockAuditLog>[] = [
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
        { label: "Success", value: "true" },
        { label: "Failed", value: "false" },
      ],
    },
    {
      id: "category",
      label: "Category",
      type: "select",
      field: "category",
      options: [
        { label: "Authentication", value: "auth" },
        { label: "Data", value: "data" },
        { label: "System", value: "system" },
        { label: "Security", value: "security" },
      ],
    },
  ];

  // Entity actions for audit log entries
  const _actions: EntityAction<MockAuditLog>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <FileText className="h-4 w-4" />,
      onClick: (log) => {
        toast.success(`Viewing details for ${log.action}`);
      },
      variant: "outline",
    },
    {
      id: "retry",
      label: "Retry Action",
      icon: <RefreshCw className="h-4 w-4" />,
      onClick: (log) => {
        toast.success(`Retrying ${log.action}`);
      },
      variant: "outline",
    },
  ];

  // Table actions with PDF export
  const tableActions = exportWorkflows.map((workflow, index) => (
    <Button
      key={`export-${index}`}
      variant="outline"
      onClick={workflow.action}
      disabled={isGenerating || !mockData.length}
      className="flex items-center gap-2"
      title={workflow.description}
    >
      <Download className="h-4 w-4" />
      {workflow.title}
    </Button>
  ));

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">EntityList PDF Export Demo</h1>
          <p className="text-muted-foreground">
            Demonstration of EntityList with PDF preview and export
            functionality
          </p>
        </div>
        <Badge variant="secondary" className="flex items-center gap-2">
          <Database className="h-4 w-4" />
          {mockData.length} Records
        </Badge>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-5 w-5" />
              PDF Preview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Preview the PDF exactly as it will be saved before downloading
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Download className="h-5 w-5" />
              Export Action
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              PDF export integrated as a table action in EntityList
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-5 w-5" />
              Real Data
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Mock audit log data demonstrating real-world usage patterns
            </p>
          </CardContent>
        </Card>
      </div>

      {/* EntityList with PDF Export */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Logs</CardTitle>
          <p className="text-sm text-muted-foreground">
            System audit logs with PDF export functionality. Click "Export PDF"
            to preview before saving.
          </p>
        </CardHeader>
        <CardContent>
          <EntityList<MockAuditLog>
            data={mockData}
            columns={columns}
            filters={_filters}
            isLoading={false}
            defaultViewMode="list"
            viewModes={["list"]}
            actions={tableActions}
            entityActions={_actions}
            enableSearch={true}
            emptyState={
              <div className="flex h-32 flex-col items-center justify-center">
                <Activity className="mb-2 h-8 w-8 text-muted-foreground" />
                <h3 className="text-lg font-medium">No Audit Logs Found</h3>
                <p className="text-muted-foreground">
                  No activity has been logged yet
                </p>
              </div>
            }
            initialSort={{
              id: "timestamp",
              direction: "desc",
            }}
          />
        </CardContent>
      </Card>

      {/* PDF Preview Dialog */}
      <PreviewDialog />
    </div>
  );
}
