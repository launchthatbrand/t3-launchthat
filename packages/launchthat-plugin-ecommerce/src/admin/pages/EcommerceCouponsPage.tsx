"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import React, { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { toast } from "@acme/ui/toast";

type CouponKind = "percent" | "fixed";

const normalizeCouponCode = (value: string): string =>
  value.trim().toUpperCase().replace(/\\s+/g, "");

export function EcommerceCouponsPage(props: {
  organizationId?: string | null;
  listDiscountCodes: unknown;
  createDiscountCode: unknown;
  updateDiscountCode: unknown;
  deleteDiscountCode: unknown;
}) {
  const organizationId =
    typeof props.organizationId === "string" ? props.organizationId : undefined;
  const listDiscountCodes = props.listDiscountCodes as any;
  const createDiscountCode = props.createDiscountCode as any;
  const updateDiscountCode = props.updateDiscountCode as any;
  const deleteDiscountCode = props.deleteDiscountCode as any;

  const coupons = useQuery(
    listDiscountCodes,
    {
      organizationId,
    },
  ) as
    | Array<{
      _id: string;
      code: string;
      kind: CouponKind;
      amount: number;
      active: boolean;
      organizationId: string | null;
      createdAt?: number;
      updatedAt?: number;
    }>
    | undefined;

  const createCoupon = useMutation(createDiscountCode) as (args: any) => Promise<string>;
  const updateCoupon = useMutation(updateDiscountCode) as (args: any) => Promise<null>;
  const deleteCoupon = useMutation(deleteDiscountCode) as (args: any) => Promise<null>;

  const [draftCode, setDraftCode] = useState("");
  const [draftKind, setDraftKind] = useState<CouponKind>("percent");
  const [draftAmount, setDraftAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const sortedCoupons = useMemo(() => {
    const list = Array.isArray(coupons) ? coupons : [];
    return [...list].sort((a, b) => (a.code ?? "").localeCompare(b.code ?? ""));
  }, [coupons]);

  const handleCreate = async () => {
    const code = normalizeCouponCode(draftCode);
    const amount = Number(draftAmount);
    if (!code) {
      toast.error("Enter a coupon code.");
      return;
    }
    if (!Number.isFinite(amount)) {
      toast.error("Enter a valid amount.");
      return;
    }
    if (draftKind === "percent" && (amount < 0 || amount > 100)) {
      toast.error("Percent must be between 0 and 100.");
      return;
    }
    if (draftKind === "fixed" && amount < 0) {
      toast.error("Fixed amount must be >= 0.");
      return;
    }

    setIsSaving(true);
    try {
      await createCoupon({
        organizationId,
        code,
        kind: draftKind,
        amount,
        active: true,
      });
      setDraftCode("");
      setDraftAmount("");
      toast.success("Coupon created.");
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to create coupon.";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="coupon-code">Code</Label>
              <Input
                id="coupon-code"
                value={draftCode}
                onChange={(e) => setDraftCode(e.currentTarget.value)}
                placeholder="SAVE10"
                autoCapitalize="characters"
              />
              <div className="text-muted-foreground text-xs">
                Codes are stored normalized (uppercase, no spaces).
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-kind">Type</Label>
              <select
                id="coupon-kind"
                className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                value={draftKind}
                onChange={(e) =>
                  setDraftKind(e.currentTarget.value as CouponKind)
                }
              >
                <option value="percent">Percent</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="coupon-amount">
                Amount {draftKind === "percent" ? "(0-100)" : "(currency)"}
              </Label>
              <Input
                id="coupon-amount"
                type="number"
                inputMode="decimal"
                value={draftAmount}
                onChange={(e) => setDraftAmount(e.currentTarget.value)}
                placeholder={draftKind === "percent" ? "10" : "25"}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="button" onClick={handleCreate} disabled={isSaving}>
              Add coupon
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing coupons</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {sortedCoupons.length === 0 ? (
            <div className="text-muted-foreground text-sm">No coupons yet.</div>
          ) : (
            <div className="space-y-2">
              {sortedCoupons.map((coupon) => (
                <div
                  key={coupon._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-[220px]">
                    <div className="font-medium">{coupon.code}</div>
                    <div className="text-muted-foreground text-xs">
                      {coupon.kind === "percent"
                        ? `${coupon.amount}% off`
                        : `${coupon.amount} off`}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-xs">
                        Active
                      </span>
                      <Switch
                        checked={coupon.active}
                        onCheckedChange={(checked) => {
                          void updateCoupon({
                            id: coupon._id,
                            active: checked,
                          }).catch(() => {
                            toast.error("Failed to update coupon.");
                          });
                        }}
                      />
                    </div>

                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        if (!confirm(`Delete coupon ${coupon.code}?`)) return;
                        void deleteCoupon({ id: coupon._id })
                          .then(() => toast.success("Coupon deleted."))
                          .catch(() => toast.error("Failed to delete coupon."));
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
