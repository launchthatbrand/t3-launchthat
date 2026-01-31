"use client";

import * as React from "react";
import { useMutation, useQuery } from "convex/react";
import type { ColumnDefinition, EntityAction } from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

type ProductStatus = "published" | "draft" | "archived";
type ProductType = "simple" | "external" | "grouped" | "simple_subscription";
type StockStatus = "instock" | "outofstock" | "onbackorder";

const formatDate = (ts: number | null): string => {
  if (!ts || !Number.isFinite(ts)) return "—";
  return new Date(ts).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const parseNumberOrNull = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
};

const parseIntegerOrNull = (value: string): number | null => {
  const parsed = parseNumberOrNull(value);
  return parsed === null ? null : Math.trunc(parsed);
};

const parseMoneyToCents = (value: string): number | null => {
  const parsed = parseNumberOrNull(value);
  if (parsed === null) return null;
  if (parsed < 0) return null;
  return Math.round(parsed * 100);
};

const normalizeStringOrNull = (value: string): string | null => {
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
};

const serializeFeatureList = (value: string): string | null => {
  const rows = value
    .split("\n")
    .map((row) => row.trim())
    .filter(Boolean);
  return rows.length > 0 ? JSON.stringify(rows) : null;
};

type ProductRow = {
  _id: string;
  title?: string;
  status?: string;
  createdAt?: number;
  updatedAt?: number;
};

export function EcommerceProductsPage(props: {
  organizationId?: string | null;
  listProducts: unknown;
  createProduct: unknown;
  limit?: number;
  status?: ProductStatus;
  onRowClick?: (row: ProductRow) => void;
  onCreated?: (id: string) => void;
}) {
  const organizationId =
    typeof props.organizationId === "string" ? props.organizationId : undefined;
  const limit = typeof props.limit === "number" ? props.limit : 100;
  const listProducts = props.listProducts as any;
  const createProduct = useMutation(props.createProduct as any) as (args: any) => Promise<string>;

  const products = useQuery(listProducts, {
    organizationId,
    limit,
    ...(props.status ? { status: props.status } : {}),
  }) as ProductRow[] | undefined;

  const rows = Array.isArray(products) ? products : [];

  const columns = React.useMemo<ColumnDefinition<ProductRow>[]>(
    () => [
      {
        id: "product",
        header: "Product",
        accessorKey: "title",
        cell: (row: ProductRow) => (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{row.title || "Product"}</div>
            <div className="text-muted-foreground text-xs">
              Updated{" "}
              {formatDate(
                typeof row.updatedAt === "number" ? row.updatedAt : null,
              )}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        header: "Status",
        accessorKey: "status",
        cell: (row: ProductRow) => (
          <Badge variant="outline" className="uppercase">
            {row.status || "unknown"}
          </Badge>
        ),
      },
    ],
    [],
  );

  const entityActions = React.useMemo<EntityAction<ProductRow>[]>(
    () =>
      props.onRowClick
        ? [
            {
              id: "view",
              label: "View",
              onClick: (row: ProductRow) => props.onRowClick?.(row),
            },
          ]
        : [],
    [props],
  );

  const [createOpen, setCreateOpen] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [status, setStatus] = React.useState<ProductStatus>("published");
  const [productType, setProductType] = React.useState<ProductType>("simple");
  const [isVirtual, setIsVirtual] = React.useState(false);
  const [requiresAccount, setRequiresAccount] = React.useState(false);
  const [regularPrice, setRegularPrice] = React.useState("");
  const [salePrice, setSalePrice] = React.useState("");
  const [saleStartAt, setSaleStartAt] = React.useState("");
  const [saleEndAt, setSaleEndAt] = React.useState("");
  const [subscriptionAmountMonthly, setSubscriptionAmountMonthly] = React.useState("");
  const [subscriptionSetupFee, setSubscriptionSetupFee] = React.useState("");
  const [subscriptionTrialDays, setSubscriptionTrialDays] = React.useState("");
  const [sku, setSku] = React.useState("");
  const [stockStatus, setStockStatus] = React.useState<StockStatus>("instock");
  const [manageStock, setManageStock] = React.useState(false);
  const [stockQuantity, setStockQuantity] = React.useState("");
  const [weight, setWeight] = React.useState("");
  const [length, setLength] = React.useState("");
  const [width, setWidth] = React.useState("");
  const [height, setHeight] = React.useState("");
  const [upsells, setUpsells] = React.useState("");
  const [crossSells, setCrossSells] = React.useState("");
  const [attributesJson, setAttributesJson] = React.useState("");
  const [featuresText, setFeaturesText] = React.useState("");
  const [purchaseNote, setPurchaseNote] = React.useState("");
  const [enableReviews, setEnableReviews] = React.useState(false);
  const [menuOrder, setMenuOrder] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const resetForm = () => {
    setTitle("");
    setStatus("published");
    setProductType("simple");
    setIsVirtual(false);
    setRequiresAccount(false);
    setRegularPrice("");
    setSalePrice("");
    setSaleStartAt("");
    setSaleEndAt("");
    setSubscriptionAmountMonthly("");
    setSubscriptionSetupFee("");
    setSubscriptionTrialDays("");
    setSku("");
    setStockStatus("instock");
    setManageStock(false);
    setStockQuantity("");
    setWeight("");
    setLength("");
    setWidth("");
    setHeight("");
    setUpsells("");
    setCrossSells("");
    setAttributesJson("");
    setFeaturesText("");
    setPurchaseNote("");
    setEnableReviews(false);
    setMenuOrder("");
  };

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Enter a product title.");
      return;
    }
    const meta: Record<string, string | number | boolean | null> = {
      "product.type": productType,
      "product.isVirtual": isVirtual,
      "product.requireAccount": requiresAccount,
      "product.regularPrice": parseNumberOrNull(regularPrice),
      "product.salePrice": parseNumberOrNull(salePrice),
      "product.saleStartAt": normalizeStringOrNull(saleStartAt),
      "product.saleEndAt": normalizeStringOrNull(saleEndAt),
      "product.subscription.amountMonthly": parseMoneyToCents(
        subscriptionAmountMonthly,
      ),
      "product.subscription.setupFee": parseMoneyToCents(subscriptionSetupFee),
      "product.subscription.trialDays": parseIntegerOrNull(subscriptionTrialDays),
      "product.subscription.interval":
        productType === "simple_subscription" ? "month" : null,
      "product.sku": normalizeStringOrNull(sku),
      "product.stockStatus": stockStatus,
      "product.manageStock": manageStock,
      "product.stockQuantity": parseIntegerOrNull(stockQuantity),
      "product.weight": parseNumberOrNull(weight),
      "product.length": parseNumberOrNull(length),
      "product.width": parseNumberOrNull(width),
      "product.height": parseNumberOrNull(height),
      "product.upsells": normalizeStringOrNull(upsells),
      "product.crossSells": normalizeStringOrNull(crossSells),
      "product.attributesJson": normalizeStringOrNull(attributesJson),
      "product.features": serializeFeatureList(featuresText),
      "product.purchaseNote": normalizeStringOrNull(purchaseNote),
      "product.enableReviews": enableReviews,
      "product.menuOrder": parseIntegerOrNull(menuOrder),
    };

    setSaving(true);
    try {
      const id = await createProduct({ organizationId, title, status, meta });
      toast.success("Product created.");
      resetForm();
      setCreateOpen(false);
      props.onCreated?.(id);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create product.";
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <CardHeader className="border-b p-4">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base">Products</CardTitle>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <Button type="button" onClick={() => setCreateOpen(true)}>
                Add product
              </Button>
              <DialogContent className="max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create product</DialogTitle>
                </DialogHeader>
                <div className="space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-title">Title</Label>
                      <Input
                        id="product-title"
                        value={title}
                        onChange={(e) => setTitle(e.currentTarget.value)}
                        placeholder="Monthly Pro"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-status">Status</Label>
                      <select
                        id="product-status"
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        value={status}
                        onChange={(e) =>
                          setStatus(e.currentTarget.value as ProductStatus)
                        }
                      >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-type">Product type</Label>
                      <select
                        id="product-type"
                        className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                        value={productType}
                        onChange={(e) =>
                          setProductType(e.currentTarget.value as ProductType)
                        }
                      >
                        <option value="simple">Simple product</option>
                        <option value="simple_subscription">Simple subscription</option>
                        <option value="external">External / affiliate</option>
                        <option value="grouped">Grouped product</option>
                      </select>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <Label htmlFor="product-virtual" className="text-sm">
                          Virtual product
                        </Label>
                        <Switch
                          id="product-virtual"
                          checked={isVirtual}
                          onCheckedChange={setIsVirtual}
                        />
                      </div>
                      <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                        <Label htmlFor="product-requires-account" className="text-sm">
                          Require account
                        </Label>
                        <Switch
                          id="product-requires-account"
                          checked={requiresAccount}
                          onCheckedChange={setRequiresAccount}
                        />
                      </div>
                    </div>
                  </div>

                  {productType === "simple_subscription" ? (
                    <div className="space-y-4">
                      <div className="text-sm font-semibold">Subscription pricing</div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="product-subscription-amount">
                            Amount per month ($)
                          </Label>
                          <Input
                            id="product-subscription-amount"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={subscriptionAmountMonthly}
                            onChange={(e) =>
                              setSubscriptionAmountMonthly(e.currentTarget.value)
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-subscription-setup">
                            Setup fee ($)
                          </Label>
                          <Input
                            id="product-subscription-setup"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={subscriptionSetupFee}
                            onChange={(e) =>
                              setSubscriptionSetupFee(e.currentTarget.value)
                            }
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-subscription-trial">
                          Trial days
                        </Label>
                        <Input
                          id="product-subscription-trial"
                          type="number"
                          inputMode="numeric"
                          value={subscriptionTrialDays}
                          onChange={(e) =>
                            setSubscriptionTrialDays(e.currentTarget.value)
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="text-sm font-semibold">Pricing</div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="product-regular-price">
                            Regular price ($)
                          </Label>
                          <Input
                            id="product-regular-price"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={regularPrice}
                            onChange={(e) => setRegularPrice(e.currentTarget.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-sale-price">Sale price ($)</Label>
                          <Input
                            id="product-sale-price"
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            value={salePrice}
                            onChange={(e) => setSalePrice(e.currentTarget.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="product-sale-start">
                            Sale schedule (start)
                          </Label>
                          <Input
                            id="product-sale-start"
                            type="datetime-local"
                            value={saleStartAt}
                            onChange={(e) => setSaleStartAt(e.currentTarget.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="product-sale-end">
                            Sale schedule (end)
                          </Label>
                          <Input
                            id="product-sale-end"
                            type="datetime-local"
                            value={saleEndAt}
                            onChange={(e) => setSaleEndAt(e.currentTarget.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <div className="text-sm font-semibold">Inventory</div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-sku">SKU</Label>
                        <Input
                          id="product-sku"
                          value={sku}
                          onChange={(e) => setSku(e.currentTarget.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-stock-status">Stock status</Label>
                        <select
                          id="product-stock-status"
                          className="border-input bg-background h-10 w-full rounded-md border px-3 text-sm"
                          value={stockStatus}
                          onChange={(e) =>
                            setStockStatus(e.currentTarget.value as StockStatus)
                          }
                        >
                          <option value="instock">In stock</option>
                          <option value="outofstock">Out of stock</option>
                          <option value="onbackorder">On backorder</option>
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <Label htmlFor="product-manage-stock" className="text-sm">
                        Manage stock
                      </Label>
                      <Switch
                        id="product-manage-stock"
                        checked={manageStock}
                        onCheckedChange={setManageStock}
                      />
                    </div>
                    {manageStock ? (
                      <div className="space-y-2">
                        <Label htmlFor="product-stock-quantity">Stock quantity</Label>
                        <Input
                          id="product-stock-quantity"
                          type="number"
                          inputMode="numeric"
                          value={stockQuantity}
                          onChange={(e) => setStockQuantity(e.currentTarget.value)}
                        />
                      </div>
                    ) : null}
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold">Shipping</div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-weight">Weight</Label>
                        <Input
                          id="product-weight"
                          type="number"
                          inputMode="decimal"
                          value={weight}
                          onChange={(e) => setWeight(e.currentTarget.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-length">Length</Label>
                        <Input
                          id="product-length"
                          type="number"
                          inputMode="decimal"
                          value={length}
                          onChange={(e) => setLength(e.currentTarget.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-width">Width</Label>
                        <Input
                          id="product-width"
                          type="number"
                          inputMode="decimal"
                          value={width}
                          onChange={(e) => setWidth(e.currentTarget.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-height">Height</Label>
                        <Input
                          id="product-height"
                          type="number"
                          inputMode="decimal"
                          value={height}
                          onChange={(e) => setHeight(e.currentTarget.value)}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold">Upsells & cross-sells</div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="product-upsells">Upsells</Label>
                        <Input
                          id="product-upsells"
                          value={upsells}
                          onChange={(e) => setUpsells(e.currentTarget.value)}
                          placeholder="Comma-separated product IDs"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="product-cross-sells">Cross-sells</Label>
                        <Input
                          id="product-cross-sells"
                          value={crossSells}
                          onChange={(e) => setCrossSells(e.currentTarget.value)}
                          placeholder="Comma-separated product IDs"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold">Attributes & features</div>
                    <div className="space-y-2">
                      <Label htmlFor="product-attributes-json">Attributes JSON</Label>
                      <Textarea
                        id="product-attributes-json"
                        value={attributesJson}
                        onChange={(e) => setAttributesJson(e.currentTarget.value)}
                        placeholder='{"level": "pro"}'
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-features">Features (one per line)</Label>
                      <Textarea
                        id="product-features"
                        value={featuresText}
                        onChange={(e) => setFeaturesText(e.currentTarget.value)}
                        rows={4}
                        placeholder="Priority support"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="text-sm font-semibold">Notes & reviews</div>
                    <div className="space-y-2">
                      <Label htmlFor="product-purchase-note">Purchase note</Label>
                      <Textarea
                        id="product-purchase-note"
                        value={purchaseNote}
                        onChange={(e) => setPurchaseNote(e.currentTarget.value)}
                        rows={3}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
                      <Label htmlFor="product-enable-reviews" className="text-sm">
                        Enable reviews
                      </Label>
                      <Switch
                        id="product-enable-reviews"
                        checked={enableReviews}
                        onCheckedChange={setEnableReviews}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-menu-order">Menu order</Label>
                      <Input
                        id="product-menu-order"
                        type="number"
                        inputMode="numeric"
                        value={menuOrder}
                        onChange={(e) => setMenuOrder(e.currentTarget.value)}
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="button" onClick={handleCreate} disabled={saving}>
                    Create
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-3">
          <EntityList
            data={rows}
            columns={columns}
            isLoading={products === undefined}
            defaultViewMode="list"
            viewModes={["list"]}
            enableSearch={true}
            entityActions={entityActions}
            onRowClick={props.onRowClick}
            getRowId={(row) => row._id}
            emptyState={
              <div className="text-muted-foreground text-sm">No products yet.</div>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
