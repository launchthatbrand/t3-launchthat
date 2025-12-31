"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

const apiAny = api as any;

const SETTINGS_META_KEY = "plugin.ecommerce.pageSetup";
const PAGE_TEMPLATE_META_KEY = "page_template";
const CART_TEMPLATE_SLUG = "ecommerce-cart";
const CHECKOUT_TEMPLATE_SLUG = "ecommerce-checkout";

type PageSetupSettings = {
  cartPageId: string | null;
  checkoutPageId: string | null;
};

const defaultSettings: PageSetupSettings = {
  cartPageId: null,
  checkoutPageId: null,
};

type PageOption = {
  id: string;
  title: string;
  slug?: string;
  status?: string;
};

const asString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const normalizePageOptions = (rows: unknown): Array<PageOption> => {
  if (!Array.isArray(rows)) return [];
  return rows
    .map((row): PageOption | null => {
      if (!row || typeof row !== "object") return null;
      const r = row as Record<string, unknown>;
      const id = asString(r._id);
      if (!id) return null;
      const title = asString(r.title) || "Untitled page";
      const slug = asString(r.slug) || undefined;
      const status = asString(r.status) || undefined;
      return { id, title, slug, status };
    })
    .filter((row): row is PageOption => row !== null)
    .sort((a, b) => a.title.localeCompare(b.title));
};

export const EcommercePageSetupSettingsPage = (
  props: PluginSettingComponentProps,
) => {
  const orgId = props.organizationId ? String(props.organizationId) : undefined;

  const stored = useQuery(apiAny.core.options.get, {
    metaKey: SETTINGS_META_KEY,
    type: "site",
    orgId: props.organizationId ?? null,
  }) as { metaValue?: unknown } | null | undefined;

  const setOption = useMutation(apiAny.core.options.set) as (args: {
    metaKey: string;
    metaValue: unknown;
    type?: "store" | "site";
    orgId?: string | null;
  }) => Promise<string>;

  const updateCorePost = useMutation(apiAny.core.posts.mutations.updatePost) as (
    args: any,
  ) => Promise<any>;

  const pagesForOrg = useQuery(apiAny.core.posts.queries.getAllPosts, {
    organizationId: props.organizationId ?? undefined,
    filters: { postTypeSlug: "pages", limit: 200 },
  }) as unknown;

  const pagesAllOrgs = useQuery(apiAny.core.posts.queries.getAllPosts, {
    filters: { postTypeSlug: "pages", limit: 200 },
  }) as unknown;

  const pages = useMemo(() => {
    const orgRows = normalizePageOptions(pagesForOrg);
    const allRows = normalizePageOptions(pagesAllOrgs);
    if (orgRows.length > 0) return orgRows;
    if (!orgId) return allRows;
    return orgRows;
  }, [orgId, pagesAllOrgs, pagesForOrg]);

  const resolved = useMemo<PageSetupSettings>(() => {
    const v = stored?.metaValue as Partial<PageSetupSettings> | undefined;
    return {
      cartPageId: typeof v?.cartPageId === "string" ? v.cartPageId : null,
      checkoutPageId:
        typeof v?.checkoutPageId === "string" ? v.checkoutPageId : null,
    };
  }, [stored]);

  const [cartPageId, setCartPageId] = useState<string | null>(resolved.cartPageId);
  const [checkoutPageId, setCheckoutPageId] = useState<string | null>(
    resolved.checkoutPageId,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setCartPageId(resolved.cartPageId);
    setCheckoutPageId(resolved.checkoutPageId);
  }, [resolved]);

  const pageTitleById = useMemo(() => {
    const map = new Map<string, string>();
    pages.forEach((p) => map.set(p.id, p.title));
    return map;
  }, [pages]);

  const handleSave = () => {
    if (cartPageId && checkoutPageId && cartPageId === checkoutPageId) {
      toast.error("Cart and Checkout cannot be the same page.");
      return;
    }
    startTransition(() => {
      const prevCart = resolved.cartPageId;
      const prevCheckout = resolved.checkoutPageId;

      const mutations: Array<Promise<unknown>> = [];

      if (prevCart && prevCart !== cartPageId) {
        mutations.push(
          updateCorePost({
            id: prevCart,
            meta: { [PAGE_TEMPLATE_META_KEY]: null },
          }),
        );
      }
      if (prevCheckout && prevCheckout !== checkoutPageId) {
        mutations.push(
          updateCorePost({
            id: prevCheckout,
            meta: { [PAGE_TEMPLATE_META_KEY]: null },
          }),
        );
      }
      if (cartPageId) {
        mutations.push(
          updateCorePost({
            id: cartPageId,
            meta: { [PAGE_TEMPLATE_META_KEY]: CART_TEMPLATE_SLUG },
          }),
        );
      }
      if (checkoutPageId) {
        mutations.push(
          updateCorePost({
            id: checkoutPageId,
            meta: { [PAGE_TEMPLATE_META_KEY]: CHECKOUT_TEMPLATE_SLUG },
          }),
        );
      }

      void Promise.all(mutations)
        .then(() =>
          setOption({
            metaKey: SETTINGS_META_KEY,
            type: "site",
            orgId: (orgId ?? null) as any,
            metaValue: {
              cartPageId,
              checkoutPageId,
            } satisfies PageSetupSettings,
          }),
        )
        .then(() => toast.success("Saved ecommerce page setup"))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to save"),
        );
    });
  };

  const cartLabel =
    cartPageId && pageTitleById.get(cartPageId)
      ? pageTitleById.get(cartPageId)
      : null;
  const checkoutLabel =
    checkoutPageId && pageTitleById.get(checkoutPageId)
      ? pageTitleById.get(checkoutPageId)
      : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Page setup</CardTitle>
          <CardDescription>
            Choose which core <span className="font-medium">Pages</span> (stored in
            the portal <span className="font-medium">posts</span> table) are used for
            cart and checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="text-sm font-medium">Cart page</div>
              <Select
                value={cartPageId ?? "__none__"}
                onValueChange={(value: string) =>
                  setCartPageId(value === "__none__" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {pages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                      {p.status ? ` (${p.status})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-muted-foreground text-sm">
                Selected: <span className="font-medium">{cartLabel ?? "None"}</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">Checkout page</div>
              <Select
                value={checkoutPageId ?? "__none__"}
                onValueChange={(value: string) =>
                  setCheckoutPageId(value === "__none__" ? null : value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">None</SelectItem>
                  {pages.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.title}
                      {p.status ? ` (${p.status})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-muted-foreground text-sm">
                Selected:{" "}
                <span className="font-medium">{checkoutLabel ?? "None"}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                setCartPageId(resolved.cartPageId);
                setCheckoutPageId(resolved.checkoutPageId);
              }}
              disabled={isPending}
            >
              Reset
            </Button>
            <Button type="button" onClick={handleSave} disabled={isPending}>
              Save
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};


