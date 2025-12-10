"use client";

import React, { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStoreRouteSegments } from "@commerce/admin/store/StoreRouteContext";
import { useChargebackEvidence } from "@commerce/hooks/useChargebackEvidence";
import { Id } from "@convex-config/_generated/dataModel";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { format } from "date-fns";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Edit,
  ExternalLink,
  FileText,
  Paperclip,
  Trash2,
  User,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { toast } from "@acme/ui/toast";

import { ChargebackEvidenceManager } from "./ChargebackEvidenceManager";
import { ChargebackForm } from "./ChargebackForm";

interface ChargebackDetailPageProps {
  chargebackId?: Id<"chargebacks">;
  onNavigate?: (href: string) => void;
  buildBackHref?: () => string;
  buildOrderHref?: (id: Id<"orders">) => string;
}

export default function ChargebackDetailPage({
  chargebackId: chargebackIdProp,
  onNavigate,
  buildBackHref,
  buildOrderHref,
}: ChargebackDetailPageProps = {}) {
  const router = useRouter();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const segments = useStoreRouteSegments();
  const chargebackId =
    chargebackIdProp ?? (segments[1] as Id<"chargebacks"> | undefined);
  const navigate = useCallback(
    (href: string) => {
      if (onNavigate) {
        onNavigate(href);
        return;
      }
      router.push(href);
    },
    [onNavigate, router],
  );
  const backHref = useMemo(
    () => (buildBackHref ? buildBackHref() : "/admin/store/chargebacks"),
    [buildBackHref],
  );
  const resolveOrderHref = useCallback(
    (id: Id<"orders">) =>
      buildOrderHref ? buildOrderHref(id) : `/admin/store/orders/${id}`,
    [buildOrderHref],
  );

  if (!chargebackId) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground text-center">
            Unable to determine the requested chargeback.
          </div>
        </div>
      </div>
    );
  }

  // Add the evidence hook
  const { attachPDFEvidence, isUploading } =
    useChargebackEvidence(chargebackId);

  // Get chargeback details
  const chargeback = useQuery(
    api.ecommerce.chargebacks.queries.getChargeback,
    chargebackId ? { chargebackId } : "skip",
  );

  // Get related order
  const order = useQuery(
    api.ecommerce.orders.queries.getOrder,
    chargeback ? { orderId: chargeback.orderId } : "skip",
  );

  // Get the user associated with this chargeback's email
  const customerUser = useQuery(
    api.core.users.queries.getUserByEmail,
    chargeback ? { email: chargeback.customerInfo.email } : "skip",
  );

  // Delete mutation
  const deleteChargeback = useMutation(
    api.ecommerce.chargebacks.mutations.deleteChargeback,
  );

  if (chargeback === undefined || !chargebackId) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-muted-foreground">
            Loading chargeback details...
          </div>
        </div>
      </div>
    );
  }

  if (chargeback === null) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">Chargeback Not Found</h3>
            <p className="text-muted-foreground">
              The chargeback you're looking for doesn't exist.
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => navigate(backHref)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Chargebacks
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Status badge styling
  const getStatusBadge = (status: typeof chargeback.status) => {
    const statusConfig = {
      received: { variant: "secondary" as const, label: "Received" },
      under_review: { variant: "default" as const, label: "Under Review" },
      accepted: { variant: "destructive" as const, label: "Accepted" },
      disputed: { variant: "outline" as const, label: "Disputed" },
      won: { variant: "default" as const, label: "Won" },
      lost: { variant: "destructive" as const, label: "Lost" },
      expired: { variant: "secondary" as const, label: "Expired" },
    };

    const config = statusConfig[status];
    return (
      <Badge variant={config.variant} className="text-sm">
        {config.label}
      </Badge>
    );
  };

  // Format currency amount
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  // Handle delete
  const handleDelete = async () => {
    try {
      await deleteChargeback({ id: chargeback._id });
      toast.success("Chargeback deleted successfully");
      navigate(backHref);
    } catch (error) {
      toast.error("Failed to delete chargeback");
      console.error(error);
    }
  };

  // Custom action for PDF attachment
  const handleAttachPDF = async (pdfBlob: Blob, filename: string) => {
    try {
      await attachPDFEvidence(
        pdfBlob,
        filename,
        `Audit log evidence for chargeback ${chargebackId}`,
      );
    } catch (error) {
      // Error is already handled in the hook
    }
  };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(backHref)}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Chargebacks
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Chargeback Details</h1>
            <p className="text-muted-foreground">
              Chargeback ID: {chargeback.chargebackId}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Edit Chargeback</DialogTitle>
              </DialogHeader>
              <ChargebackForm
                orderId={order?._id}
                onChargebackCreated={() => setIsEditDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  chargeback record and remove all associated data.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete}>
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main Information */}
        <div className="space-y-6 lg:col-span-2">
          {/* Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Chargeback Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Amount
                  </label>
                  <div className="text-2xl font-bold">
                    {formatAmount(chargeback.amount, chargeback.currency)}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Status
                  </label>
                  <div className="mt-1">
                    {getStatusBadge(chargeback.status)}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Reason Code
                  </label>
                  <div className="font-medium">{chargeback.reasonCode}</div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Processor
                  </label>
                  <div>
                    <Badge variant="outline">{chargeback.processorName}</Badge>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Reason Description
                </label>
                <div className="mt-1 text-sm">
                  {chargeback.reasonDescription}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Name
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">
                      {chargeback.customerInfo.name}
                    </span>
                    {customerUser && (
                      <Link
                        href={`/admin/users/${customerUser._id}`}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Email
                  </label>
                  <div className="flex items-center gap-2">
                    <span>{chargeback.customerInfo.email}</span>
                    {customerUser && (
                      <Badge variant="secondary" className="text-xs">
                        Registered User
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              {chargeback.customerInfo.customerId && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Customer ID
                  </label>
                  <div className="font-mono text-sm">
                    {chargeback.customerInfo.customerId}
                  </div>
                </div>
              )}

              {/* User Activity Section */}
              {customerUser && (
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-muted-foreground text-sm font-medium">
                        User Activity
                      </label>
                      <p className="text-muted-foreground text-xs">
                        View audit logs and activity history for this customer
                      </p>
                    </div>
                    {/* <AuditLogViewer
                      userId={customerUser._id}
                      userName={customerUser.name}
                      userEmail={customerUser.email}
                      trigger={
                        <Button variant="outline" size="sm">
                          <Activity className="mr-2 h-4 w-4" />
                          View Activity Log
                        </Button>
                      }
                    /> */}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Evidence & Notes */}
          {(chargeback.evidenceDetails ||
            chargeback.internalNotes ||
            chargeback.customerCommunication) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Evidence & Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chargeback.evidenceDetails && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Evidence Details
                    </label>
                    <div className="bg-muted/50 mt-1 rounded-md p-3 text-sm">
                      {chargeback.evidenceDetails}
                    </div>
                  </div>
                )}

                {chargeback.internalNotes && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Internal Notes
                    </label>
                    <div className="bg-muted/50 mt-1 rounded-md p-3 text-sm">
                      {chargeback.internalNotes}
                    </div>
                  </div>
                )}

                {chargeback.customerCommunication && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Customer Communication
                    </label>
                    <div className="bg-muted/50 mt-1 rounded-md p-3 text-sm">
                      {chargeback.customerCommunication}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Important Dates */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Important Dates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Chargeback Date
                </label>
                <div className="text-sm">
                  {format(new Date(chargeback.chargebackDate), "MMM dd, yyyy")}
                </div>
              </div>

              <div>
                <label className="text-muted-foreground text-sm font-medium">
                  Received Date
                </label>
                <div className="text-sm">
                  {format(new Date(chargeback.receivedDate), "MMM dd, yyyy")}
                </div>
              </div>

              {chargeback.disputeDeadline && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Dispute Deadline
                  </label>
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      new Date(chargeback.disputeDeadline) < new Date()
                        ? "text-destructive"
                        : ""
                    }`}
                  >
                    {new Date(chargeback.disputeDeadline) < new Date() && (
                      <AlertTriangle className="h-4 w-4" />
                    )}
                    {format(
                      new Date(chargeback.disputeDeadline),
                      "MMM dd, yyyy",
                    )}
                  </div>
                </div>
              )}

              {chargeback.resolvedDate && (
                <div>
                  <label className="text-muted-foreground text-sm font-medium">
                    Resolved Date
                  </label>
                  <div className="text-sm">
                    {format(new Date(chargeback.resolvedDate), "MMM dd, yyyy")}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Financial Details */}
          <Card>
            <CardHeader>
              <CardTitle>Financial Impact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Chargeback Amount</span>
                <span className="font-medium">
                  {formatAmount(chargeback.amount, chargeback.currency)}
                </span>
              </div>

              {chargeback.chargebackFee && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chargeback Fee</span>
                  <span className="text-destructive font-medium">
                    {formatAmount(
                      chargeback.chargebackFee,
                      chargeback.currency,
                    )}
                  </span>
                </div>
              )}

              {chargeback.refundAmount && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Refund Amount</span>
                  <span className="text-destructive font-medium">
                    {formatAmount(chargeback.refundAmount, chargeback.currency)}
                  </span>
                </div>
              )}

              <Separator />

              <div className="flex justify-between text-lg font-semibold">
                <span>Total Impact</span>
                <span className="text-destructive">
                  {formatAmount(
                    chargeback.amount +
                      (chargeback.chargebackFee || 0) +
                      (chargeback.refundAmount || 0),
                    chargeback.currency,
                  )}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Related Order */}
          {order && (
            <Card>
              <CardHeader>
                <CardTitle>Related Order</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order ID</span>
                  <span className="font-mono text-sm">{order.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Total</span>
                  <span className="font-medium">
                    {formatAmount(order.total, chargeback.currency)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date</span>
                  <span className="text-sm">
                    {format(new Date(order.createdAt), "MMM dd, yyyy")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3 w-full"
                  onClick={() =>
                    navigate(resolveOrderHref(order._id as Id<"orders">))
                  }
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  View Order
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Risk Assessment */}
          {(chargeback.riskScore !== undefined ||
            chargeback.previousChargebacks !== undefined) && (
            <Card>
              <CardHeader>
                <CardTitle>Risk Assessment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {chargeback.riskScore !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Risk Score</span>
                    <Badge
                      variant={
                        chargeback.riskScore > 70
                          ? "destructive"
                          : chargeback.riskScore > 40
                            ? "default"
                            : "secondary"
                      }
                    >
                      {chargeback.riskScore}/100
                    </Badge>
                  </div>
                )}

                {chargeback.previousChargebacks !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Previous Chargebacks
                    </span>
                    <span className="font-medium">
                      {chargeback.previousChargebacks}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Case Information */}
          {(chargeback.caseId || chargeback.transactionId) && (
            <Card>
              <CardHeader>
                <CardTitle>Case Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {chargeback.caseId && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Case ID
                    </label>
                    <div className="font-mono text-sm">{chargeback.caseId}</div>
                  </div>
                )}

                {chargeback.transactionId && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Transaction ID
                    </label>
                    <div className="font-mono text-sm">
                      {chargeback.transactionId}
                    </div>
                  </div>
                )}

                {chargeback.evidenceSubmitted !== undefined && (
                  <div>
                    <label className="text-muted-foreground text-sm font-medium">
                      Evidence Submitted
                    </label>
                    <div>
                      <Badge
                        variant={
                          chargeback.evidenceSubmitted ? "default" : "secondary"
                        }
                      >
                        {chargeback.evidenceSubmitted ? "Yes" : "No"}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Evidence Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Evidence & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Existing evidence list */}

          {/* Audit Log Viewer with PDF Attachment */}
          <div className="flex flex-col gap-2">
            <div className="text-sm font-medium">User Activity Evidence</div>
            <p className="text-muted-foreground text-xs">
              Generate and attach user activity audit logs as evidence for this
              chargeback
            </p>

            {/* {chargeback?.userId &&
            chargeback.userId !== "placeholder_user_id" ? (
              <AuditLogViewer
                userId={chargeback.userId}
                userName={chargeback.userName}
                userEmail={chargeback.userEmail}
                exportButtonText="Generate Evidence"
                trigger={
                  <Button variant="outline" size="sm">
                    <FileText className="mr-2 h-4 w-4" />
                    View & Attach Audit Log
                  </Button>
                }
                // This enables the preview with custom attachment action
                onPDFGenerated={undefined} // We want preview mode, not direct attachment
                customActions={[
                  {
                    label: "Attach to Chargeback",
                    variant: "default",
                    icon: <Paperclip className="h-4 w-4" />,
                    onClick: handleAttachPDF,
                    disabled: isUploading,
                  },
                ]}
              />
            ) : (
              <div className="flex h-20 items-center justify-center rounded-lg border border-dashed">
                <div className="text-center">
                  <FileText className="text-muted-foreground mb-2 h-6 w-6" />
                  <p className="text-muted-foreground text-sm">
                    {!chargeback
                      ? "Loading chargeback data..."
                      : "No valid user associated with this chargeback"}
                  </p>
                  {chargeback && (
                    <p className="text-muted-foreground mt-1 text-xs">
                      Cannot generate audit log without a valid user ID
                    </p>
                  )}
                </div>
              </div>
            )} */}
          </div>
        </CardContent>
      </Card>

      {/* Chargeback Evidence Manager */}
      <div className="mt-8">
        <ChargebackEvidenceManager
          customerUser={customerUser}
          chargebackId={chargeback._id}
        />
      </div>
    </div>
  );
}
