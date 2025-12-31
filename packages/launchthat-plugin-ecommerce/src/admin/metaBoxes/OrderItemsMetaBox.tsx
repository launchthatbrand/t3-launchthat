"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";

type OrderLineItem = {
  productId: string;
  title: string;
  unitPrice: number;
  quantity: number;
};

type PostMetaEntry = { key?: string; value?: unknown };

const ITEMS_JSON_KEY = "order.itemsJson";
const ITEMS_SUBTOTAL_KEY = "order.itemsSubtotal";
const ORDER_TOTAL_KEY = "order.orderTotal";
const COUPON_CODE_KEY = "order.couponCode";
const CURRENCY_KEY = "order.currency";
const PRODUCT_REGULAR_PRICE_KEY = "product.regularPrice";

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const asNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const formatMoney = (amount: number, currency: string): string => {
  const safe = Number.isFinite(amount) ? amount : 0;
  // Basic formatting; can be upgraded to Intl.NumberFormat when we add multi-currency rules.
  const symbol = currency.toUpperCase() === "USD" ? "$" : `${currency.toUpperCase()} `;
  return `${symbol}${safe.toFixed(2)}`;
};

const safeParseItems = (raw: unknown): Array<OrderLineItem> => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((v): OrderLineItem | null => {
        if (!v || typeof v !== "object") return null;
        const obj = v as Record<string, unknown>;
        const productId = typeof obj.productId === "string" ? obj.productId : "";
        const title = typeof obj.title === "string" ? obj.title : "";
        const unitPrice = asNumber(obj.unitPrice);
        const quantity = Math.max(0, Math.floor(asNumber(obj.quantity)));
        if (!productId) return null;
        return { productId, title: title || "Untitled product", unitPrice, quantity };
      })
      .filter((v): v is OrderLineItem => Boolean(v));
  } catch {
    return [];
  }
};

export function OrderItemsMetaBox({
  context,
  getValue,
  setValue,
}: PluginMetaBoxRendererProps) {
  const canEdit = Boolean(context.postId) || context.isNewRecord;
  const organizationId = context.organizationId;

  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedQuantity, setSelectedQuantity] = useState<string>("1");

  const currency = useMemo(() => {
    const raw = asString(getValue(CURRENCY_KEY)).trim();
    return raw.length > 0 ? raw : "USD";
  }, [getValue]);

  const items = useMemo<Array<OrderLineItem>>(() => {
    return safeParseItems(getValue(ITEMS_JSON_KEY));
  }, [getValue]);

  const productsForOrg = useQuery(
    (api.plugins.commerce as any).getAllPosts,
    {
      organizationId: organizationId ?? undefined,
      filters: { postTypeSlug: "products", limit: 200 },
    },
  ) as any[] | undefined;

  const productsAllOrgs = useQuery(
    (api.plugins.commerce as any).getAllPosts,
    { filters: { postTypeSlug: "products", limit: 200 } },
  ) as any[] | undefined;

  const products = useMemo(() => {
    if (Array.isArray(productsForOrg) && productsForOrg.length > 0) return productsForOrg;
    if (!organizationId) return productsAllOrgs;
    return productsForOrg;
  }, [organizationId, productsAllOrgs, productsForOrg]);

  const productOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (products ?? [])
      .map((p) => ({
        id: String((p as any)?._id ?? ""),
        title: String((p as any)?.title ?? "Untitled product"),
        // meta from component posts may not be inlined, so price is optional
        regularPrice: asNumber((p as any)?.meta?.["product.regularPrice"]),
      }))
      .filter((p) => p.id.length > 0)
      .filter((p) => (!term ? true : p.title.toLowerCase().includes(term)))
      .sort((a, b) => a.title.localeCompare(b.title))
      .slice(0, 50);
  }, [products, search]);

  const selectedProduct = useMemo(() => {
    if (!selectedProductId) return null;
    return productOptions.find((p) => p.id === selectedProductId) ?? null;
  }, [productOptions, selectedProductId]);

  const selectedProductMeta = useQuery(
    (api.plugins.commerce as any).getPostMeta,
    selectedProductId
      ? { postId: selectedProductId, organizationId: organizationId ?? undefined }
      : "skip",
  ) as PostMetaEntry[] | undefined;

  const selectedProductRegularPrice = useMemo(() => {
    if (!Array.isArray(selectedProductMeta)) return 0;
    const map = new Map<string, unknown>();
    selectedProductMeta.forEach((entry) => {
      const k = typeof entry?.key === "string" ? entry.key : "";
      if (!k) return;
      map.set(k, entry.value);
    });
    return asNumber(map.get(PRODUCT_REGULAR_PRICE_KEY));
  }, [selectedProductMeta]);

  const itemsSubtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [items]);

  const storedSubtotal = useMemo(() => asNumber(getValue(ITEMS_SUBTOTAL_KEY)), [getValue]);
  const storedTotal = useMemo(() => asNumber(getValue(ORDER_TOTAL_KEY)), [getValue]);

  const effectiveSubtotal = storedSubtotal || itemsSubtotal;
  const effectiveTotal = storedTotal || effectiveSubtotal;

  const handlePersistItems = useCallback(
    (nextItems: Array<OrderLineItem>) => {
      setValue(ITEMS_JSON_KEY, JSON.stringify(nextItems));
    },
    [setValue],
  );

  const handleAddSelected = useCallback(() => {
    if (!selectedProduct) return;
    const quantity = Math.max(1, Math.floor(asNumber(selectedQuantity)));
    const unitPrice = selectedProductRegularPrice || selectedProduct.regularPrice || 0;

    handlePersistItems([
      ...items,
      {
        productId: selectedProduct.id,
        title: selectedProduct.title,
        unitPrice,
        quantity,
      },
    ]);

    setSelectedProductId("");
    setSelectedQuantity("1");
    setSearch("");
  }, [
    handlePersistItems,
    items,
    selectedProduct,
    selectedProductRegularPrice,
    selectedQuantity,
    setSelectedProductId,
    setSelectedQuantity,
    setSearch,
  ]);

  const handleRemoveItem = useCallback(
    (idx: number) => {
      handlePersistItems(items.filter((_, i) => i !== idx));
    },
    [handlePersistItems, items],
  );

  const handleUpdateItem = useCallback(
    (idx: number, patch: Partial<OrderLineItem>) => {
      const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
      handlePersistItems(next);
    },
    [handlePersistItems, items],
  );

  const handleRecalculate = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    setValue(ITEMS_SUBTOTAL_KEY, subtotal);
    setValue(ORDER_TOTAL_KEY, subtotal);
    if (!asString(getValue(CURRENCY_KEY)).trim()) {
      setValue(CURRENCY_KEY, currency);
    }
  }, [currency, getValue, items, setValue]);

  // If user edits line items, keep totals “stale” unless they explicitly recalc.
  // But if totals are empty, seed them once.
  useEffect(() => {
    if (!canEdit) return;
    const hasTotals =
      asString(getValue(ITEMS_SUBTOTAL_KEY)).trim().length > 0 ||
      asString(getValue(ORDER_TOTAL_KEY)).trim().length > 0;
    if (!hasTotals && items.length > 0) {
      handleRecalculate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canEdit, items.length]);

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="grid grid-cols-12 gap-2 border-b bg-muted/20 px-3 py-2 text-sm font-medium">
          <div className="col-span-6">Item</div>
          <div className="col-span-2 text-right">Price</div>
          <div className="col-span-2 text-right">Qty</div>
          <div className="col-span-2 text-right">Total</div>
        </div>

        {items.length === 0 ? (
          <div className="text-muted-foreground px-3 py-6 text-sm">
            No items yet. Add a product below.
          </div>
        ) : (
          <div className="divide-y">
            {items.map((item, idx) => {
              const lineTotal = item.unitPrice * item.quantity;
              return (
                <div
                  key={`${item.productId}-${idx}`}
                  className="grid grid-cols-12 items-center gap-2 px-3 py-2"
                >
                  <div className="col-span-6">
                    <div className="truncate text-sm font-medium">{item.title}</div>
                    <div className="text-muted-foreground text-xs">
                      Product ID: {item.productId}
                    </div>
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <Input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      className="h-8 w-24 text-right"
                      value={String(item.unitPrice)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdateItem(idx, {
                          unitPrice: asNumber(e.currentTarget.value),
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="col-span-2 flex justify-end">
                    <Input
                      type="number"
                      inputMode="numeric"
                      step="1"
                      className="h-8 w-20 text-right"
                      value={String(item.quantity)}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleUpdateItem(idx, {
                          quantity: Math.max(1, Math.floor(asNumber(e.currentTarget.value))),
                        })
                      }
                      disabled={!canEdit}
                    />
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2">
                    <div className="w-24 text-right text-sm font-semibold">
                      {formatMoney(lineTotal, currency)}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleRemoveItem(idx)}
                      disabled={!canEdit}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="order-items-search">Add item(s)</Label>
            <Input
              id="order-items-search"
              value={search}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSearch(e.currentTarget.value)
              }
              placeholder="Search products…"
              disabled={!canEdit}
            />
            {search.trim().length > 0 ? (
              <div className="max-h-44 overflow-y-auto rounded-md border">
                {productOptions.length === 0 ? (
                  <div className="text-muted-foreground px-3 py-2 text-sm">
                    No matching products.
                  </div>
                ) : (
                  productOptions.map((p) => {
                    const selected = p.id === selectedProductId;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        className={[
                          "flex w-full items-center justify-between px-3 py-2 text-left text-sm",
                          "hover:bg-muted/60",
                          selected ? "bg-muted/60" : "",
                        ].join(" ")}
                        onClick={() => setSelectedProductId(p.id)}
                        disabled={!canEdit}
                      >
                        <span className="truncate">{p.title}</span>
                        <span className="text-muted-foreground ml-3 shrink-0 text-xs">
                          {p.regularPrice ? formatMoney(p.regularPrice, currency) : ""}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="order-items-qty">Qty</Label>
            <Input
              id="order-items-qty"
              type="number"
              inputMode="numeric"
              step="1"
              value={selectedQuantity}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setSelectedQuantity(e.currentTarget.value)
              }
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleAddSelected}
            disabled={!canEdit || !selectedProductId}
          >
            Add item(s)
          </Button>

          <div className="flex items-center gap-2">
            <Input
              className="h-9 w-44"
              placeholder="Coupon code"
              value={asString(getValue(COUPON_CODE_KEY))}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setValue(COUPON_CODE_KEY, e.currentTarget.value.trim() || null)
              }
              disabled={!canEdit}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                // Placeholder: coupon application will be implemented once checkout rules exist.
                handleRecalculate();
              }}
              disabled={!canEdit}
            >
              Apply coupon
            </Button>
          </div>

          <Button type="button" onClick={handleRecalculate} disabled={!canEdit}>
            Recalculate
          </Button>
        </div>
      </div>

      <div className="flex justify-end">
        <div className="w-full max-w-sm space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Items Subtotal:</span>
            <span className="font-semibold">{formatMoney(effectiveSubtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Order Total:</span>
            <span className="font-semibold">{formatMoney(effectiveTotal, currency)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}


