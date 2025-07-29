"use client";

import {
  Activity,
  AlertCircle,
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
  Tag,
  Trash2,
  Upload,
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
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { useMutation, useQuery } from "convex/react";

import { AuditLogViewer } from "./AuditLogViewer";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Checkbox } from "@acme/ui/checkbox";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@convex-config/_generated/api";
import { format } from "date-fns";
import { toast } from "@acme/ui/toast";

type ChargebackEvidence = Doc<"chargebackEvidence">;

interface ChargebackEvidenceManagerProps {
  chargebackId: Id<"chargebacks">;
  processorName?: string;
  customerUser?: {
    _id: Id<"users">;
    name?: string;
    email: string;
  } | null;
}

export function ChargebackEvidenceManager({
  chargebackId,
  processorName = "Stripe",
  customerUser,
}: ChargebackEvidenceManagerProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedEvidence, setSelectedEvidence] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Queries
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
      icon: Tag,
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
    ready: { variant: "default" as const, label: "Ready", icon: CheckCircle },
    submitted: { variant: "outline" as const, label: "Submitted", icon: Send },
    accepted: {
      variant: "default" as const,
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
    high: { variant: "default" as const, label: "High", icon: Star },
    medium: { variant: "outline" as const, label: "Medium", icon: Clock },
    low: { variant: "secondary" as const, label: "Low", icon: CheckCircle },
  };

  const handleSubmitSelected = async () => {
    if (selectedEvidence.length === 0) {
      toast.error("Please select evidence to submit");
      return;
    }

    try {
      const result = await submitEvidence({
        evidenceIds: selectedEvidence as Id<"chargebackEvidence">[],
        submittedBy: "admin@example.com", // TODO: Get from auth context
      });

      if (result.success) {
        toast.success(
          `Successfully submitted ${result.submittedCount} evidence documents`,
        );
        setSelectedEvidence([]);
      } else {
        toast.error(result.error || "Failed to submit evidence");
      }
    } catch (error) {
      toast.error("Failed to submit evidence");
      console.error(error);
    }
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
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Chargeback Evidence & Documentation
            </CardTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={async () => {
                  try {
                    // Generate audit log for this chargeback and add it as evidence
                    const auditLogEvidence = await addEvidence({
                      chargebackId,
                      documentType: "audit_log",
                      title: "User Activity Audit Log",
                      description:
                        "Complete audit log of user activity related to this transaction",
                      textContent:
                        "This evidence contains the user's complete activity log for verification purposes.",
                      importance: "high",
                      submissionStatus: "prepared",
                      notes: "Generated automatically for chargeback dispute",
                    });

                    if (auditLogEvidence) {
                      // Show success message or navigate to audit log page
                      window.open("/admin/settings/auditLog", "_blank");
                    }
                  } catch (error) {
                    console.error(
                      "Error generating audit log evidence:",
                      error,
                    );
                  }
                }}
              >
                <FileText className="mr-2 h-4 w-4" />
                Generate Audit Log Evidence
              </Button>

              {/* View Audit Log Button */}
              {customerUser && (
                <AuditLogViewer
                  userId={customerUser._id}
                  userName={customerUser.name}
                  userEmail={customerUser.email}
                  trigger={
                    <Button variant="outline" size="sm">
                      <Activity className="mr-2 h-4 w-4" />
                      View Customer Activity
                    </Button>
                  }
                />
              )}

              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Evidence
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Add Evidence Document</DialogTitle>
                  </DialogHeader>
                  <EvidenceForm
                    chargebackId={chargebackId}
                    onSuccess={() => setIsAddDialogOpen(false)}
                    onCancel={() => setIsAddDialogOpen(false)}
                    processorName={processorName}
                  />
                </DialogContent>
              </Dialog>

              {selectedEvidence.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline">
                      <Send className="mr-2 h-4 w-4" />
                      Submit Selected ({selectedEvidence.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>
                        Submit Evidence to Processor
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to submit{" "}
                        {selectedEvidence.length} evidence document(s) to{" "}
                        {processorName}? This action will mark them as submitted
                        and they cannot be modified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={handleSubmitSelected}>
                        Submit Evidence
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
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
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
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
              <Button className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Document
              </Button>
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
  documentTypes: any;
  statusConfig: any;
  importanceConfig: any;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  downloadUrl: string | null;
}) {
  const docType = documentTypes[evidence.documentType];
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
                <a href={downloadUrl || "#"} download>
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
  documentTypes: any;
  statusConfig: any;
  importanceConfig: any;
  isSelected: boolean;
  onSelect: (selected: boolean) => void;
  onDelete: () => void;
  downloadUrl: string | null;
}) {
  const docType = documentTypes[evidence.documentType];
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
                <a href={downloadUrl || "#"} download>
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

// Evidence Form Component
function EvidenceForm({
  chargebackId,
  onSuccess,
  onCancel,
  processorName,
  evidence,
}: {
  chargebackId: Id<"chargebacks">;
  onSuccess: () => void;
  onCancel: () => void;
  processorName: string;
  evidence?: ChargebackEvidence;
}) {
  const [formData, setFormData] = useState({
    documentType: evidence?.documentType || "receipt",
    title: evidence?.title || "",
    description: evidence?.description || "",
    textContent: evidence?.textContent || "",
    url: evidence?.url || "",
    importance: evidence?.importance || "medium",
    tags: evidence?.tags?.join(", ") || "",
  });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createEvidence = useMutation(
    api.ecommerce.chargebacks.evidence.createEvidence,
  );
  const updateEvidence = useMutation(
    api.ecommerce.chargebacks.evidence.updateEvidence,
  );
  const generateUploadUrl = useMutation(
    api.ecommerce.chargebacks.evidence.generateUploadUrl,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let fileStorageId: Id<"_storage"> | undefined;

      // Upload file if provided
      if (file) {
        const uploadUrl = await generateUploadUrl();
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });

        if (result.ok) {
          const { storageId } = await result.json();
          fileStorageId = storageId;
        }
      }

      const processorRelevance = {
        stripe: processorName.toLowerCase() === "stripe",
        authorizeNet: processorName.toLowerCase() === "authorize.net",
        paypal: processorName.toLowerCase() === "paypal",
        square: processorName.toLowerCase() === "square",
      };

      const evidenceData = {
        documentType: formData.documentType as any,
        title: formData.title,
        description: formData.description || undefined,
        textContent: formData.textContent || undefined,
        url: formData.url || undefined,
        importance: formData.importance as any,
        tags: formData.tags
          ? formData.tags.split(",").map((t) => t.trim())
          : undefined,
        processorRelevance,
        fileStorageId,
        submittedBy: "admin@example.com", // TODO: Get from auth context
      };

      if (evidence) {
        await updateEvidence({
          id: evidence._id,
          ...evidenceData,
        });
        toast.success("Evidence updated successfully");
      } else {
        await createEvidence({
          chargebackId,
          ...evidenceData,
        });
        toast.success("Evidence created successfully");
      }

      onSuccess();
    } catch (error) {
      toast.error("Failed to save evidence");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="documentType">Document Type *</Label>
          <Select
            value={formData.documentType}
            onValueChange={(value) =>
              setFormData({ ...formData, documentType: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select document type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="receipt">Receipt/Invoice</SelectItem>
              <SelectItem value="shipping_proof">Shipping Proof</SelectItem>
              <SelectItem value="customer_communication">
                Customer Communication
              </SelectItem>
              <SelectItem value="refund_policy">Refund Policy</SelectItem>
              <SelectItem value="terms_of_service">Terms of Service</SelectItem>
              <SelectItem value="product_description">
                Product Description
              </SelectItem>
              <SelectItem value="customer_signature">
                Customer Signature
              </SelectItem>
              <SelectItem value="billing_statement">
                Billing Statement
              </SelectItem>
              <SelectItem value="transaction_history">
                Transaction History
              </SelectItem>
              <SelectItem value="dispute_response">Dispute Response</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="importance">Importance *</Label>
          <Select
            value={formData.importance}
            onValueChange={(value) =>
              setFormData({ ...formData, importance: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select importance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of the evidence"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder="Detailed description of this evidence and its relevance"
          rows={3}
        />
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Evidence Content</h4>

        <div className="space-y-2">
          <Label htmlFor="file">Upload File</Label>
          <Input
            id="file"
            type="file"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <p className="text-xs text-muted-foreground">
            Accepted formats: Images, PDF, Word documents, Text files
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="url">External Link</Label>
          <Input
            id="url"
            type="url"
            value={formData.url}
            onChange={(e) => setFormData({ ...formData, url: e.target.value })}
            placeholder="https://example.com/evidence"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="textContent">Text Content</Label>
          <Textarea
            id="textContent"
            value={formData.textContent}
            onChange={(e) =>
              setFormData({ ...formData, textContent: e.target.value })
            }
            placeholder="Paste relevant text content, emails, or notes here"
            rows={4}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tags">Tags</Label>
        <Input
          id="tags"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="tag1, tag2, tag3"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated tags for organization
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? "Saving..."
            : evidence
              ? "Update Evidence"
              : "Add Evidence"}
        </Button>
      </div>
    </form>
  );
}
