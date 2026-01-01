"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Label } from "@acme/ui/label";
import { MultiSelect } from "@acme/ui/multi-select";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

const apiAny = api as any;

const DEFAULT_CHECKOUT_SLUG = "__default_checkout__";

type CheckoutDesign = "default" | "minimal" | "sidebar";

const DESIGN_OPTIONS: Array<{ label: string; value: CheckoutDesign }> = [
  { label: "Default (two-column)", value: "default" },
  { label: "Minimal (single-column)", value: "minimal" },
  { label: "Sidebar (emphasis on summary)", value: "sidebar" },
];

type ProductOption = { label: string; value: string };

const asString = (value: unknown): string => (typeof value === "string" ? value : "");

const parseStringArrayJson = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  } catch {
    return [];
  }
};

const stringifyStringArrayJson = (values: string[]): string => {
  return JSON.stringify(values.filter((v) => typeof v === "string" && v.trim().length > 0));
};

export function CheckoutSettingsMetaBox({
  context,
  getValue,
  setValue,
}: PluginMetaBoxRendererProps) {
  const canEdit = Boolean(context.postId) || context.isNewRecord;

  const post = context.post as { slug?: unknown } | undefined;
  const slug = typeof post?.slug === "string" ? post.slug : "";
  const isDefaultCheckout = slug === DEFAULT_CHECKOUT_SLUG;

  const design = useMemo<CheckoutDesign>(() => {
    const raw = getValue("checkout.design");
    const normalized = asString(raw) as CheckoutDesign;
    return DESIGN_OPTIONS.some((opt) => opt.value === normalized) ? normalized : "default";
  }, [getValue]);

  const productRows = useQuery(apiAny.plugins.commerce.getAllPosts, {
    organizationId: context.organizationId,
    filters: { postTypeSlug: "products", limit: 250 },
  }) as Array<{ _id: string; title?: string | null }> | undefined;

  const productOptions = useMemo<ProductOption[]>(() => {
    const rows = Array.isArray(productRows) ? productRows : [];
    return rows
      .map((row) => ({
        label: typeof row.title === "string" && row.title.trim() ? row.title.trim() : row._id,
        value: row._id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [productRows]);

  const selectedProducts = useMemo(() => {
    const raw = getValue("checkout.predefinedProductsJson");
    return parseStringArrayJson(raw);
  }, [getValue]);

  return (
    <div className="space-y-4">
      {isDefaultCheckout ? (
        <div className="flex flex-wrap items-center gap-2 rounded-md border bg-muted/20 px-3 py-2">
          <Badge variant="secondary">Default checkout</Badge>
          <p className="text-muted-foreground text-xs">
            This checkout is required for the standard cart → checkout flow. Predefined products
            are disabled here.
          </p>
        </div>
      ) : null}

      <Tabs defaultValue="design" className="w-full">
        <TabsList className="flex h-9 w-full flex-wrap justify-start gap-1">
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="products" disabled={isDefaultCheckout}>
            Products
          </TabsTrigger>
        </TabsList>

        <TabsContent value="design" className="space-y-3 pt-3">
          <div className="space-y-2">
            <Label className="text-muted-foreground text-xs">Checkout design</Label>
            <Select
              value={design}
              onValueChange={(value: string) => setValue("checkout.design", value as any)}
              disabled={!canEdit}
            >
              <SelectTrigger className="w-full md:w-[360px]">
                <SelectValue placeholder="Select a design" />
              </SelectTrigger>
              <SelectContent>
                {DESIGN_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-muted-foreground text-xs">
              The checkout still uses the same payment flow; this only changes layout.
            </p>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-3 pt-3">
          {isDefaultCheckout ? (
            <p className="text-muted-foreground text-sm">
              Predefined products aren’t available on the default checkout.
            </p>
          ) : (
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Predefined products</Label>
              <MultiSelect
                options={productOptions}
                defaultValue={selectedProducts}
                onValueChange={(values: string[]) =>
                  setValue("checkout.predefinedProductsJson", stringifyStringArrayJson(values))
                }
                placeholder="Select products to add automatically"
                maxCount={3}
                disabled={!canEdit}
              />
              <p className="text-muted-foreground text-xs">
                Visiting <span className="font-mono">/checkout/{slug || "your-slug"}</span> will
                replace the cart with these items.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}


