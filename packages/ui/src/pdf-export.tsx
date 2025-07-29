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
    position: "absolute",
    bottom: 30,
    left: 30,
    right: 30,
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
  data: any[];
  columns: PDFColumn[];
  pageOrientation?: "portrait" | "landscape";
  enablePageBreaks?: boolean;
  headerOnEveryPage?: boolean;
  includeMetadata?: boolean;
  customMetadata?: Record<string, string>;
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
interface PDFPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  config: PDFExportConfig;
  onSave?: () => void;
}

export function PDFPreviewDialog({
  isOpen,
  onClose,
  config,
  onSave,
}: PDFPreviewDialogProps) {
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!onSave) return;

    setIsSaving(true);
    try {
      await onSave();
      onClose();
    } catch (error) {
      console.error("Error saving PDF:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-[90vh] max-w-[90vw] flex-col p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>PDF Preview - {config.title}</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-hidden bg-red-500 p-6 pt-2">
          <div className="h-full w-full rounded-lg border bg-gray-50">
            <PDFViewer width="100%" height="100%" className="rounded-lg">
              <PDFDocument {...config} />
            </PDFViewer>
          </div>
        </div>

        <DialogFooter className="p-6 pt-0">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Close
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? "Saving..." : "Save PDF"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Hook for PDF export functionality
export function usePDFExport() {
  const [isGenerating, setIsGenerating] = useState(false);

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

      return { success: true };
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
  const { exportToPDF, isGenerating } = usePDFExport();

  const openPreview = React.useCallback((config: PDFExportConfig) => {
    setPreviewConfig(config);
    setIsPreviewOpen(true);
  }, []);

  const closePreview = React.useCallback(() => {
    setIsPreviewOpen(false);
    setPreviewConfig(null);
  }, []);

  const handleSave = React.useCallback(async () => {
    if (!previewConfig) return;

    const result = await exportToPDF(previewConfig);
    if (result.success) {
      closePreview();
    }
    return result;
  }, [previewConfig, exportToPDF, closePreview]);

  const PreviewDialog = React.useCallback(() => {
    if (!previewConfig) return null;

    return (
      <PDFPreviewDialog
        isOpen={isPreviewOpen}
        onClose={closePreview}
        config={previewConfig}
        onSave={handleSave}
      />
    );
  }, [isPreviewOpen, closePreview, previewConfig, handleSave]);

  return {
    openPreview,
    closePreview,
    isGenerating,
    PreviewDialog,
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
