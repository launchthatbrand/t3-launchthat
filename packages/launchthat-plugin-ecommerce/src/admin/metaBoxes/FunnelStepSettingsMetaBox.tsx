"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useMemo } from "react";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";

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
import { Textarea } from "@acme/ui/textarea";

const apiAny = api as any;

const STEP_KIND_KEY = "step.kind";
const STEP_ORDER_KEY = "step.order";
const STEP_FUNNEL_ID_KEY = "step.funnelId";
const STEP_IS_DEFAULT_FUNNEL_KEY = "step.isDefaultFunnel";

const CHECKOUT_DESIGN_KEY = "step.checkout.design";
const CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY =
  "step.checkout.predefinedProductsJson";

const THANK_YOU_HEADLINE_KEY = "step.thankYou.headline";
const THANK_YOU_BODY_KEY = "step.thankYou.body";

const UPSELL_OFFER_PRODUCTS_JSON_KEY = "step.upsell.offerProductPostIdsJson";

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";
const asNumberString = (value: unknown): string =>
  typeof value === "number"
    ? String(value)
    : typeof value === "string"
      ? value
      : "";
const asBoolean = (value: unknown): boolean => value === true;

type ProductOption = { label: string; value: string };

const parseStringArrayJson = (raw: unknown): string[] => {
  if (typeof raw !== "string" || raw.trim().length === 0) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is string => typeof v === "string" && v.trim().length > 0,
    );
  } catch {
    return [];
  }
};

const stringifyStringArrayJson = (values: string[]): string => {
  return JSON.stringify(
    values.filter((v) => typeof v === "string" && v.trim().length > 0),
  );
};

export const FunnelStepSettingsMetaBox = (
  props: PluginMetaBoxRendererProps,
) => {
  const kindRaw = asString(props.getValue(STEP_KIND_KEY));
  const kind = useMemo(() => {
    if (kindRaw === "checkout") return "checkout" as const;
    if (kindRaw === "upsell") return "upsell" as const;
    if (kindRaw === "thankYou") return "thankYou" as const;
    return "checkout" as const;
  }, [kindRaw]);

  const order = asNumberString(props.getValue(STEP_ORDER_KEY));
  const funnelId = asString(props.getValue(STEP_FUNNEL_ID_KEY));
  const isDefaultFunnel = asBoolean(props.getValue(STEP_IS_DEFAULT_FUNNEL_KEY));

  const checkoutDesign =
    asString(props.getValue(CHECKOUT_DESIGN_KEY)) || "default";
  const predefinedProducts = useMemo(() => {
    return parseStringArrayJson(
      props.getValue(CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY),
    );
  }, [props]);

  const thankYouHeadline = asString(props.getValue(THANK_YOU_HEADLINE_KEY));
  const thankYouBody = asString(props.getValue(THANK_YOU_BODY_KEY));

  const upsellOfferProductsJson = asString(
    props.getValue(UPSELL_OFFER_PRODUCTS_JSON_KEY),
  );

  const settingsTab = useMemo(() => {
    if (kind === "checkout") return "checkout";
    if (kind === "thankYou") return "thankYou";
    return "upsell";
  }, [kind]);

  const productRows = useQuery(apiAny.plugins.commerce.getAllPosts, {
    organizationId: props.context.organizationId,
    filters: { postTypeSlug: "products", limit: 250 },
  }) as Array<{ _id: string; title?: string | null }> | undefined;

  const productOptions = useMemo<ProductOption[]>(() => {
    const rows = Array.isArray(productRows) ? productRows : [];
    return rows
      .map((row) => ({
        label:
          typeof row.title === "string" && row.title.trim()
            ? row.title.trim()
            : row._id,
        value: row._id,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [productRows]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          {kind === "checkout" ? (
            <>
              <TabsTrigger value="checkout">Design</TabsTrigger>
              <TabsTrigger value="products" disabled={isDefaultFunnel}>
                Products
              </TabsTrigger>
            </>
          ) : (
            <TabsTrigger value={settingsTab}>
              {kind === "thankYou" ? "Thank you" : "Upsell"}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Step kind</Label>
            <Select
              value={kind}
              onValueChange={(next) => props.setValue(STEP_KIND_KEY, next)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select kind" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="checkout">Checkout</SelectItem>
                <SelectItem value="thankYou">Thank you</SelectItem>
                <SelectItem value="upsell">Upsell</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-muted-foreground text-xs">
              Determines which renderer and settings apply to this step.
            </div>
          </div>

          <div className="space-y-2">
            <Label>Step order</Label>
            <input
              className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
              inputMode="numeric"
              value={order}
              onChange={(e) =>
                props.setValue(
                  STEP_ORDER_KEY,
                  e.currentTarget.value.trim()
                    ? Number(e.currentTarget.value)
                    : null,
                )
              }
              placeholder="0"
            />
            <div className="text-muted-foreground text-xs">
              Used for sorting steps inside the funnel.
            </div>
          </div>

          <div className="rounded-md border p-3 text-xs">
            <div className="text-muted-foreground">
              Funnel ID (assigned by system)
            </div>
            <div>
              <code>{funnelId || "(not set yet)"}</code>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="checkout" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Checkout design</Label>
            <Select
              value={checkoutDesign}
              onValueChange={(next) =>
                props.setValue(CHECKOUT_DESIGN_KEY, next)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select design" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default</SelectItem>
                <SelectItem value="minimal">Minimal</SelectItem>
                <SelectItem value="sidebar">Sidebar</SelectItem>
              </SelectContent>
            </Select>
            <div className="text-muted-foreground text-xs">
              Only applies when step kind is Checkout.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="products" className="mt-4 space-y-4">
          {isDefaultFunnel ? (
            <div className="text-muted-foreground text-sm">
              Predefined products are disabled for the default funnel checkout.
            </div>
          ) : (
            <div className="space-y-2">
              <Label>Attached products</Label>
              <MultiSelect
                options={productOptions}
                defaultValue={predefinedProducts}
                onValueChange={(values: string[]) =>
                  props.setValue(
                    CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY,
                    stringifyStringArrayJson(values),
                  )
                }
                placeholder="Select products for immediate checkout"
                maxCount={3}
              />
              <div className="text-muted-foreground text-xs">
                Visiting this checkout step will replace the cart with these
                items.
              </div>
              <details className="rounded-md border p-3 text-xs">
                <summary className="cursor-pointer text-muted-foreground">
                  Advanced: raw JSON
                </summary>
                <div className="mt-2 space-y-2">
                  <Textarea
                    rows={4}
                    value={stringifyStringArrayJson(predefinedProducts)}
                    onChange={(e) =>
                      props.setValue(
                        CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY,
                        e.currentTarget.value,
                      )
                    }
                    placeholder='["productPostId1","productPostId2"]'
                  />
                  <div className="text-muted-foreground text-xs">
                    This is stored as{" "}
                    <code>step.checkout.predefinedProductsJson</code>.
                  </div>
                </div>
              </details>
            </div>
          )}
        </TabsContent>

        <TabsContent value="thankYou" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Textarea
              rows={2}
              value={thankYouHeadline}
              onChange={(e) =>
                props.setValue(THANK_YOU_HEADLINE_KEY, e.currentTarget.value)
              }
              placeholder="Order confirmed"
            />
            <div className="text-muted-foreground text-xs">
              Headline shown on the thank you page step.
            </div>
          </div>

          <div className="space-y-2">
            <Label>Body</Label>
            <Textarea
              rows={5}
              value={thankYouBody}
              onChange={(e) =>
                props.setValue(THANK_YOU_BODY_KEY, e.currentTarget.value)
              }
              placeholder="Thanks for your purchase…"
            />
            <div className="text-muted-foreground text-xs">
              Body content shown under the headline.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upsell" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Offer products (JSON)</Label>
            <Textarea
              rows={4}
              value={upsellOfferProductsJson}
              onChange={(e) =>
                props.setValue(
                  UPSELL_OFFER_PRODUCTS_JSON_KEY,
                  e.currentTarget.value,
                )
              }
              placeholder='["productPostId1","productPostId2"]'
            />
            <div className="text-muted-foreground text-xs">
              Products offered on this upsell step (we’ll replace this with a
              proper picker).
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
