"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useEffect, useMemo } from "react";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";

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

const STEP_KIND_KEY = "step.kind";
const STEP_ORDER_KEY = "step.order";
const STEP_FUNNEL_ID_KEY = "step.funnelId";

const CHECKOUT_DESIGN_KEY = "step.checkout.design";
const CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY = "step.checkout.predefinedProductsJson";

const THANK_YOU_HEADLINE_KEY = "step.thankYou.headline";
const THANK_YOU_BODY_KEY = "step.thankYou.body";

const UPSELL_OFFER_PRODUCTS_JSON_KEY = "step.upsell.offerProductPostIdsJson";

const asString = (value: unknown): string => (typeof value === "string" ? value : "");
const asNumberString = (value: unknown): string =>
  typeof value === "number" ? String(value) : typeof value === "string" ? value : "";

export const FunnelStepSettingsMetaBox = (props: PluginMetaBoxRendererProps) => {
  const ensureRoutingMeta = useMutation(
    (api.plugins.commerce.funnelSteps.mutations as any).ensureFunnelStepRoutingMeta,
  ) as (args: any) => Promise<any>;

  const kindRaw = asString(props.getValue(STEP_KIND_KEY));
  const kind = useMemo(() => {
    if (kindRaw === "checkout") return "checkout" as const;
    if (kindRaw === "upsell") return "upsell" as const;
    if (kindRaw === "thankYou") return "thankYou" as const;
    return "checkout" as const;
  }, [kindRaw]);

  const order = asNumberString(props.getValue(STEP_ORDER_KEY));
  const funnelId = asString(props.getValue(STEP_FUNNEL_ID_KEY));

  const checkoutDesign = asString(props.getValue(CHECKOUT_DESIGN_KEY)) || "default";
  const predefinedProductsJson = asString(
    props.getValue(CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY),
  );

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

  useEffect(() => {
    // Ensure routing meta exists so the admin permalink preview can resolve
    // /f/<funnelSlug>/<stepSlug> vs /checkout/... without hardcoding logic in core admin.
    const stepId = props.context.postId;
    if (!stepId) return;
    // eslint-disable-next-line no-console
    console.info("[ecommerce] ensureFunnelStepRoutingMeta (client)", {
      stepId,
      organizationId: props.context.organizationId,
    });
    void ensureRoutingMeta({
      stepId,
      organizationId: props.context.organizationId,
    })
      .then(() => {
        // eslint-disable-next-line no-console
        console.info("[ecommerce] ensureFunnelStepRoutingMeta ok", { stepId });
      })
      .catch((err: unknown) => {
        // eslint-disable-next-line no-console
        console.error("[ecommerce] ensureFunnelStepRoutingMeta failed", err);
      });
  }, [ensureRoutingMeta, props.context.organizationId, props.context.postId]);

  return (
    <div className="space-y-4">
      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value={settingsTab}>
            {kind === "checkout"
              ? "Checkout"
              : kind === "thankYou"
                ? "Thank you"
                : "Upsell"}
          </TabsTrigger>
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
            <div className="text-muted-foreground">Funnel ID (assigned by system)</div>
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
              onValueChange={(next) => props.setValue(CHECKOUT_DESIGN_KEY, next)}
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

          <div className="space-y-2">
            <Label>Predefined products (JSON)</Label>
            <Textarea
              rows={4}
              value={predefinedProductsJson}
              onChange={(e) =>
                props.setValue(
                  CHECKOUT_PREDEFINED_PRODUCTS_JSON_KEY,
                  e.currentTarget.value,
                )
              }
              placeholder='["productPostId1","productPostId2"]'
            />
            <div className="text-muted-foreground text-xs">
              Only applies when step kind is Checkout. We’ll replace the cart with these items when the step is visited.
            </div>
          </div>
        </TabsContent>

        <TabsContent value="thankYou" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label>Headline</Label>
            <Textarea
              rows={2}
              value={thankYouHeadline}
              onChange={(e) => props.setValue(THANK_YOU_HEADLINE_KEY, e.currentTarget.value)}
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
              onChange={(e) => props.setValue(THANK_YOU_BODY_KEY, e.currentTarget.value)}
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
                props.setValue(UPSELL_OFFER_PRODUCTS_JSON_KEY, e.currentTarget.value)
              }
              placeholder='["productPostId1","productPostId2"]'
            />
            <div className="text-muted-foreground text-xs">
              Products offered on this upsell step (we’ll replace this with a proper picker).
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};


