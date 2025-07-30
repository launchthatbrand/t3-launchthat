"use client";

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
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Edit,
  ExternalLink,
  Eye,
  FileText,
  MessageCircle,
  Package,
  Plus,
  Send,
  Shield,
  Star,
  Trash2,
  User,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@acme/ui/form";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { AuditLogViewer } from "./AuditLogViewer";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@convex-config/_generated/api";
import { format } from "date-fns";
import { toast } from "@acme/ui/toast";
import { useChargebackEvidence } from "~/hooks/useChargebackEvidence";
import { useForm } from "react-hook-form";

type ChargebackEvidence = Doc<"chargebackEvidence">;

interface ChargebackEvidenceManagerProps {
  chargebackId: Id<"chargebacks">;
  customerUser?: {
    _id: Id<"users">;
    name?: string;
    email: string;
  } | null;
}

// Add Evidence Dialog Component with seamless step transitions
interface AddEvidenceDialogProps {
  chargebackId: Id<"chargebacks">;
  onEvidenceAdded: () => void;
  customerUser?: {
    _id: Id<"users">;
    name?: string;
    email: string;
  } | null;
}

type DocumentType = "audit_log" | "communication" | "shipping";

interface EvidenceFormData {
  title: string;
  description: string;
  importance: "low" | "medium" | "high";
  tags: string;
  textContent?: string;
  notes?: string;
}

const AddEvidenceDialog: React.FC<AddEvidenceDialogProps> = ({
  chargebackId,
  onEvidenceAdded,
  customerUser,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<"select" | "form" | "audit">("select");
  const [selectedDocType, setSelectedDocType] = useState<DocumentType | null>(
    null,
  );
  const { attachPDFEvidence, isUploading } =
    useChargebackEvidence(chargebackId);

  const form = useForm<EvidenceFormData>({
    defaultValues: {
      importance: "medium",
      tags: "",
    },
  });

  // Reset dialog state when closed
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setStep("select");
      setSelectedDocType(null);
      form.reset();
    }
  };

  // Document type selection cards
  const documentTypes = [
    {
      type: "audit_log" as DocumentType,
      title: "Add Audit Log",
      description: "User activity and system audit logs",
      icon: <Shield className="h-8 w-8 text-blue-600" />,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
    },
    {
      type: "communication" as DocumentType,
      title: "Add Customer Communication",
      description: "Emails, chat logs, and customer interactions",
      icon: <MessageCircle className="h-8 w-8 text-green-600" />,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
    },
    {
      type: "shipping" as DocumentType,
      title: "Add Shipping Proof",
      description: "Tracking info, delivery confirmations, receipts",
      icon: <Package className="h-8 w-8 text-orange-600" />,
      bgColor: "bg-orange-50",
      borderColor: "border-orange-200",
    },
  ];

  const handleDocTypeSelect = (docType: DocumentType) => {
    setSelectedDocType(docType);

    if (docType === "audit_log") {
      setStep("audit");
    } else {
      form.setValue("title", getDefaultTitle(docType));
      form.setValue("tags", getDefaultTags(docType));
      setStep("form");
    }
  };

  const getDefaultTitle = (docType: DocumentType): string => {
    switch (docType) {
      case "communication":
        return "Customer Communication Record";
      case "shipping":
        return "Shipping and Delivery Proof";
      default:
        return "";
    }
  };

  const getDefaultTags = (docType: DocumentType): string => {
    switch (docType) {
      case "communication":
        return "customer_service, communication, support";
      case "shipping":
        return "shipping, delivery, tracking, logistics";
      case "audit_log":
        return "audit_log, user_activity, system";
      default:
        return "";
    }
  };

  // Handle audit log PDF attachment (called from embedded audit log viewer)
  const handleAuditLogAttachment = async (pdfBlob: Blob, filename: string) => {
    try {
      await attachPDFEvidence(
        pdfBlob,
        filename,
        "User activity audit log for chargeback evidence",
      );
      toast.success("Audit log evidence attached successfully!");
      onEvidenceAdded();
      handleOpenChange(false);
    } catch (error) {
      console.error("Failed to attach audit log:", error);
      toast.error("Failed to attach audit log evidence");
    }
  };

  const handleFormSubmit = (data: EvidenceFormData) => {
    // Handle form submission for communication and shipping evidence
    console.log("Form data:", data, "Document type:", selectedDocType);
    // TODO: Implement file upload and evidence creation
    toast.success("Evidence form submitted! (File upload not yet implemented)");
    onEvidenceAdded();
    handleOpenChange(false);
  };

  const renderStepContent = () => {
    switch (step) {
      case "select":
        return (
          <div className="space-y-6">
            <p className="text-muted-foreground">
              Choose the type of evidence you want to add to this chargeback
              case.
            </p>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {documentTypes.map((docType) => (
                <Card
                  key={docType.type}
                  className={`cursor-pointer transition-all hover:shadow-md ${docType.bgColor} ${docType.borderColor} border-2`}
                  onClick={() => handleDocTypeSelect(docType.type)}
                >
                  <CardHeader className="pb-2 text-center">
                    <div className="mb-2 flex justify-center">
                      {docType.icon}
                    </div>
                    <CardTitle className="text-lg">{docType.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-center">
                    <p className="text-sm text-muted-foreground">
                      {docType.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case "audit":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">User Audit Log</h3>
                <p className="text-muted-foreground">
                  Generate and attach user activity audit logs as evidence.
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back to Selection
              </Button>
            </div>

            {/* Embedded User selection for audit log */}
            {customerUser ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Customer User
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">
                          {customerUser.name ?? customerUser.email}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {customerUser.email}
                        </p>
                      </div>
                      <Badge variant="outline">Customer</Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Embedded Audit Log Viewer without separate dialog */}
                <div className="rounded-lg border">
                  <AuditLogViewer
                    userId={customerUser._id}
                    userName={customerUser.name}
                    userEmail={customerUser.email}
                    exportButtonText="Attach as Evidence"
                    onPDFGenerated={handleAuditLogAttachment}
                    // No trigger needed - we'll embed the content directly
                    trigger={<div />}
                    open={true}
                    onOpenChange={() => {}} // Prevent closing
                  />
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> No customer user associated with this
                  chargeback. Audit log attachment requires a valid user.
                </p>
              </div>
            )}
          </div>
        );

      case "form":
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium">
                  {selectedDocType === "communication"
                    ? "Customer Communication Evidence"
                    : "Shipping Evidence"}
                </h3>
                <p className="text-muted-foreground">
                  Fill in the details for your{" "}
                  {selectedDocType === "communication"
                    ? "customer communication"
                    : "shipping"}{" "}
                  evidence.
                </p>
              </div>
              <Button variant="outline" onClick={() => setStep("select")}>
                Back to Selection
              </Button>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleFormSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter evidence title" {...field} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this evidence and its relevance to the chargeback"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* Conditional fields based on document type */}
                {selectedDocType === "communication" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="textContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Communication Content</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Paste email content, chat logs, or communication details here"
                              rows={6}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                {selectedDocType === "shipping" && (
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="textContent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tracking & Delivery Information</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter tracking numbers, delivery confirmations, shipping details, etc."
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="importance"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Importance</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full rounded-md border border-input bg-background px-3 py-2"
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                          </select>
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (comma-separated)</FormLabel>
                        <FormControl>
                          <Input placeholder="tag1, tag2, tag3" {...field} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Any additional context or notes about this evidence"
                          {...field}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep("select")}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? "Adding Evidence..." : "Add Evidence"}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        );

      default:
        return null;
    }
  };

  const getDialogTitle = () => {
    switch (step) {
      case "select":
        return "Add Evidence - Select Document Type";
      case "audit":
        return "Add Evidence - User Audit Log";
      case "form":
        return `Add Evidence - ${selectedDocType === "communication" ? "Customer Communication" : "Shipping Proof"}`;
      default:
        return "Add Evidence";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Evidence
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[95vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{getDialogTitle()}</DialogTitle>
        </DialogHeader>

        <div className="min-h-[400px]">{renderStepContent()}</div>
      </DialogContent>
    </Dialog>
  );
};

export function ChargebackEvidenceManager({
  chargebackId,
  customerUser,
}: ChargebackEvidenceManagerProps) {
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

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
  const submitEvidence = useMutation(
    api.ecommerce.chargebacks.evidence.submitEvidence,
  );
  const deleteEvidence = useMutation(
    api.ecommerce.chargebacks.evidence.deleteEvidence,
  );

  // Document type configurations
  const documentTypes = {
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
  const statusConfig = {
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
  const importanceConfig = {
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

  if (!evidence || !evidenceSummary) {
    return (
      <Card>
        <CardContent className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="mt-2 text-sm text-muted-foreground">
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
              <p className="text-sm text-muted-foreground">
                Manage evidence and supporting documents for this chargeback
              </p>
            </div>

            <AddEvidenceDialog
              chargebackId={chargebackId}
              customerUser={customerUser}
              onEvidenceAdded={() => {
                // Refresh evidence list
                window.location.reload(); // TODO: Implement proper refresh
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {evidenceSummary.totalCount}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Documents
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">
                {evidenceSummary.draftCount}
              </div>
              <div className="text-sm text-muted-foreground">Draft</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {evidenceSummary.readyCount}
              </div>
              <div className="text-sm text-muted-foreground">Ready</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {evidenceSummary.submittedCount}
              </div>
              <div className="text-sm text-muted-foreground">Submitted</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {evidenceSummary.criticalCount}
              </div>
              <div className="text-sm text-muted-foreground">Critical</div>
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
              <FileText className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No Evidence Documents</h3>
              <p className="text-muted-foreground">
                Start building your case by adding evidence documents
              </p>
              <AddEvidenceDialog
                chargebackId={chargebackId}
                customerUser={customerUser}
                onEvidenceAdded={() => {
                  window.location.reload();
                }}
              />
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
  documentTypes: typeof documentTypes;
  statusConfig: typeof statusConfig;
  importanceConfig: typeof importanceConfig;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  downloadUrl: string | null;
}) {
  const docType =
    documentTypes[evidence.documentType as keyof typeof documentTypes];
  const IconComponent = docType.icon;

  return (
    <Card
      className={`transition-all hover:shadow-md ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Checkbox checked={isSelected} onCheckedChange={onSelect} />
            <div className={`rounded-lg p-2 ${docType.color}`}>
              <IconComponent className="h-4 w-4" />
            </div>
          </div>
          <div className="flex gap-1">
            <Badge variant={importanceConfig[evidence.importance].variant}>
              {evidence.importance}
            </Badge>
          </div>
        </div>
        <div>
          <h4 className="line-clamp-2 font-medium">{evidence.title}</h4>
          <p className="text-sm text-muted-foreground">{docType.label}</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <Badge variant={statusConfig[evidence.submissionStatus].variant}>
            {statusConfig[evidence.submissionStatus].label}
          </Badge>
          <div className="text-xs text-muted-foreground">
            {format(new Date(evidence._creationTime), "MMM dd")}
          </div>
        </div>

        {evidence.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
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
  documentTypes: typeof documentTypes;
  statusConfig: typeof statusConfig;
  importanceConfig: typeof importanceConfig;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  downloadUrl: string | null;
}) {
  const docType =
    documentTypes[evidence.documentType as keyof typeof documentTypes];
  const IconComponent = docType.icon;

  return (
    <div
      className={`rounded-lg border p-4 transition-all hover:shadow-sm ${isSelected ? "ring-2 ring-primary" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Checkbox checked={isSelected} onCheckedChange={onSelect} />
          <div className={`rounded-lg p-2 ${docType.color}`}>
            <IconComponent className="h-4 w-4" />
          </div>
          <div>
            <h4 className="font-medium">{evidence.title}</h4>
            <p className="text-sm text-muted-foreground">{docType.label}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant={importanceConfig[evidence.importance].variant}>
            {evidence.importance}
          </Badge>
          <Badge variant={statusConfig[evidence.submissionStatus].variant}>
            {statusConfig[evidence.submissionStatus].label}
          </Badge>
          <div className="text-xs text-muted-foreground">
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
        <div className="ml-12 mt-2">
          <p className="text-sm text-muted-foreground">
            {evidence.description}
          </p>
        </div>
      )}
    </div>
  );
}
