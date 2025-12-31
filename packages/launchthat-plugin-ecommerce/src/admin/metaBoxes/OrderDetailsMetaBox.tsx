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

type OrderStatus =
  | "pending"
  | "processing"
  | "completed"
  | "cancelled"
  | "refunded"
  | "failed";

const ORDER_STATUS_OPTIONS: Array<{ label: string; value: OrderStatus }> = [
  { label: "Pending payment", value: "pending" },
  { label: "Processing", value: "processing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Refunded", value: "refunded" },
  { label: "Failed", value: "failed" },
];

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const fieldKey = (
  scope: "order" | "billing" | "shipping",
  key: string,
): string => `${scope}.${key}`;

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </div>
  );
};

export function OrderDetailsMetaBox({
  context,
  getValue,
  setValue,
}: PluginMetaBoxRendererProps) {
  const canEdit = Boolean(context.postId) || context.isNewRecord;

  const status = useMemo<OrderStatus>(() => {
    const raw = asString(getValue(fieldKey("order", "status"))) as OrderStatus;
    return ORDER_STATUS_OPTIONS.some((opt) => opt.value === raw)
      ? raw
      : "pending";
  }, [getValue]);

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Section title="General">
        <div className="space-y-2">
          <Label htmlFor="order-created-at">Date created</Label>
          <Input
            id="order-created-at"
            type="datetime-local"
            value={asString(getValue(fieldKey("order", "createdAt")))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                fieldKey("order", "createdAt"),
                e.currentTarget.value || null,
              )
            }
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-status">Status</Label>
          <Select
            value={status}
            onValueChange={(value: string) =>
              setValue(fieldKey("order", "status"), value as OrderStatus)
            }
            disabled={!canEdit}
          >
            <SelectTrigger id="order-status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-customer">Customer (email)</Label>
          <Input
            id="order-customer"
            value={asString(getValue(fieldKey("order", "customerEmail")))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                fieldKey("order", "customerEmail"),
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="customer@example.com"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-payment">Payment method</Label>
          <Input
            id="order-payment"
            value={asString(getValue(fieldKey("order", "paymentMethod")))}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setValue(
                fieldKey("order", "paymentMethod"),
                e.currentTarget.value.trim() || null,
              )
            }
            placeholder="e.g. Coinbase Commerce, Stripe"
            disabled={!canEdit}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="order-notes">Order notes</Label>
          <Textarea
            id="order-notes"
            rows={4}
            value={asString(getValue(fieldKey("order", "notes")))}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setValue(
                fieldKey("order", "notes"),
                e.currentTarget.value || null,
              )
            }
            placeholder="Internal notes…"
            disabled={!canEdit}
          />
        </div>
      </Section>

      <Section title="Billing">
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="billing-name">Name</Label>
            <Input
              id="billing-name"
              value={asString(getValue(fieldKey("billing", "name")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("billing", "name"),
                  e.currentTarget.value.trim() || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-email">Email address</Label>
            <Input
              id="billing-email"
              value={asString(getValue(fieldKey("billing", "email")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("billing", "email"),
                  e.currentTarget.value.trim() || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-phone">Phone</Label>
            <Input
              id="billing-phone"
              value={asString(getValue(fieldKey("billing", "phone")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("billing", "phone"),
                  e.currentTarget.value.trim() || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-address1">Address line 1</Label>
            <Input
              id="billing-address1"
              value={asString(getValue(fieldKey("billing", "address1")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("billing", "address1"),
                  e.currentTarget.value || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="billing-address2">Address line 2</Label>
            <Input
              id="billing-address2"
              value={asString(getValue(fieldKey("billing", "address2")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("billing", "address2"),
                  e.currentTarget.value || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billing-city">City</Label>
              <Input
                id="billing-city"
                value={asString(getValue(fieldKey("billing", "city")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("billing", "city"),
                    e.currentTarget.value || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-state">State</Label>
              <Input
                id="billing-state"
                value={asString(getValue(fieldKey("billing", "state")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("billing", "state"),
                    e.currentTarget.value || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="billing-postcode">Postcode</Label>
              <Input
                id="billing-postcode"
                value={asString(getValue(fieldKey("billing", "postcode")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("billing", "postcode"),
                    e.currentTarget.value.trim() || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-country">Country</Label>
              <Input
                id="billing-country"
                value={asString(getValue(fieldKey("billing", "country")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("billing", "country"),
                    e.currentTarget.value.trim() || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </Section>

      <Section title="Shipping">
        <div className="grid gap-3">
          <div className="space-y-2">
            <Label htmlFor="shipping-name">Name</Label>
            <Input
              id="shipping-name"
              value={asString(getValue(fieldKey("shipping", "name")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("shipping", "name"),
                  e.currentTarget.value.trim() || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-phone">Phone</Label>
            <Input
              id="shipping-phone"
              value={asString(getValue(fieldKey("shipping", "phone")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("shipping", "phone"),
                  e.currentTarget.value.trim() || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-address1">Address line 1</Label>
            <Input
              id="shipping-address1"
              value={asString(getValue(fieldKey("shipping", "address1")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("shipping", "address1"),
                  e.currentTarget.value || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="shipping-address2">Address line 2</Label>
            <Input
              id="shipping-address2"
              value={asString(getValue(fieldKey("shipping", "address2")))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(
                  fieldKey("shipping", "address2"),
                  e.currentTarget.value || null,
                )
              }
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipping-city">City</Label>
              <Input
                id="shipping-city"
                value={asString(getValue(fieldKey("shipping", "city")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("shipping", "city"),
                    e.currentTarget.value || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-state">State</Label>
              <Input
                id="shipping-state"
                value={asString(getValue(fieldKey("shipping", "state")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("shipping", "state"),
                    e.currentTarget.value || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="shipping-postcode">Postcode</Label>
              <Input
                id="shipping-postcode"
                value={asString(getValue(fieldKey("shipping", "postcode")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("shipping", "postcode"),
                    e.currentTarget.value.trim() || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="shipping-country">Country</Label>
              <Input
                id="shipping-country"
                value={asString(getValue(fieldKey("shipping", "country")))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setValue(
                    fieldKey("shipping", "country"),
                    e.currentTarget.value.trim() || null,
                  )
                }
                disabled={!canEdit}
              />
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
