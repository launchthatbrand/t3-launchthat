"use client";

/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import type { PluginSettingComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { Plus } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@acme/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
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
const SHOP_TEMPLATE_SLUG = "ecommerce-shop";
const CART_TEMPLATE_SLUG = "ecommerce-cart";
const CHECKOUT_TEMPLATE_SLUG = "ecommerce-checkout";

type PageSetupSettings = {
  shopPageId: string | null;
  cartPageId: string | null;
  checkoutPageId: string | null;
};

const defaultSettings: PageSetupSettings = {
  shopPageId: null,
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

  const createCorePost = useMutation(apiAny.core.posts.mutations.createPost) as (
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
      shopPageId: typeof v?.shopPageId === "string" ? v.shopPageId : null,
      cartPageId: typeof v?.cartPageId === "string" ? v.cartPageId : null,
      checkoutPageId:
        typeof v?.checkoutPageId === "string" ? v.checkoutPageId : null,
    };
  }, [stored]);

  const [shopPageId, setShopPageId] = useState<string | null>(resolved.shopPageId);
  const [cartPageId, setCartPageId] = useState<string | null>(resolved.cartPageId);
  const [checkoutPageId, setCheckoutPageId] = useState<string | null>(
    resolved.checkoutPageId,
  );
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setShopPageId(resolved.shopPageId);
    setCartPageId(resolved.cartPageId);
    setCheckoutPageId(resolved.checkoutPageId);
  }, [resolved]);

  const pageTitleById = useMemo(() => {
    const map = new Map<string, string>();
    pages.forEach((p) => map.set(p.id, p.title));
    return map;
  }, [pages]);

  const handleCreateAndLink = (kind: "shop" | "cart" | "checkout") => {
    if (!orgId) {
      toast.error("Missing organization context");
      return;
    }

    const title =
      kind === "shop" ? "Shop" : kind === "cart" ? "Cart" : "Checkout";
    const slug =
      kind === "shop" ? "shop" : kind === "cart" ? "cart" : "checkout";
    const templateSlug =
      kind === "shop"
        ? SHOP_TEMPLATE_SLUG
        : kind === "cart"
          ? CART_TEMPLATE_SLUG
          : CHECKOUT_TEMPLATE_SLUG;

    startTransition(() => {
      void createCorePost({
        title,
        slug,
        status: "published",
        postTypeSlug: "pages",
        organizationId: props.organizationId ?? undefined,
        meta: { [PAGE_TEMPLATE_META_KEY]: templateSlug },
      })
        .then((postId: unknown) => {
          const createdId = typeof postId === "string" ? postId : String(postId);

          if (kind === "shop") setShopPageId(createdId);
          if (kind === "cart") setCartPageId(createdId);
          if (kind === "checkout") setCheckoutPageId(createdId);

          return setOption({
            metaKey: SETTINGS_META_KEY,
            type: "site",
            orgId: (orgId ?? null) as any,
            metaValue: {
              shopPageId: kind === "shop" ? createdId : shopPageId,
              cartPageId: kind === "cart" ? createdId : cartPageId,
              checkoutPageId: kind === "checkout" ? createdId : checkoutPageId,
            } satisfies PageSetupSettings,
          });
        })
        .then(() => toast.success(`Created and linked ${title} page`))
        .catch((err: unknown) =>
          toast.error(err instanceof Error ? err.message : "Failed to create page"),
        );
    });
  };

  const handleSave = () => {
    const selected = [shopPageId, cartPageId, checkoutPageId].filter(Boolean) as string[];
    const unique = new Set(selected);
    if (selected.length !== unique.size) {
      toast.error("Shop, Cart, and Checkout must be different pages.");
      return;
    }
    startTransition(() => {
      const prevShop = resolved.shopPageId;
      const prevCart = resolved.cartPageId;
      const prevCheckout = resolved.checkoutPageId;

      const mutations: Array<Promise<unknown>> = [];

      if (prevShop && prevShop !== shopPageId) {
        mutations.push(
          updateCorePost({
            id: prevShop,
            meta: { [PAGE_TEMPLATE_META_KEY]: null },
          }),
        );
      }
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
      if (shopPageId) {
        mutations.push(
          updateCorePost({
            id: shopPageId,
            meta: { [PAGE_TEMPLATE_META_KEY]: SHOP_TEMPLATE_SLUG },
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
              shopPageId,
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
  const shopLabel =
    shopPageId && pageTitleById.get(shopPageId)
      ? pageTitleById.get(shopPageId)
      : null;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Page setup</CardTitle>
          <CardDescription>
            Choose which core <span className="font-medium">Pages</span> (stored in
            the portal <span className="font-medium">posts</span> table) are used for
            shop, cart, and checkout.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Shop page</div>
                {!shopPageId ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        aria-label="Create and link Shop page"
                        title="Create and link Shop page"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Create and link Shop page?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a new Page named “Shop”, set its page template to
                          Ecommerce: Shop, and select it here.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCreateAndLink("shop")}
                        >
                          Create page
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
              <Select
                value={shopPageId ?? "__none__"}
                onValueChange={(value: string) =>
                  setShopPageId(value === "__none__" ? null : value)
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
                Selected: <span className="font-medium">{shopLabel ?? "None"}</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Cart page</div>
                {!cartPageId ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        aria-label="Create and link Cart page"
                        title="Create and link Cart page"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Create and link Cart page?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a new Page named “Cart”, set its page template to
                          Ecommerce: Cart, and select it here.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCreateAndLink("cart")}
                        >
                          Create page
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
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
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">Checkout page</div>
                {!checkoutPageId ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={isPending}
                        aria-label="Create and link Checkout page"
                        title="Create and link Checkout page"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>
                          Create and link Checkout page?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          This will create a new Page named “Checkout”, set its page template to
                          Ecommerce: Checkout, and select it here.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleCreateAndLink("checkout")}
                        >
                          Create page
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : null}
              </div>
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
                setShopPageId(resolved.shopPageId);
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


