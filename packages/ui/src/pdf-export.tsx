"use client";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import {
  Document,
  PDFViewer,
  Page,
  StyleSheet,
  Text,
  View,
  pdf,
} from "@react-pdf/renderer";
import { Download, FileText } from "lucide-react";
import React, { useState } from "react";

import { Button } from "./button";

// PDF Styles
const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 30,
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 20,
    borderBottom: 1,
    borderColor: "#e5e7eb",
    paddingBottom: 10,
    // Fixed header that appears on all pages
    // position: "absolute",
    // top: 30,
    // left: 30,
    // right: 30,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 5,
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 10,
  },
  metadata: {
    fontSize: 10,
    color: "#9ca3af",
    marginBottom: 5,
  },
  content: {
    // marginTop: 120, // Space for fixed header
    flex: 1,
  },
  tableContainer: {
    // Remove fixed positioning to allow proper flow
  },
  tableHeaderRow: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    borderBottom: 1,
    borderColor: "#e5e7eb",
    padding: 8,
    fontWeight: "bold",
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: 1,
    borderColor: "#f3f4f6",
    padding: 8,
    minHeight: 40,
    // CRITICAL: Prevent row breaking across pages
    wrap: false,
    orphans: 1,
    widows: 1,
    minPresenceAhead: 25,
  },
  tableCol: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  tableHeader: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  tableCell: {
    fontSize: 9,
    color: "#4b5563",
    lineHeight: 1.2,
  },
  footer: {
    // position: "absolute",
    // bottom: 30,
    // left: 30,
    // right: 30,
    textAlign: "center",
    fontSize: 8,
    color: "#9ca3af",
    borderTop: 1,
    borderColor: "#e5e7eb",
    paddingTop: 10,
  },
  pageNumber: {
    fontSize: 8,
    color: "#9ca3af",
  },
});

// Types
export interface PDFColumn {
  key: string;
  header: string;
  width?: string;
  getValue?: (row: any) => string;
}

export interface PDFExportConfig {
  title: string;
  subtitle?: string;
  filename: string;
  data: Record<string, unknown>[];
  columns: PDFColumn[];
  pageOrientation?: "portrait" | "landscape";
  enablePageBreaks?: boolean;
  headerOnEveryPage?: boolean;
  includeMetadata?: boolean;
  customMetadata?: Record<string, string>;
  // New: Custom actions for the preview dialog
  customActions?: {
    label: string;
    variant?:
      | "primary"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    icon?: React.ReactNode;
    onClick: (pdfBlob: Blob, filename: string) => Promise<void> | void;
    disabled?: boolean;
  }[];
  // New: Control whether to show the default "Save to Computer" button
  showSaveButton?: boolean;
}

// Helper function to extract cell value
const getCellValue = (
  row: Record<string, unknown>,
  column: PDFColumn,
): string => {
  if (column.getValue) {
    return column.getValue(row) ?? "";
  }
  const value = row[column.key];
  if (value == null) return "";

  // Handle different data types better
  if (typeof value === "object") {
    // Safe object stringification
    try {
      return JSON.stringify(value);
    } catch {
      return "[Complex Object]";
    }
  }

  return String(value);
};

// Table Header Component - can be reused across pages
function TableHeader({ columns }: { columns: PDFColumn[] }) {
  return (
    <View style={styles.tableHeaderRow}>
      {columns.map((column, index) => (
        <View
          key={index}
          style={[styles.tableCol, column.width ? { width: column.width } : {}]}
        >
          <Text style={styles.tableHeader}>{column.header}</Text>
        </View>
      ))}
    </View>
  );
}

// Table Row Component with proper breaking
function TableRow({
  row,
  columns,
  rowIndex: _rowIndex,
}: {
  row: Record<string, unknown>;
  columns: PDFColumn[];
  rowIndex: number;
}) {
  return (
    <View style={styles.tableRow}>
      {columns.map((column, colIndex) => (
        <View
          key={colIndex}
          style={[styles.tableCol, column.width ? { width: column.width } : {}]}
        >
          <Text style={styles.tableCell}>{getCellValue(row, column)}</Text>
        </View>
      ))}
    </View>
  );
}

// Group rows to prevent orphaned single rows
function TableRowGroup({
  rows,
  columns,
  startIndex,
}: {
  rows: Record<string, unknown>[];
  columns: PDFColumn[];
  startIndex: number;
}) {
  return (
    <View wrap={true}>
      {rows.map((row, index) => (
        <TableRow
          key={startIndex + index}
          row={row}
          columns={columns}
          rowIndex={startIndex + index}
        />
      ))}
    </View>
  );
}

// Main PDF Document Component
export function PDFDocument({
  title,
  subtitle,
  data,
  columns,
  pageOrientation = "portrait",
  includeMetadata = true,
  customMetadata,
}: PDFExportConfig) {
  const currentDate = new Date().toLocaleDateString();
  const totalRecords = data.length;

  // Group rows into small sections for better page break control
  const rowGroups: Record<string, unknown>[][] = [];
  const groupSize = 5; // Small groups for better page control

  for (let i = 0; i < data.length; i += groupSize) {
    rowGroups.push(data.slice(i, i + groupSize));
  }

  return (
    <Document>
      <Page size="A4" orientation={pageOrientation} style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

          {includeMetadata && (
            <View>
              <Text style={styles.metadata}>
                Generated on: {currentDate} • Total Records: {totalRecords}
              </Text>
              {customMetadata &&
                Object.entries(customMetadata).map(([key, value]) => (
                  <Text key={key} style={styles.metadata}>
                    {key}: {value}
                  </Text>
                ))}
            </View>
          )}
        </View>

        {/* Table Content */}
        <View style={styles.content}>
          <View style={styles.tableContainer}>
            {/* Table Header */}
            <TableHeader columns={columns} />

            {/* Table Rows in Groups */}
            {rowGroups.map((group, groupIndex) => (
              <TableRowGroup
                key={groupIndex}
                rows={group}
                columns={columns}
                startIndex={groupIndex * groupSize}
              />
            ))}
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer} fixed>
          <Text
            style={styles.pageNumber}
            render={({ pageNumber, totalPages }) =>
              `Page ${pageNumber} of ${totalPages}`
            }
          />
        </View>
      </Page>
    </Document>
  );
}

// PDF Preview Dialog Component
function PDFPreviewDialog({
  isOpen,
  onClose,
  config,
  pdfBlob,
  isGenerating,
}: {
  isOpen: boolean;
  onClose: () => void;
  config: PDFExportConfig | null;
  pdfBlob: Blob | null;
  isGenerating: boolean;
}) {
  const [isActionLoading, setIsActionLoading] = useState<string | null>(null);

  const handleSave = () => {
    if (!pdfBlob || !config) return;

    setIsActionLoading("save");
    try {
      // Create download link
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = config.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } finally {
      setIsActionLoading(null);
    }
  };

  const handleCustomAction = async (
    action: NonNullable<PDFExportConfig["customActions"]>[0],
  ) => {
    if (!pdfBlob || !config || action.disabled) return;

    setIsActionLoading(action.label);
    try {
      await action.onClick(pdfBlob, config.filename);
    } catch (error) {
      console.error("Custom action error:", error);
    } finally {
      setIsActionLoading(null);
    }
  };

  if (!config) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-full max-h-[90vh] max-w-6xl flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            PDF Preview - {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="min-h-0 flex-1">
          {isGenerating ? (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Generating PDF preview...
                </p>
              </div>
            </div>
          ) : pdfBlob ? (
            <div className="h-full w-full overflow-hidden rounded-md border">
              <PDFViewer width="100%" height="100%" className="border-0">
                <PDFDocument {...config} />
              </PDFViewer>
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Failed to generate PDF preview
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {/* Custom Actions */}
          {config.customActions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant ?? "outline"}
              onClick={() => handleCustomAction(action)}
              disabled={
                action.disabled || isActionLoading === action.label || !pdfBlob
              }
            >
              {isActionLoading === action.label ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              ) : (
                action.icon && <span className="mr-2">{action.icon}</span>
              )}
              {action.label}
            </Button>
          ))}

          {/* Default Save Button - show by default unless explicitly disabled */}
          {(config.showSaveButton ?? true) && (
            <Button
              onClick={handleSave}
              disabled={isActionLoading === "save" || !pdfBlob}
            >
              {isActionLoading === "save" ? (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-gray-900" />
              ) : (
                <Download className="mr-2 h-4 w-4" />
              )}
              Save to Computer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for PDF export functionality
export function usePDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);

  // Generate PDF blob without downloading
  const generatePDFBlob = React.useCallback(async (config: PDFExportConfig) => {
    setIsGenerating(true);

    try {
      const doc = <PDFDocument {...config} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      return { success: true, blob };
    } catch (error) {
      console.error("PDF generation error:", error);
      return { success: false, error: error as Error };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  // Export PDF with download
  const exportToPDF = React.useCallback(async (config: PDFExportConfig) => {
    setIsGenerating(true);

    try {
      const doc = <PDFDocument {...config} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = config.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      return { success: true, blob };
    } catch (error) {
      console.error("PDF generation error:", error);
      return { success: false, error: error as Error };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const previewPDF = React.useCallback(async (config: PDFExportConfig) => {
    setIsGenerating(true);

    try {
      const doc = <PDFDocument {...config} />;
      const asPdf = pdf(doc);
      const blob = await asPdf.toBlob();

      // Open in new tab
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up URL after a delay
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return { success: true };
    } catch (error) {
      console.error("PDF preview error:", error);
      return { success: false, error: error as Error };
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return {
    generatePDFBlob, // New: generate without download
    exportToPDF,
    previewPDF,
    isGenerating,
  };
}

// Hook for PDF export with preview dialog
export function usePDFExportWithPreview() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewConfig, setPreviewConfig] = useState<PDFExportConfig | null>(
    null,
  );
  const [pdfBlob, setPdfBlob] = useState<Blob | null>(null);
  const { generatePDFBlob, exportToPDF, isGenerating } = usePDFExport();

  const openPreview = React.useCallback(
    (config: PDFExportConfig) => {
      setPreviewConfig(config);
      setIsPreviewOpen(true);
      setPdfBlob(null); // Reset blob

      // Generate PDF blob for preview (without download)
      void (async () => {
        try {
          const result = await generatePDFBlob(config);
          if (result.success && result.blob) {
            setPdfBlob(result.blob);
          }
        } catch (error) {
          console.error("Failed to generate PDF preview:", error);
        }
      })();
    },
    [generatePDFBlob],
  );

  const closePreview = React.useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewConfig(null);
    setPdfBlob(null);
  }, []);

  const PreviewDialog = React.useCallback(() => {
    if (!previewConfig) return null;

    return (
      <PDFPreviewDialog
        isOpen={isPreviewOpen}
        onClose={closePreview}
        config={previewConfig}
        pdfBlob={pdfBlob}
        isGenerating={isGenerating}
      />
    );
  }, [isPreviewOpen, closePreview, previewConfig, pdfBlob, isGenerating]);

  return {
    openPreview,
    closePreview,
    isGenerating,
    PreviewDialog,
    exportToPDF, // Add this for direct PDF generation
  };
}

// Export button component
interface PDFExportButtonProps {
  config: PDFExportConfig;
  variant?: "download" | "preview";
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PDFExportButton({
  config,
  variant = "download",
  children,
  className,
  disabled,
  onSuccess,
  onError,
}: PDFExportButtonProps) {
  const { exportToPDF, previewPDF, isGenerating } = usePDFExport();

  const handleClick = async () => {
    const result =
      variant === "download"
        ? await exportToPDF(config)
        : await previewPDF(config);

    if (result.success) {
      onSuccess?.();
    } else if (result.error) {
      onError?.(result.error);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isGenerating}
      className={className}
    >
      {isGenerating
        ? "Generating..."
        : children || `${variant === "download" ? "Download" : "Preview"} PDF`}
    </button>
  );
}

// Enhanced Export button with preview dialog
interface PDFExportWithPreviewButtonProps {
  config: PDFExportConfig;
  children?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export function PDFExportWithPreviewButton({
  config,
  children,
  className,
  disabled,
  onSuccess,
  onError,
}: PDFExportWithPreviewButtonProps) {
  const { openPreview, isGenerating, PreviewDialog } =
    usePDFExportWithPreview();

  const handleClick = () => {
    try {
      openPreview(config);
      onSuccess?.();
    } catch (error) {
      onError?.(error as Error);
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || isGenerating}
        className={className}
      >
        {isGenerating ? "Generating..." : children || "Export PDF"}
      </button>
      <PreviewDialog />
    </>
  );
}

// Helper function to convert EntityList columns to PDF columns
export function convertToPDFColumns(entityListColumns: any[]): PDFColumn[] {
  return entityListColumns
    .filter((col) => col.accessorKey) // Only include columns with accessor keys
    .map((col) => ({
      key: col.accessorKey,
      header:
        typeof col.header === "string" ? col.header : col.id || col.accessorKey,
      getValue: col.cell
        ? undefined
        : (row: any) => row[col.accessorKey]?.toString() || "",
    }));
}
