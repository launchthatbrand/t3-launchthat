"use client";

import {
  AlertTriangle,
  CheckCircle,
  CreditCard,
  FileText,
  MessageCircle,
  Package,
  Plus,
  Shield,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

// Import AuditLogTable component
import { AuditLogTable } from "./AuditLogViewer";
import { Button } from "@acme/ui/button";
import type { Id } from "@convex-config/_generated/dataModel";
import { MultiPageDialog } from "@acme/ui/multi-page-dialog";
import type { MultiPageDialogStepProps } from "@acme/ui/multi-page-dialog";
import React from "react";

interface ChargebackEvidenceWizardProps {
  chargebackId: Id<"chargebacks">;
  customerUser?: {
    _id: Id<"users">;
    name?: string;
    email: string;
  } | null;
  onEvidenceAdded?: () => void;
  trigger?: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

// Step 1: Choose Evidence Type
function EvidenceTypeStep({
  data,
  updateData,
  addStep,
  removeStep,
  goNext, // Back to using goNext which now includes validation
  totalSteps,
}: MultiPageDialogStepProps) {
  // No longer need the complex useEffect navigation logic
  // Navigation now happens directly in handleTypeSelection

  const evidenceTypes = [
    {
      type: "audit_log",
      title: "User Audit Log",
      description: "Generate user activity and system audit logs",
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      type: "communication",
      title: "Customer Communication",
      description: "Emails, chat logs, and customer interactions",
      icon: <MessageCircle className="h-8 w-8 text-green-600" />,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      type: "transaction",
      title: "Transaction Records",
      description: "Payment and transaction history",
      icon: <CreditCard className="h-8 w-8 text-purple-600" />,
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
    },
    {
      type: "documentation",
      title: "Supporting Documents",
      description: "Contracts, agreements, and legal documents",
      icon: <FileText className="h-8 w-8 text-orange-600" />,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
    {
      type: "product",
      title: "Product Information",
      description: "Product details and specifications",
      icon: <Package className="h-8 w-8 text-cyan-600" />,
      bgColor: "bg-cyan-50",
      borderColor: "border-cyan-200",
    },
  ];

  const selectedType = (data as { evidenceType?: string }).evidenceType;

  const handleTypeSelection = (type: string) => {
    console.log("=== SELECTION DEBUG START ===");
    console.log("Selected evidence type:", type);
    console.log("Current totalSteps before:", totalSteps);

    // Store the selected type temporarily for validation
    (window as any).__selectedEvidenceType = type;

    // Clear existing dynamic steps first
    if (removeStep) {
      console.log("Removing existing dynamic steps...");
      // Remove any existing dynamic steps
      removeStep("audit-logs");
      removeStep("pdf-generation");
      removeStep("file-upload");
      removeStep("url-input");
      removeStep("text-input");
    }

    // Add dynamic steps based on the selected evidence type
    if (addStep) {
      console.log("Adding dynamic steps for type:", type);
      if (type === "audit_log") {
        console.log("Adding audit log steps...");
        // For audit logs, add a step to show the audit log table
        addStep({
          id: "audit-logs",
          title: "Audit Logs",
          description: "View and select audit logs",
          component: AuditLogStep,
          validation: () => true,
        });
        console.log("✅ Added audit-logs step");
        addStep({
          id: "pdf-generation",
          title: "Generate PDF",
          description: "Generate evidence PDF",
          component: PDFGenerationStep,
          validation: () => true,
        });
        console.log("✅ Added pdf-generation step");
        console.log("📊 Steps should now total:", 3 + 2, "steps");
      } else if (type === "communication") {
        console.log("Adding communication steps...");
        addStep({
          id: "text-input",
          title: "Communication Text",
          description: "Enter communication details",
          component: TextInputStep,
          validation: () => true,
        });
        addStep({
          id: "file-upload",
          title: "Upload Files",
          description: "Upload communication files",
          component: FileUploadStep,
          validation: () => true,
        });
      } else if (type === "transaction") {
        console.log("Adding transaction steps...");
        addStep({
          id: "url-input",
          title: "Transaction URL",
          description: "Provide a link to the transaction details",
          component: UrlInputStep,
          validation: () => true,
        });
      } else if (type === "documentation") {
        console.log("Adding documentation steps...");
        addStep({
          id: "file-upload",
          title: "Upload Documentation",
          description: "Upload supporting documents",
          component: FileUploadStep,
          validation: () => true,
        });
      } else if (type === "product") {
        console.log("Adding product steps...");
        addStep({
          id: "text-input",
          title: "Product Details",
          description: "Enter product details",
          component: TextInputStep,
          validation: () => true,
        });
        addStep({
          id: "file-upload",
          title: "Product Files",
          description: "Upload product-related files",
          component: FileUploadStep,
          validation: () => true,
        });
      }

      console.log("Dynamic steps added, attempting navigation...");

      // Update data and navigate immediately
      updateData({ evidenceType: type });
      console.log("Updated data with evidenceType:", type);

      // Navigate immediately - validation will use temp variable if needed
      console.log("🚀 About to call goNext() immediately");
      console.log("🚀 Current totalSteps before goNext:", totalSteps);

      // Add a small delay to ensure the addStep operations have completed
      setTimeout(() => {
        console.log("🚀 Attempting navigation after addStep completion");
        void goNext();

        // Clear temp variable after navigation
        setTimeout(() => {
          console.log("🚀 Navigation completed, clearing temp variable");
          console.log("🚀 totalSteps after navigation:", totalSteps);
          delete (window as any).__selectedEvidenceType;
        }, 50);
      }, 50);
    }

    console.log("=== SELECTION DEBUG END ===");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Choose Evidence Type</h3>
        <p className="text-muted-foreground">
          Select the type of evidence you want to add to this chargeback case.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {evidenceTypes.map((evidenceType) => (
          <Card
            key={evidenceType.type}
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedType === evidenceType.type
                ? "ring-2 ring-primary"
                : "hover:border-primary/50"
            }`}
            onClick={() => handleTypeSelection(evidenceType.type)}
          >
            <CardHeader className="text-center">
              <div
                className={`mx-auto mb-4 rounded-lg p-4 ${evidenceType.bgColor} ${evidenceType.borderColor} border`}
              >
                {evidenceType.icon}
              </div>
              <CardTitle className="text-base">{evidenceType.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {evidenceType.description}
              </p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-800">
              Evidence type selected:{" "}
              {evidenceTypes.find((t) => t.type === selectedType)?.title}
            </span>
          </div>
          <p className="mt-1 text-sm text-green-700">
            Click "Next" to continue with the configuration steps.
          </p>
        </div>
      )}
    </div>
  );
}

// Step 2: Audit Log Step (shows the audit log table)
function AuditLogStep({ data, updateData }: MultiPageDialogStepProps) {
  const wizardData = data as {
    chargebackId?: Id<"chargebacks">;
    customerUser?: {
      _id: Id<"users">;
      name?: string;
      email: string;
    } | null;
  };

  const handlePDFGenerated = (blob: Blob, filename: string) => {
    updateData({
      pdfBlob: blob,
      pdfFilename: filename,
      auditLogProcessed: true,
    });
  };

  if (!wizardData.customerUser) {
    return (
      <div className="text-center">
        <p className="text-muted-foreground">
          No customer user data available for audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">User Audit Logs</h3>
        <p className="text-muted-foreground">
          Review and generate audit logs for evidence submission.
        </p>
      </div>

      <AuditLogTable
        userId={wizardData.customerUser._id}
        userName={wizardData.customerUser.name}
        userEmail={wizardData.customerUser.email}
        onPDFGenerated={handlePDFGenerated}
        exportButtonText="Generate Evidence PDF"
        showSummaryCards={false}
        className="border-0"
      />
    </div>
  );
}

// Step 3: PDF Generation Step
function PDFGenerationStep({ data }: MultiPageDialogStepProps) {
  const wizardData = data as {
    pdfBlob?: Blob;
    pdfFilename?: string;
    auditLogProcessed?: boolean;
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Evidence Ready</h3>
        <p className="text-muted-foreground">
          Your audit log evidence has been generated and is ready for
          submission.
        </p>
      </div>

      {wizardData.pdfBlob && wizardData.pdfFilename ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6 text-center">
          <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-600" />
          <h4 className="text-lg font-semibold text-green-800">
            PDF Generated Successfully
          </h4>
          <p className="mt-2 text-sm text-green-700">
            File: {wizardData.pdfFilename}
          </p>
          <p className="mt-1 text-sm text-green-700">
            Size: {(wizardData.pdfBlob.size / 1024).toFixed(1)} KB
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-6 text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-orange-600" />
          <h4 className="text-lg font-semibold text-orange-800">
            No PDF Generated
          </h4>
          <p className="mt-2 text-sm text-orange-700">
            Please go back to the previous step and generate the audit log PDF.
          </p>
        </div>
      )}
    </div>
  );
}

// File Upload Step
function FileUploadStep({
  data: _data,
  updateData: _updateData,
}: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Upload Supporting Files</h3>
        <p className="text-muted-foreground">
          Upload any supporting documents, images, or files for this evidence.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>File Upload</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg border-2 border-dashed border-muted-foreground/25 p-8 text-center">
            <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag and drop files here, or click to browse
            </p>
            <Button variant="outline" className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 4: URL Input Step
function UrlInputStep({ data, updateData }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Add External URLs</h3>
        <p className="text-muted-foreground">
          Provide links to external evidence or documentation.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>External Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="url" className="text-sm font-medium">
              Evidence URL
            </label>
            <input
              id="url"
              type="url"
              placeholder="https://example.com/document.pdf"
              value={(data.url as string) || ""}
              onChange={(e) => updateData({ url: e.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 5: Text Input Step
function TextInputStep({ data, updateData }: MultiPageDialogStepProps) {
  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Add Text Content</h3>
        <p className="text-muted-foreground">
          Enter relevant text content or notes for this evidence.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Evidence Content</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="textContent" className="text-sm font-medium">
              Content
            </label>
            <textarea
              id="textContent"
              placeholder="Enter evidence content or notes..."
              value={(data.textContent as string) || ""}
              onChange={(e) => updateData({ textContent: e.target.value })}
              className="mt-1 w-full rounded-md border px-3 py-2"
              rows={6}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Step 2: Empty placeholder for other evidence types
function ConfigurationStep({ data }: MultiPageDialogStepProps) {
  const selectedType = (data as { evidenceType?: string }).evidenceType;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Step 2 - Configuration</h3>
        <p className="text-muted-foreground">
          Configure your {selectedType ?? "selected"} evidence
        </p>
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <FileText className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Step 2 Coming Soon</h3>
          <p className="text-muted-foreground">
            Configuration options for {selectedType ?? "your"} evidence will be
            here
          </p>
        </div>
      </div>
    </div>
  );
}

// Step 3: Empty placeholder for review
function ReviewStep({ data }: MultiPageDialogStepProps) {
  const selectedType = (data as { evidenceType?: string }).evidenceType;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Step 3 - Review</h3>
        <p className="text-muted-foreground">
          Review and submit your {selectedType ?? "selected"} evidence
        </p>
      </div>

      <div className="flex h-64 items-center justify-center rounded-lg border border-dashed">
        <div className="text-center">
          <Shield className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
          <h3 className="text-lg font-medium">Step 3 Coming Soon</h3>
          <p className="text-muted-foreground">
            Review and submission for {selectedType ?? "your"} evidence will be
            here
          </p>
        </div>
      </div>
    </div>
  );
}

export function ChargebackEvidenceWizard({
  chargebackId,
  customerUser,
  onEvidenceAdded,
  trigger,
  open,
  onOpenChange,
}: ChargebackEvidenceWizardProps) {
  const defaultTrigger = (
    <Button>
      <Plus className="mr-2 h-4 w-4" />
      Add Evidence
    </Button>
  );

  const config = {
    title: "Add Evidence to Chargeback",
    description: "Add supporting evidence to strengthen your chargeback case",
    showStepIndicator: true,
    showProgress: true,
    size: "lg" as const,
    disableOutsideClick: true,
    dynamicSteps: true, // Enable dynamic steps
    // Remove persistenceKey to avoid conflicts with dynamic steps
    initialData: {
      chargebackId,
      customerUser,
    },
    steps: [
      {
        id: "type",
        title: "Evidence Type",
        description: "Choose evidence type",
        component: EvidenceTypeStep,
        validation: (data: Record<string, unknown>) => {
          const evidenceType = (data as { evidenceType?: string }).evidenceType;
          const tempEvidenceType = (window as any).__selectedEvidenceType;

          const isValid = Boolean(evidenceType || tempEvidenceType);
          console.log("🔍 VALIDATION DEBUG: Step 1 validation check");
          console.log("🔍 Data received by validation:", data);
          console.log("🔍 evidenceType value:", evidenceType);
          console.log("🔍 tempEvidenceType value:", tempEvidenceType);
          console.log("🔍 Validation result:", isValid);

          // Clear the temp value after using it
          if (tempEvidenceType && !evidenceType) {
            // If we have a temp value but not in data, update the data for future steps
            setTimeout(() => {
              (window as any).__selectedEvidenceType = undefined;
            }, 0);
          }

          return isValid;
        },
      },
      {
        id: "configuration",
        title: "Configuration",
        description: "Configure evidence",
        component: ConfigurationStep,
      },
      {
        id: "review",
        title: "Review",
        description: "Review and submit",
        component: ReviewStep,
      },
    ],
    onComplete: (data: Record<string, unknown>) => {
      console.log("Evidence wizard completed:", data);
      if (onEvidenceAdded) {
        onEvidenceAdded();
      }
    },
  };

  return (
    <MultiPageDialog
      config={config}
      trigger={trigger ?? defaultTrigger}
      open={open}
      onOpenChange={onOpenChange}
    />
  );
}
