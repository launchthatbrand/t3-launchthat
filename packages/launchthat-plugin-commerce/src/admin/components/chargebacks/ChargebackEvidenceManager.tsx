"use client";

import React, { useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  Plus,
  Send,
  Star,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import type {
  Doc,
  Id,
} from "../../../../../../apps/portal/convex/_generated/dataModel";
import { ChargebackEvidenceWizard } from "./ChargebackEvidenceWizard";

type ChargebackEvidence = Doc<"chargebackEvidence">;

// Type definitions for configuration objects
type DocumentTypeConfig = {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
};

type StatusConfig = {
  variant: "secondary" | "outline" | "destructive" | "default";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

type ImportanceConfig = {
  variant: "destructive" | "outline" | "secondary" | "default";
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

interface ChargebackEvidenceManagerProps {
  chargebackId: Id<"chargebacks">;
  customerUser?: {
    _id: Id<"users">;
    name?: string;
    email: string;
  } | null;
}

export function ChargebackEvidenceManager({
  chargebackId,
  customerUser,
}: ChargebackEvidenceManagerProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<
    Id<"chargebackEvidence">[]
  >([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isEvidenceWizardOpen, setIsEvidenceWizardOpen] = useState(false);

  // Queries with proper error handling
  const evidence = useQuery(
    api.ecommerce.chargebacks.evidence.getChargebackEvidence,
    { chargebackId },
  );

  const evidenceSummary = useQuery(
    api.ecommerce.chargebacks.evidence.getEvidenceSummary,
    { chargebackId },
  );

  // Mutations
  const deleteEvidence = useMutation(
    api.ecommerce.chargebacks.evidence.deleteEvidence,
  );

  // Document type configurations
  const documentTypes: Record<string, DocumentTypeConfig> = {
    receipt: {
      label: "Receipt/Invoice",
      icon: FileText,
      color: "bg-blue-100 text-blue-800",
    },
    shipping_proof: {
      label: "Shipping Proof",
      icon: CheckCircle,
      color: "bg-green-100 text-green-800",
    },
    customer_communication: {
      label: "Customer Communication",
      icon: ExternalLink,
      color: "bg-purple-100 text-purple-800",
    },
    refund_policy: {
      label: "Refund Policy",
      icon: FileText,
      color: "bg-orange-100 text-orange-800",
    },
    terms_of_service: {
      label: "Terms of Service",
      icon: FileText,
      color: "bg-gray-100 text-gray-800",
    },
    product_description: {
      label: "Product Description",
      icon: FileText,
      color: "bg-cyan-100 text-cyan-800",
    },
    customer_signature: {
      label: "Customer Signature",
      icon: Edit,
      color: "bg-pink-100 text-pink-800",
    },
    billing_statement: {
      label: "Billing Statement",
      icon: FileText,
      color: "bg-yellow-100 text-yellow-800",
    },
    transaction_history: {
      label: "Transaction History",
      icon: Clock,
      color: "bg-indigo-100 text-indigo-800",
    },
    dispute_response: {
      label: "Dispute Response",
      icon: AlertTriangle,
      color: "bg-red-100 text-red-800",
    },
    audit_log: {
      label: "Audit Log",
      icon: FileText,
      color: "bg-blue-100 text-blue-800",
    },
    other: {
      label: "Other Document",
      icon: FileText,
      color: "bg-gray-100 text-gray-800",
    },
  } as const;

  // Status configurations
  const statusConfig: Record<string, StatusConfig> = {
    draft: { variant: "secondary" as const, label: "Draft", icon: Edit },
    ready: { variant: "outline" as const, label: "Ready", icon: CheckCircle },
    submitted: { variant: "outline" as const, label: "Submitted", icon: Send },
    accepted: {
      variant: "outline" as const,
      label: "Accepted",
      icon: CheckCircle,
    },
    rejected: {
      variant: "destructive" as const,
      label: "Rejected",
      icon: AlertTriangle,
    },
  };

  // Importance configurations
  const importanceConfig: Record<string, ImportanceConfig> = {
    critical: {
      variant: "destructive" as const,
      label: "Critical",
      icon: AlertTriangle,
    },
    high: { variant: "outline" as const, label: "High", icon: Star },
    medium: { variant: "outline" as const, label: "Medium", icon: Clock },
    low: { variant: "secondary" as const, label: "Low", icon: CheckCircle },
  };

  const handleDeleteEvidence = async (evidenceId: Id<"chargebackEvidence">) => {
    try {
      await deleteEvidence({ id: evidenceId });
      toast.success("Evidence deleted successfully");
    } catch (error) {
      toast.error("Failed to delete evidence");
      console.error(error);
    }
  };

  const getFileDownloadUrl = (evidence: ChargebackEvidence) => {
    if (evidence.fileStorageId) {
      // TODO: Implement file download URL generation
      return `/api/files/${evidence.fileStorageId}`;
    }
    return null;
  };

  const handleEvidenceAdded = () => {
    // Close the wizard dialog and refresh evidence list
    setIsEvidenceWizardOpen(false);
    window.location.reload(); // TODO: Implement proper refresh without page reload
  };

  if (!evidence || !evidenceSummary) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="text-muted-foreground mt-2 text-sm">
              Loading evidence...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Evidence Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Evidence Files
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                Manage evidence and supporting documents for this chargeback
              </p>
            </div>

            <Button onClick={() => setIsEvidenceWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Evidence
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {evidenceSummary.totalCount}
              </div>
              <div className="text-muted-foreground text-sm">
                Total Documents
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {evidenceSummary.draftCount}
              </div>
              <div className="text-muted-foreground text-sm">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {evidenceSummary.readyCount}
              </div>
              <div className="text-muted-foreground text-sm">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {evidenceSummary.submittedCount}
              </div>
              <div className="text-muted-foreground text-sm">Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {evidenceSummary.criticalCount}
              </div>
              <div className="text-muted-foreground text-sm">Critical</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Evidence List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Evidence Documents</h3>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "outline" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "outline" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                List
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {evidence.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
              <FileText className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-medium">No Evidence Documents</h3>
              <p className="text-muted-foreground">
                Start building your case by adding evidence documents
              </p>
              <div className="mt-4">
                <Button onClick={() => setIsEvidenceWizardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Evidence
                </Button>
              </div>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {evidence.map((item) => (
                <EvidenceCard
                  key={item._id}
                  evidence={item}
                  documentTypes={documentTypes}
                  statusConfig={statusConfig}
                  importanceConfig={importanceConfig}
                  isSelected={selectedEvidence.includes(item._id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedEvidence([...selectedEvidence, item._id]);
                    } else {
                      setSelectedEvidence(
                        selectedEvidence.filter((id) => id !== item._id),
                      );
                    }
                  }}
                  onDelete={() => handleDeleteEvidence(item._id)}
                  downloadUrl={getFileDownloadUrl(item)}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {evidence.map((item) => (
                <EvidenceListItem
                  key={item._id}
                  evidence={item}
                  documentTypes={documentTypes}
                  statusConfig={statusConfig}
                  importanceConfig={importanceConfig}
                  isSelected={selectedEvidence.includes(item._id)}
                  onSelect={(selected) => {
                    if (selected) {
                      setSelectedEvidence([...selectedEvidence, item._id]);
                    } else {
                      setSelectedEvidence(
                        selectedEvidence.filter((id) => id !== item._id),
                      );
                    }
                  }}
                  onDelete={() => handleDeleteEvidence(item._id)}
                  downloadUrl={getFileDownloadUrl(item)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Single Evidence Wizard Dialog */}
      <ChargebackEvidenceWizard
        chargebackId={chargebackId}
        customerUser={customerUser}
        onEvidenceAdded={handleEvidenceAdded}
        open={isEvidenceWizardOpen}
        onOpenChange={setIsEvidenceWizardOpen}
      />
    </div>
  );
}

// Evidence Card Component for Grid View
function EvidenceCard({
  evidence,
  documentTypes,
  statusConfig,
  importanceConfig,
  isSelected,
  onSelect,
  onDelete,
  downloadUrl,
}: {
  evidence: ChargebackEvidence;
  documentTypes: Record<string, DocumentTypeConfig>;
  statusConfig: Record<string, StatusConfig>;
  importanceConfig: Record<string, ImportanceConfig>;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  downloadUrl: string | null;
}) {
  const docType =
    documentTypes[evidence.documentType as keyof typeof documentTypes] ??
    documentTypes.other!;
  const IconComponent = docType.icon;

  return (
    <Card
      className={`transition-all hover:shadow-md ${isSelected ? "ring-primary ring-2" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => onSelect(checked === true)}
            />
            <div className={`rounded-lg p-2 ${docType.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>
          </div>
          <div className="flex gap-1">
            <Badge
              variant={
                importanceConfig[
                  evidence.importance as keyof typeof importanceConfig
                ]?.variant ?? "outline"
              }
            >
              {evidence.importance as string}
            </Badge>
          </div>
        </div>
        <div>
          <h4 className="line-clamp-2 font-medium">
            {evidence.title as string}
          </h4>
          <p className="text-muted-foreground text-sm">{docType.label}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge
            variant={
              statusConfig[
                evidence.submissionStatus as keyof typeof statusConfig
              ]?.variant ?? "outline"
            }
          >
            {statusConfig[evidence.submissionStatus]?.label ??
              evidence.submissionStatus}
          </Badge>
          <div className="text-muted-foreground text-xs">
            {format(new Date(evidence._creationTime), "MMM dd")}
          </div>
        </div>

        {evidence.description && (
          <p className="text-muted-foreground line-clamp-2 text-sm">
            {evidence.description}
          </p>
        )}

        <Separator />

        <div className="flex justify-between">
          <div className="flex gap-1">
            {evidence.fileStorageId && (
              <Button variant="ghost" size="sm" asChild>
                <a href={downloadUrl ?? "#"} download>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
            )}
            {evidence.url && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}
            {evidence.textContent && (
              <Button variant="ghost" size="sm">
                <Eye className="h-3 w-3" />
              </Button>
            )}
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <Trash2 className="h-3 w-3" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{evidence.title}"? This
                  action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onDelete}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardContent>
    </Card>
  );
}

// Evidence List Item Component for List View
function EvidenceListItem({
  evidence,
  documentTypes,
  statusConfig,
  importanceConfig,
  isSelected,
  onSelect,
  onDelete,
  downloadUrl,
}: {
  evidence: ChargebackEvidence;
  documentTypes: Record<string, DocumentTypeConfig>;
  statusConfig: Record<string, StatusConfig>;
  importanceConfig: Record<string, ImportanceConfig>;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  downloadUrl: string | null;
}) {
  const docType =
    documentTypes[evidence.documentType as keyof typeof documentTypes] ??
    documentTypes.other!;
  const IconComponent = docType.icon;

  return (
    <div
      className={`rounded-lg border p-4 transition-all hover:shadow-sm ${isSelected ? "ring-primary ring-2" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(checked === true)}
          />
          <div className={`rounded-lg p-2 ${docType.color}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-medium">{evidence.title}</h4>
            <p className="text-muted-foreground text-sm">{docType.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={
              importanceConfig[evidence.importance]?.variant ?? "outline"
            }
          >
            {evidence.importance}
          </Badge>
          <Badge
            variant={
              statusConfig[evidence.submissionStatus]?.variant ?? "outline"
            }
          >
            {statusConfig[evidence.submissionStatus]?.label ??
              evidence.submissionStatus}
          </Badge>
          <div className="text-muted-foreground text-xs">
            {format(new Date(evidence._creationTime), "MMM dd, yyyy")}
          </div>

          <div className="flex gap-1">
            {evidence.fileStorageId && (
              <Button variant="ghost" size="sm" asChild>
                <a href={downloadUrl ?? "#"} download>
                  <Download className="h-3 w-3" />
                </a>
              </Button>
            )}
            {evidence.url && (
              <Button variant="ghost" size="sm" asChild>
                <a
                  href={evidence.url}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </Button>
            )}

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Evidence</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{evidence.title}"? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={onDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      {evidence.description && (
        <div className="mt-2 ml-12">
          <p className="text-muted-foreground text-sm">
            {evidence.description}
          </p>
        </div>
      )}
    </div>
  );
}
