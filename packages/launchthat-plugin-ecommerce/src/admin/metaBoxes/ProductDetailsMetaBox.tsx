"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useCallback, useMemo } from "react";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

type ProductType = "simple" | "external" | "grouped";
type StockStatus = "instock" | "outofstock" | "onbackorder";

const PRODUCT_TYPE_OPTIONS: Array<{ label: string; value: ProductType }> = [
  { label: "Simple product", value: "simple" },
  { label: "External / affiliate", value: "external" },
  { label: "Grouped product", value: "grouped" },
];

const STOCK_STATUS_OPTIONS: Array<{ label: string; value: StockStatus }> = [
  { label: "In stock", value: "instock" },
  { label: "Out of stock", value: "outofstock" },
  { label: "On backorder", value: "onbackorder" },
];

const asString = (value: unknown): string => {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return "";
};

const asBoolean = (value: unknown): boolean => value === true;

export function ProductDetailsMetaBox({
  getValue,
  setValue,
  context,
}: PluginMetaBoxRendererProps) {
  // Allow editing while creating a new record (values will be persisted on first save).
  const canEdit = Boolean(context.postId) || context.isNewRecord;

  const productType = useMemo<ProductType>(() => {
    const value = getValue("product.type");
    const normalized = asString(value) as ProductType;
    return PRODUCT_TYPE_OPTIONS.some((opt) => opt.value === normalized)
      ? normalized
      : "simple";
  }, [getValue]);

  const stockStatus = useMemo<StockStatus>(() => {
    const value = getValue("product.stockStatus");
    const normalized = asString(value) as StockStatus;
    return STOCK_STATUS_OPTIONS.some((opt) => opt.value === normalized)
      ? normalized
      : "instock";
  }, [getValue]);

  const handleSetString = useCallback(
    (key: string, value: string) => {
      setValue(key, value.trim().length > 0 ? value : null);
    },
    [setValue],
  );

  const handleSetNumber = useCallback(
    (key: string, value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setValue(key, null);
        return;
      }
      const parsed = Number(trimmed);
      setValue(key, Number.isFinite(parsed) ? parsed : null);
    },
    [setValue],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <Label className="text-muted-foreground text-xs">Product type</Label>
          <Select
            value={productType}
            onValueChange={(value: string) =>
              setValue("product.type", value as ProductType)
            }
            disabled={!canEdit}
          >
            <SelectTrigger className="w-full md:w-[260px]">
              <SelectValue placeholder="Select product type" />
            </SelectTrigger>
            <SelectContent>
              {PRODUCT_TYPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setValue("product.type", "simple");
              setValue("product.manageStock", false);
              setValue("product.stockStatus", "instock");
            }}
            disabled={!canEdit}
          >
            Reset defaults
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="flex h-9 w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="shipping">Shipping</TabsTrigger>
          <TabsTrigger value="linked">Linked Products</TabsTrigger>
          <TabsTrigger value="attributes">Attributes</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4 pt-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-regular-price">Regular price ($)</Label>
              <Input
                id="product-regular-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={asString(getValue("product.regularPrice"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.regularPrice", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-sale-price">Sale price ($)</Label>
              <Input
                id="product-sale-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={asString(getValue("product.salePrice"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.salePrice", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-sale-start">Sale schedule (start)</Label>
              <Input
                id="product-sale-start"
                type="datetime-local"
                value={asString(getValue("product.saleStartAt"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetString("product.saleStartAt", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-sale-end">Sale schedule (end)</Label>
              <Input
                id="product-sale-end"
                type="datetime-local"
                value={asString(getValue("product.saleEndAt"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetString("product.saleEndAt", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-4 pt-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-sku">SKU</Label>
              <Input
                id="product-sku"
                value={asString(getValue("product.sku"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetString("product.sku", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-stock-status">Stock status</Label>
              <Select
                value={stockStatus}
                onValueChange={(value: string) =>
                  setValue("product.stockStatus", value as StockStatus)
                }
                disabled={!canEdit}
              >
                <SelectTrigger id="product-stock-status">
                  <SelectValue placeholder="Select stock status" />
                </SelectTrigger>
                <SelectContent>
                  {STOCK_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-manage-stock">Manage stock?</Label>
              <Select
                value={
                  asBoolean(getValue("product.manageStock")) ? "yes" : "no"
                }
                onValueChange={(value: string) =>
                  setValue("product.manageStock", value === "yes")
                }
                disabled={!canEdit}
              >
                <SelectTrigger id="product-manage-stock">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-stock-qty">Stock quantity</Label>
              <Input
                id="product-stock-qty"
                type="number"
                inputMode="numeric"
                step="1"
                value={asString(getValue("product.stockQuantity"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber(
                    "product.stockQuantity",
                    e.currentTarget.value,
                  )
                }
                disabled={!canEdit}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="shipping" className="space-y-4 pt-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-weight">Weight</Label>
              <Input
                id="product-weight"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={asString(getValue("product.weight"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.weight", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="product-length">Length</Label>
              <Input
                id="product-length"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={asString(getValue("product.length"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.length", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-width">Width</Label>
              <Input
                id="product-width"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={asString(getValue("product.width"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.width", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-height">Height</Label>
              <Input
                id="product-height"
                type="number"
                inputMode="decimal"
                step="0.01"
                value={asString(getValue("product.height"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.height", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="linked" className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label htmlFor="product-upsells">
              Up-sells (comma-separated IDs/slugs)
            </Label>
            <Textarea
              id="product-upsells"
              rows={3}
              value={asString(getValue("product.upsells"))}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleSetString("product.upsells", e.currentTarget.value)
              }
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="product-cross-sells">
              Cross-sells (comma-separated IDs/slugs)
            </Label>
            <Textarea
              id="product-cross-sells"
              rows={3}
              value={asString(getValue("product.crossSells"))}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleSetString("product.crossSells", e.currentTarget.value)
              }
              disabled={!canEdit}
            />
          </div>
        </TabsContent>

        <TabsContent value="attributes" className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label htmlFor="product-attributes-json">Attributes (JSON)</Label>
            <Textarea
              id="product-attributes-json"
              rows={6}
              value={asString(getValue("product.attributesJson"))}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleSetString("product.attributesJson", e.currentTarget.value)
              }
              placeholder='Example: [{"name":"Size","options":["S","M","L"]}]'
              disabled={!canEdit}
            />
            <p className="text-muted-foreground text-xs">
              Stored as raw JSON in post meta. Keep it small and valid.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4 pt-3">
          <div className="space-y-2">
            <Label htmlFor="product-purchase-note">Purchase note</Label>
            <Textarea
              id="product-purchase-note"
              rows={4}
              value={asString(getValue("product.purchaseNote"))}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                handleSetString("product.purchaseNote", e.currentTarget.value)
              }
              disabled={!canEdit}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="product-enable-reviews">Enable reviews</Label>
              <Select
                value={
                  asBoolean(getValue("product.enableReviews")) ? "yes" : "no"
                }
                onValueChange={(value: string) =>
                  setValue("product.enableReviews", value === "yes")
                }
                disabled={!canEdit}
              >
                <SelectTrigger id="product-enable-reviews">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="no">No</SelectItem>
                  <SelectItem value="yes">Yes</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product-menu-order">Menu order</Label>
              <Input
                id="product-menu-order"
                type="number"
                inputMode="numeric"
                step="1"
                value={asString(getValue("product.menuOrder"))}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  handleSetNumber("product.menuOrder", e.currentTarget.value)
                }
                disabled={!canEdit}
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
