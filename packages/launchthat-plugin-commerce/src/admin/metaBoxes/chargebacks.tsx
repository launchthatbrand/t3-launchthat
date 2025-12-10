"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unnecessary-condition */
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { ArrowUpRight, Loader2 } from "lucide-react";

import type { AdminMetaBoxContext } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import { Badge } from "@acme/ui/badge";
import { buttonVariants } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import {
  COMMERCE_CHARGEBACK_POST_TYPE,
  decodeChargebackPostId,
  encodeChargebackPostId,
} from "../adapters";
import { ChargebackForm } from "../components/chargebacks/ChargebackForm";

type ChargebackStatus =
  | "received"
  | "under_review"
  | "accepted"
  | "disputed"
  | "won"
  | "lost"
  | "expired";

interface ChargebackDetailsFormState {
  amount: string;
  currency: string;
  reasonCode: string;
  reasonDescription: string;
  processorName: string;
  chargebackFee: string;
  refundAmount: string;
  internalNotes: string;
}

const CHARGEBACK_STATUSES: { label: string; value: ChargebackStatus }[] = [
  { label: "Received", value: "received" },
  { label: "Under Review", value: "under_review" },
  { label: "Disputed", value: "disputed" },
  { label: "Accepted", value: "accepted" },
  { label: "Won", value: "won" },
  { label: "Lost", value: "lost" },
  { label: "Expired", value: "expired" },
];

const formatCurrency = (amount?: number, currency = "USD") => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return "-";
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${currency}`;
  }
};

const toFormState = (
  chargeback?: Doc<"chargebacks"> | null,
): ChargebackDetailsFormState => ({
  amount:
    typeof chargeback?.amount === "number" ? chargeback.amount.toString() : "",
  currency: chargeback?.currency ?? "USD",
  reasonCode: chargeback?.reasonCode ?? "",
  reasonDescription: chargeback?.reasonDescription ?? "",
  processorName: chargeback?.processorName ?? "Stripe",
  chargebackFee:
    typeof chargeback?.chargebackFee === "number"
      ? chargeback.chargebackFee.toString()
      : "",
  refundAmount:
    typeof chargeback?.refundAmount === "number"
      ? chargeback.refundAmount.toString()
      : "",
  internalNotes: chargeback?.internalNotes ?? "",
});

type CommerceAdminContext = AdminMetaBoxContext<Doc<"posts">, Doc<"postTypes">>;

const CommerceChargebackGeneralMetaBox = ({
  context,
}: {
  context: CommerceAdminContext;
}) => {
  const registerBeforeSave = context.registerBeforeSave;
  const router = useRouter();
  const [isSavingDetails, setIsSavingDetails] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const chargebackRecordId = useMemo(
    () => decodeChargebackPostId(context.post?._id ?? null),
    [context.post?._id],
  );
  const isNewRecord = context.isNewRecord || !chargebackRecordId;

  const chargeback = useQuery(
    api.ecommerce.chargebacks.queries.getChargeback,
    !isNewRecord && chargebackRecordId
      ? { chargebackId: chargebackRecordId }
      : "skip",
  );

  const updateStatus = useMutation(
    api.ecommerce.chargebacks.mutations.updateChargebackStatus,
  );
  const updateDetails = useMutation(
    api.ecommerce.chargebacks.mutations.updateChargebackDetails,
  );

  const [detailForm, setDetailForm] = useState<ChargebackDetailsFormState>(() =>
    toFormState(undefined),
  );
  const [selectedStatus, setSelectedStatus] =
    useState<ChargebackStatus>("received");

  useEffect(() => {
    if (chargeback) {
      setDetailForm(toFormState(chargeback));
      setSelectedStatus(chargeback.status as ChargebackStatus);
    }
  }, [chargeback]);

  const handleChargebackCreated = useCallback(
    ({ id }: { id: Id<"chargebacks"> }) => {
      toast.success("Chargeback created successfully.");
      router.replace(
        `/admin/edit?post_type=${COMMERCE_CHARGEBACK_POST_TYPE}&post_id=${encodeChargebackPostId(id)}`,
      );
    },
    [router],
  );

  const submitDetails = useCallback(async () => {
    if (!chargebackRecordId) {
      return;
    }
    setIsSavingDetails(true);
    try {
      const payload: Parameters<typeof updateDetails>[0] = {
        chargebackId: chargebackRecordId,
      };

      const amount = parseFloat(detailForm.amount);
      if (!Number.isNaN(amount)) {
        payload.amount = amount;
      }

      if (detailForm.currency?.length) {
        payload.currency = detailForm.currency;
      }

      if (detailForm.reasonCode?.length) {
        payload.reasonCode = detailForm.reasonCode;
      }
      if (detailForm.reasonDescription?.length) {
        payload.reasonDescription = detailForm.reasonDescription;
      }
      if (detailForm.processorName?.length) {
        payload.processorName = detailForm.processorName;
      }

      const chargebackFee = parseFloat(detailForm.chargebackFee);
      if (!Number.isNaN(chargebackFee)) {
        payload.chargebackFee = chargebackFee;
      }

      const refundAmount = parseFloat(detailForm.refundAmount);
      if (!Number.isNaN(refundAmount)) {
        payload.refundAmount = refundAmount;
      }

      payload.internalNotes = detailForm.internalNotes ?? "";

      await updateDetails(payload);
      toast.success("Chargeback details updated.");
    } catch (error) {
      console.error("Failed to update chargeback details", error);
      toast.error("Unable to update chargeback details.");
    } finally {
      setIsSavingDetails(false);
    }
  }, [chargebackRecordId, detailForm, updateDetails]);

  useEffect(() => {
    if (!registerBeforeSave || isNewRecord || !chargebackRecordId) {
      return;
    }
    const unregister = registerBeforeSave(async () => {
      await submitDetails();
    });
    return unregister;
  }, [chargebackRecordId, isNewRecord, registerBeforeSave, submitDetails]);

  const handleStatusChange = useCallback(
    async (value: ChargebackStatus) => {
      if (!chargebackRecordId) {
        return;
      }
      setIsUpdatingStatus(true);
      try {
        await updateStatus({ chargebackId: chargebackRecordId, status: value });
        setSelectedStatus(value);
        toast.success("Chargeback status updated.");
      } catch (error) {
        console.error("Failed to update chargeback status", error);
        toast.error("Unable to update chargeback status.");
      } finally {
        setIsUpdatingStatus(false);
      }
    },
    [chargebackRecordId, updateStatus],
  );

  if (isNewRecord) {
    return (
      <ChargebackForm
        variant="inline"
        onChargebackCreated={handleChargebackCreated}
      />
    );
  }

  if (chargeback === undefined) {
    return (
      <div className="text-muted-foreground flex items-center gap-2">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading chargeback details…
      </div>
    );
  }

  if (chargeback === null || !chargebackRecordId) {
    return (
      <div className="border-destructive/30 bg-destructive/5 text-destructive rounded-lg border p-4 text-sm">
        Chargeback could not be found. It may have been deleted.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-lg border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">Chargeback Overview</h3>
            <p className="text-muted-foreground text-sm">
              Track the current status and financial impact.
            </p>
          </div>
          <Link
            href={`/admin/store/chargebacks/${chargebackRecordId}`}
            target="_blank"
            className={buttonVariants({ variant: "ghost", size: "sm" })}
          >
            View in Store
            <ArrowUpRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <Label className="text-muted-foreground text-xs tracking-wide uppercase">
              Amount
            </Label>
            <p className="text-xl font-semibold">
              {formatCurrency(chargeback.amount, chargeback.currency)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs tracking-wide uppercase">
              Chargeback Fee
            </Label>
            <p className="text-xl font-semibold">
              {formatCurrency(chargeback.chargebackFee, chargeback.currency)}
            </p>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs tracking-wide uppercase">
              Refund Amount
            </Label>
            <p className="text-xl font-semibold">
              {formatCurrency(chargeback.refundAmount, chargeback.currency)}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <Label className="text-muted-foreground text-xs tracking-wide uppercase">
              Current Status
            </Label>
            <Badge variant="outline" className="text-base capitalize">
              {selectedStatus.replace("_", " ")}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Select
              value={selectedStatus}
              onValueChange={(value) =>
                handleStatusChange(value as ChargebackStatus)
              }
              disabled={isUpdatingStatus}
            >
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {CHARGEBACK_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdatingStatus && (
              <Loader2 className="text-muted-foreground h-4 w-4 animate-spin" />
            )}
          </div>
        </div>
      </div>

      <div className="bg-card space-y-6 rounded-lg border p-4">
        <div>
          <h4 className="text-base font-semibold">Chargeback Details</h4>
          <p className="text-muted-foreground text-sm">
            Update financials, processor information, and internal notes.
            Changes apply when you click Save in the Actions panel.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="cb-amount">Amount</Label>
            <Input
              id="cb-amount"
              value={detailForm.amount}
              onChange={(event) =>
                setDetailForm((prev) => ({
                  ...prev,
                  amount: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cb-currency">Currency</Label>
            <Input
              id="cb-currency"
              value={detailForm.currency}
              onChange={(event) =>
                setDetailForm((prev) => ({
                  ...prev,
                  currency: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cb-reason-code">Reason Code</Label>
            <Input
              id="cb-reason-code"
              value={detailForm.reasonCode}
              onChange={(event) =>
                setDetailForm((prev) => ({
                  ...prev,
                  reasonCode: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cb-processor">Processor</Label>
            <Input
              id="cb-processor"
              value={detailForm.processorName}
              onChange={(event) =>
                setDetailForm((prev) => ({
                  ...prev,
                  processorName: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cb-fee">Chargeback Fee</Label>
            <Input
              id="cb-fee"
              value={detailForm.chargebackFee}
              onChange={(event) =>
                setDetailForm((prev) => ({
                  ...prev,
                  chargebackFee: event.target.value,
                }))
              }
            />
          </div>
          <div>
            <Label htmlFor="cb-refund">Refund Amount</Label>
            <Input
              id="cb-refund"
              value={detailForm.refundAmount}
              onChange={(event) =>
                setDetailForm((prev) => ({
                  ...prev,
                  refundAmount: event.target.value,
                }))
              }
            />
          </div>
        </div>
        <div>
          <Label htmlFor="cb-reason-description">Reason Description</Label>
          <Textarea
            id="cb-reason-description"
            value={detailForm.reasonDescription}
            onChange={(event) =>
              setDetailForm((prev) => ({
                ...prev,
                reasonDescription: event.target.value,
              }))
            }
          />
        </div>
        <div>
          <Label htmlFor="cb-notes">Internal Notes</Label>
          <Textarea
            id="cb-notes"
            value={detailForm.internalNotes}
            onChange={(event) =>
              setDetailForm((prev) => ({
                ...prev,
                internalNotes: event.target.value,
              }))
            }
            placeholder="Document communication, evidence, or other relevant details."
          />
        </div>
        <div className="text-muted-foreground flex items-center justify-between text-xs">
          <span>Use the Save button in Actions to persist these details.</span>
          {isSavingDetails ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-3 w-3 animate-spin" />
              Saving…
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
};

let chargebackMetaBoxesRegistered = false;

const registerCommerceChargebackMetaBoxHook = () => {
  if (chargebackMetaBoxesRegistered) {
    return;
  }

  registerMetaBoxHook<CommerceAdminContext>("main", (context) => {
    if (context.slug.toLowerCase() !== COMMERCE_CHARGEBACK_POST_TYPE) {
      return null;
    }

    context.visibility = {
      ...(context.visibility ?? {}),
      showGeneralPanel: false,
    };

    return {
      id: "commerce-chargeback-general",
      title: "Chargeback Details",
      description:
        "Create and manage chargebacks with commerce-specific tools.",
      location: "main",
      priority: -50,
      render: () => <CommerceChargebackGeneralMetaBox context={context} />,
    };
  });

  chargebackMetaBoxesRegistered = true;
};

export const registerChargebackMetaBoxes = () => {
  registerCommerceChargebackMetaBoxHook();
};
