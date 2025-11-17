"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import React, { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";

import { AlertTriangle } from "lucide-react";
import { Button } from "@acme/ui/button";
import { Id } from "@convex-config/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useMutation } from "convex/react";

interface ChargebackFormProps {
  orderId: Id<"orders">;
  onChargebackCreated?: () => void;
}

const commonReasonCodes = [
  { code: "4855", description: "Goods or Services Not Provided" },
  { code: "4534", description: "Multiple Processing" },
  { code: "4837", description: "No Cardholder Authorization" },
  { code: "4863", description: "Cardholder Does Not Recognize Transaction" },
  { code: "4854", description: "Cardholder Dispute of Credit Not Processed" },
  { code: "4840", description: "Fraudulent Processing of Transactions" },
  { code: "4850", description: "Installment Billing Dispute" },
];

export const ChargebackForm: React.FC<ChargebackFormProps> = ({
  orderId,
  onChargebackCreated,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    transactionId: "",
    amount: "",
    reasonCode: "",
    reasonDescription: "",
    processorName: "Stripe",
    chargebackFee: "1500", // $15.00 in cents
    internalNotes: "",
  });

  const createChargeback = useMutation(api.ecommerce.createChargeback);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const result = await createChargeback({
        orderId,
        transactionId: formData.transactionId || `txn_${Date.now()}`,
        amount: parseFloat(formData.amount), // Convert to cents
        currency: "USD",
        reasonCode: formData.reasonCode,
        reasonDescription: formData.reasonDescription,
        customerInfo: {
          name: "Customer", // Will be overridden by actual order customer info
          email: "customer@example.com", // Will be overridden
          customerId: undefined,
        },
        processorName: formData.processorName,
        chargebackFee: parseInt(formData.chargebackFee),
        internalNotes: formData.internalNotes,
      });

      if (result.success) {
        toast.success(
          `Chargeback created successfully! ID: ${result.chargebackId}`,
        );
        setIsOpen(false);
        setFormData({
          transactionId: "",
          amount: "",
          reasonCode: "",
          reasonDescription: "",
          processorName: "Stripe",
          chargebackFee: "1500",
          internalNotes: "",
        });
        onChargebackCreated?.();
      } else {
        toast.error(`Failed to create chargeback: ${result.error}`);
      }
    } catch (error) {
      console.error("Error creating chargeback:", error);
      toast.error("Failed to create chargeback");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReasonCodeChange = (value: string) => {
    const selectedReason = commonReasonCodes.find((r) => r.code === value);
    setFormData({
      ...formData,
      reasonCode: value,
      reasonDescription: selectedReason?.description || "",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          <AlertTriangle className="mr-2 h-4 w-4" />
          Create Chargeback
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Chargeback</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="transactionId">Transaction ID</Label>
              <Input
                id="transactionId"
                value={formData.transactionId}
                onChange={(e) =>
                  setFormData({ ...formData, transactionId: e.target.value })
                }
                placeholder="Auto-generated if empty"
              />
            </div>
            <div>
              <Label htmlFor="amount">Amount ($)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="Order total if empty"
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="reasonCode">Reason Code</Label>
            <Select
              value={formData.reasonCode}
              onValueChange={handleReasonCodeChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a reason code" />
              </SelectTrigger>
              <SelectContent>
                {commonReasonCodes.map((reason) => (
                  <SelectItem key={reason.code} value={reason.code}>
                    {reason.code} - {reason.description}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="reasonDescription">Reason Description</Label>
            <Input
              id="reasonDescription"
              value={formData.reasonDescription}
              onChange={(e) =>
                setFormData({ ...formData, reasonDescription: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="processorName">Processor</Label>
              <Select
                value={formData.processorName}
                onValueChange={(value) =>
                  setFormData({ ...formData, processorName: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Stripe">Stripe</SelectItem>
                  <SelectItem value="PayPal">PayPal</SelectItem>
                  <SelectItem value="Square">Square</SelectItem>
                  <SelectItem value="Authorize.Net">Authorize.Net</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="chargebackFee">Chargeback Fee (cents)</Label>
              <Input
                id="chargebackFee"
                type="number"
                value={formData.chargebackFee}
                onChange={(e) =>
                  setFormData({ ...formData, chargebackFee: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <Label htmlFor="internalNotes">Internal Notes</Label>
            <Textarea
              id="internalNotes"
              value={formData.internalNotes}
              onChange={(e) =>
                setFormData({ ...formData, internalNotes: e.target.value })
              }
              placeholder="Internal notes about this chargeback..."
            />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} variant="destructive">
              {isSubmitting ? "Creating Chargeback..." : "Create Chargeback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
