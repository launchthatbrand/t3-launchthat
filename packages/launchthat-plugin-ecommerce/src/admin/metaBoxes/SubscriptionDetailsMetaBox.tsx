"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useMemo } from "react";

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

type SubscriptionStatus =
  | "pending"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled";

const SUBSCRIPTION_STATUS_OPTIONS: Array<{
  label: string;
  value: SubscriptionStatus;
}> = [
  { label: "Pending", value: "pending" },
  { label: "Trialing", value: "trialing" },
  { label: "Active", value: "active" },
  { label: "Past due", value: "past_due" },
  { label: "Canceled", value: "canceled" },
];

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const asNumber = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) ? value : null;

const centsToDollarsString = (cents: unknown): string => {
  const n = asNumber(cents);
  if (n === null) return "";
  return (n / 100).toFixed(2);
};

const formatMsAsLocalDateTime = (ms: unknown): string => {
  const n = asNumber(ms);
  if (n === null) return "";
  try {
    const d = new Date(n);
    // YYYY-MM-DDTHH:mm for <input type="datetime-local">
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
};

const parseLocalDateTimeToMs = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const ms = Date.parse(trimmed);
  return Number.isFinite(ms) ? ms : null;
};

export function SubscriptionDetailsMetaBox({
  context,
  getValue,
  setValue,
}: PluginMetaBoxRendererProps) {
  const canEdit = Boolean(context.postId) || context.isNewRecord;

  const status = useMemo<SubscriptionStatus>(() => {
    const raw = asString(getValue("subscription.status")) as SubscriptionStatus;
    return SUBSCRIPTION_STATUS_OPTIONS.some((opt) => opt.value === raw)
      ? raw
      : "pending";
  }, [getValue]);

  const gateway = asString(getValue("subscription.gateway"));
  const authnetSubscriptionId = asString(getValue("subscription.authnet.subscriptionId"));
  const authnetCustomerProfileId = asString(
    getValue("subscription.authnet.customerProfileId"),
  );
  const authnetCustomerPaymentProfileId = asString(
    getValue("subscription.authnet.customerPaymentProfileId"),
  );

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subscription-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value: string) =>
              setValue("subscription.status", value as SubscriptionStatus)
            }
            disabled={!canEdit}
          >
            <SelectTrigger id="subscription-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {SUBSCRIPTION_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-customer-email">Customer email</Label>
          <Input
            id="subscription-customer-email"
            value={asString(getValue("subscription.customerEmail"))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.customerEmail",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="customer@example.com"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-customer-user-id">Customer user id</Label>
          <Input
            id="subscription-customer-user-id"
            value={asString(getValue("subscription.customerUserId"))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.customerUserId",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="Convex userId or Clerk userId"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-product-id">Product id</Label>
          <Input
            id="subscription-product-id"
            value={asString(getValue("subscription.productId"))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.productId",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="Product post id"
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subscription-amount">Amount monthly ($)</Label>
            <Input
              id="subscription-amount"
              value={centsToDollarsString(getValue("subscription.amountMonthly"))}
              disabled
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscription-currency">Currency</Label>
            <Input
              id="subscription-currency"
              value={asString(getValue("subscription.currency")) || "USD"}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  "subscription.currency",
                  e.currentTarget.value.trim().toUpperCase() || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="subscription-period-start">Current period start</Label>
            <Input
              id="subscription-period-start"
              type="datetime-local"
              value={formatMsAsLocalDateTime(
                getValue("subscription.currentPeriodStart"),
              )}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  "subscription.currentPeriodStart",
                  parseLocalDateTimeToMs(e.currentTarget.value),
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subscription-period-end">Current period end</Label>
            <Input
              id="subscription-period-end"
              type="datetime-local"
              value={formatMsAsLocalDateTime(
                getValue("subscription.currentPeriodEnd"),
              )}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  "subscription.currentPeriodEnd",
                  parseLocalDateTimeToMs(e.currentTarget.value),
                )
              }
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-last-order-id">Last order id</Label>
          <Input
            id="subscription-last-order-id"
            value={asString(getValue("subscription.lastOrderId"))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.lastOrderId",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="Order post id"
            disabled={!canEdit}
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="subscription-gateway">Gateway</Label>
          <Input
            id="subscription-gateway"
            value={gateway}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.gateway",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="authorizenet"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authnet-subscription-id">Authorize.Net ARB subscription id</Label>
          <Input
            id="authnet-subscription-id"
            value={authnetSubscriptionId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.authnet.subscriptionId",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="ARB subscription id"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authnet-customer-profile-id">Authorize.Net customer profile id</Label>
          <Input
            id="authnet-customer-profile-id"
            value={authnetCustomerProfileId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.authnet.customerProfileId",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="customerProfileId"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="authnet-payment-profile-id">
            Authorize.Net customer payment profile id
          </Label>
          <Input
            id="authnet-payment-profile-id"
            value={authnetCustomerPaymentProfileId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                "subscription.authnet.customerPaymentProfileId",
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="customerPaymentProfileId"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subscription-notes">Notes</Label>
          <Textarea
            id="subscription-notes"
            value={asString(getValue("subscription.notes"))}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setValue("subscription.notes", e.currentTarget.value || null)
            }
            placeholder="Internal notes"
            disabled={!canEdit}
          />
        </div>
      </div>
    </div>
  );
}


