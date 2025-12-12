"use client";

import { COMMERCE_ORDER_POST_TYPE, ensureOrderSyntheticId } from "../adapters";
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import {
  MetaBoxColumns,
  MetaBoxFieldset,
  MetaBoxTable,
  MetaBoxTableRow,
  registerMetaBoxHook,
} from "@acme/admin-runtime";
import { useCallback, useEffect, useMemo, useState } from "react";

import type { AdminMetaBoxContext } from "@acme/admin-runtime";
import type { ChangeEvent } from "react";
import { ORDER_META_KEYS } from "../constants";
import { OrderForm } from "../components/orders/OrderForm";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@portal/convexspec";
import { decodeCommerceSyntheticId } from "../../lib/customAdapters";
import { toast } from "@acme/ui/toast";
import { useMutation } from "convex/react";
import { useRouter } from "next/navigation";

interface CommerceOrderAddress {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

interface CommerceOrderLineItem {
  id: string;
  type: "product" | "shipping";
  productId?: Id<"products">;
  productSnapshot?: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  };
  shippingMethod?: string;
  shippingDescription?: string;
  quantity: number;
  price: number;
  lineTotal: number;
}

interface CommerceOrderFormData {
  userId?: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  company?: string;
  differentShippingAddress?: boolean;
  billingAddress: CommerceOrderAddress;
  shippingAddress: CommerceOrderAddress;
  paymentMethod: string;
  notes?: string;
  createdAt?: Date;
  lineItems: CommerceOrderLineItem[];
}

type ProductLineItemForCreate = CommerceOrderLineItem & {
  productId: Id<"products">;
};

const isProductLineItemForCreate = (
  item: CommerceOrderLineItem,
): item is ProductLineItemForCreate => {
  return item.type === "product" && item.productId !== undefined;
};

type CommerceAdminContext = AdminMetaBoxContext<Doc<"posts">, Doc<"postTypes">>;

const TAX_RATE = 0.08;

const ORDER_PLAYGROUND_META_NOTE_KEY = "order:playground_note";
const ORDER_PLAYGROUND_META_PRIORITY_KEY = "order:playground_priority";
const ORDER_PLAYGROUND_PRIORITY_OPTIONS = ["low", "medium", "high"] as const;
const playgroundRuntimeState = new Map<
  string,
  { note: string; priority: string }
>();

const getPlaygroundStateKey = (context: CommerceAdminContext) =>
  context.post?._id?.toString() ?? `new:${context.slug ?? "orders"}`;

const collectRuntimeMeta = (
  context: CommerceAdminContext,
  log?: (...args: unknown[]) => void,
): Record<string, string | number | boolean | null> => {
  const entries: Record<string, string | number | boolean | null> = {};
  const localState =
    playgroundRuntimeState.get(getPlaygroundStateKey(context)) ?? null;
  const noteValue = context.getMetaValue?.(ORDER_PLAYGROUND_META_NOTE_KEY);
  if (typeof noteValue === "string") {
    entries[ORDER_PLAYGROUND_META_NOTE_KEY] = noteValue;
  } else if (localState?.note) {
    entries[ORDER_PLAYGROUND_META_NOTE_KEY] = localState.note;
  }

  const priorityValue = context.getMetaValue?.(
    ORDER_PLAYGROUND_META_PRIORITY_KEY,
  );
  if (
    typeof priorityValue === "string" &&
    ORDER_PLAYGROUND_PRIORITY_OPTIONS.includes(
      priorityValue as (typeof ORDER_PLAYGROUND_PRIORITY_OPTIONS)[number],
    )
  ) {
    entries[ORDER_PLAYGROUND_META_PRIORITY_KEY] = priorityValue;
  } else if (localState?.priority) {
    entries[ORDER_PLAYGROUND_META_PRIORITY_KEY] = localState.priority;
  }

  log?.("[CommerceOrderMetaBox] collectRuntimeMeta", {
    noteValue,
    priorityValue,
    entries,
  });
  console.log("[CommerceOrderMetaBox] collectRuntimeMeta", {
    noteValue,
    priorityValue,
    entries,
  });
  return entries;
};

type OrderTotals = {
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");

const buildOrderTitle = (data: CommerceOrderFormData): string => {
  const name = `${data.firstName} ${data.lastName}`.trim();
  if (name) {
    return `Order · ${name}`;
  }
  if (data.email) {
    return `Order · ${data.email}`;
  }
  return "Order";
};

const buildOrderExcerpt = (
  data: CommerceOrderFormData,
  totals: OrderTotals,
): string => {
  const name = `${data.firstName} ${data.lastName}`.trim() || "Customer";
  return `${name} • ${data.email || "no-email"} • $${totals.total.toFixed(2)}`;
};

const buildOrderContent = (
  data: CommerceOrderFormData,
  totals: OrderTotals,
): string => {
  const lines = [
    `Customer: ${data.firstName} ${data.lastName}`.trim(),
    `Email: ${data.email}`,
    `Payment: ${data.paymentMethod}`,
    `Subtotal: $${totals.subtotal.toFixed(2)}`,
    `Shipping: $${totals.shipping.toFixed(2)}`,
    `Tax: $${totals.tax.toFixed(2)}`,
    `Total: $${totals.total.toFixed(2)}`,
  ];
  return lines.join("\n");
};

const buildOrderSlug = (data: CommerceOrderFormData) => {
  const base =
    data.email?.split("@")[0] ??
    `${data.firstName || "order"}-${Date.now().toString(36)}`;
  return slugify(`order-${base}`);
};

const buildOrderMeta = (
  data: CommerceOrderFormData,
  totals: OrderTotals,
): Record<string, string | number | boolean | null> => ({
  [ORDER_META_KEYS.payload]: JSON.stringify({
    ...data,
    createdAt: data.createdAt ? data.createdAt.getTime() : undefined,
  }),
  [ORDER_META_KEYS.subtotal]: totals.subtotal,
  [ORDER_META_KEYS.shipping]: totals.shipping,
  [ORDER_META_KEYS.tax]: totals.tax,
  [ORDER_META_KEYS.total]: totals.total,
  [ORDER_META_KEYS.email]: data.email ?? "",
  [ORDER_META_KEYS.userId]: data.userId ?? null,
});

const CommerceOrderGeneralMetaBox = ({
  context,
}: {
  context: CommerceAdminContext;
}) => {
  const isDev = process.env.NODE_ENV !== "production";
  const log = useCallback(
    (...args: unknown[]) => {
      if (isDev) {
        console.log("[CommerceOrderMetaBox]", ...args);
      }
    },
    [isDev],
  );
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCommercePost = useMutation(api.commercePosts.createPost);
  const updateCommercePost = useMutation(api.commercePosts.updatePost);

  const commerceInfo = useMemo(() => {
    if (!context.post?._id) {
      return null;
    }
    return decodeCommerceSyntheticId(context.post._id);
  }, [context.post?._id]);

  const isNewRecord = context.isNewRecord || !commerceInfo;
  const organizationIdString = context.organizationId
    ? (context.organizationId as unknown as string)
    : undefined;

  const handleSubmit = useCallback(
    async (formData: CommerceOrderFormData) => {
      log("handleSubmit invoked", {
        isNewRecord,
        orderId: commerceInfo?.componentId,
        formData,
      });
      setIsSubmitting(true);
      try {
        const productItems = formData.lineItems.filter(
          isProductLineItemForCreate,
        );
        const shippingItems = formData.lineItems.filter(
          (item) => item.type === "shipping",
        );

        const subtotal = productItems.reduce(
          (sum, item) => sum + item.lineTotal,
          0,
        );
        const shippingTotal = shippingItems.reduce(
          (sum, item) => sum + item.lineTotal,
          0,
        );
        const tax = subtotal * TAX_RATE;
        const totals: OrderTotals = {
          subtotal,
          shipping: shippingTotal,
          tax,
          total: subtotal + shippingTotal + tax,
        };

        const baseMeta = buildOrderMeta(formData, totals);
        log("Base order meta", baseMeta);
        console.log("[CommerceOrderMetaBox] baseMeta", baseMeta);
        const runtimeMeta = collectRuntimeMeta(context, log);
        log("Runtime meta from context", runtimeMeta);
        console.log("[CommerceOrderMetaBox] runtimeMeta", runtimeMeta);
        const meta = { ...baseMeta, ...runtimeMeta };
        log("Combined meta payload", meta);
        console.log("[CommerceOrderMetaBox] combinedMeta", meta);
        const title = buildOrderTitle(formData);
        const excerpt = buildOrderExcerpt(formData, totals);
        const content = buildOrderContent(formData, totals);

        if (isNewRecord) {
          const slug = buildOrderSlug(formData);
          const componentId = await createCommercePost({
            title,
            content,
            excerpt,
            slug,
            status: "draft",
            postTypeSlug: COMMERCE_ORDER_POST_TYPE,
            meta,
            organizationId: organizationIdString,
          });
          log("Created commerce post", { componentId, meta });
          const syntheticId = ensureOrderSyntheticId(componentId);
          toast.success("Order created successfully.");
          router.replace(
            `/admin/edit?post_type=${COMMERCE_ORDER_POST_TYPE}&post_id=${syntheticId}`,
          );
          return;
        }

        if (!commerceInfo) {
          toast.error("Unable to determine order ID.");
          return;
        }

        await updateCommercePost({
          id: commerceInfo.componentId,
          title,
          content,
          excerpt,
          meta,
        });
        log("Updated commerce post", {
          componentId: commerceInfo.componentId,
          meta,
        });
        toast.success("Order updated successfully.");
      } catch (error) {
        console.error("[CommerceOrderGeneralMetaBox] submission failed", error);
        toast.error("Unable to save this order. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      commerceInfo,
      createCommercePost,
      isNewRecord,
      organizationIdString,
      router,
      updateCommercePost,
    ],
  );

  const handleCancel = useCallback(() => {
    router.push(`/admin/edit?post_type=${COMMERCE_ORDER_POST_TYPE}`);
  }, [router]);

  const handleOrderFormSubmit = useCallback(
    async (rawData: unknown) => {
      return handleSubmit(rawData as CommerceOrderFormData);
    },
    [handleSubmit],
  );

  const registerBeforeSaveHandler = useCallback(
    (handler: () => Promise<void>) => {
      if (!context.registerBeforeSave) {
        return undefined;
      }
      log("Registering beforeSave handler with admin runtime");
      return context.registerBeforeSave(async () => {
        log("beforeSave handler firing in meta box");
        await handler();
      });
    },
    [context.registerBeforeSave, log],
  );

  const resolvedOrderId = context.post?._id ?? undefined;

  return (
    <OrderForm
      orderId={resolvedOrderId}
      organizationId={
        context.organizationId as Id<"organizations"> | string | undefined
      }
      onSubmit={handleOrderFormSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      submitButtonText={isNewRecord ? "Create Order" : "Update Order"}
      hideSubmitControls
      onRegisterBeforeSave={registerBeforeSaveHandler}
    />
  );
};

const CommerceOrderPlaygroundMetaBox = ({
  context,
}: {
  context: CommerceAdminContext;
}) => {
  const contextIdentity =
    context.post?._id?.toString() ?? `new:${context.slug ?? "orders"}`;
  const getMetaValue = context.getMetaValue;
  const setMetaValue = context.setMetaValue;
  const registerMetaPayloadCollector = context.registerMetaPayloadCollector;

  const [note, setNote] = useState("");
  const [priority, setPriority] = useState<string>("medium");

  useEffect(() => {
    const stateKey = contextIdentity;
    const savedNote =
      (getMetaValue?.(ORDER_PLAYGROUND_META_NOTE_KEY) as string | undefined) ??
      playgroundRuntimeState.get(stateKey)?.note ??
      "";
    const savedPriority =
      (getMetaValue?.(ORDER_PLAYGROUND_META_PRIORITY_KEY) as
        | string
        | undefined) ??
      playgroundRuntimeState.get(stateKey)?.priority ??
      "medium";

    setNote(savedNote);
    setPriority(
      ORDER_PLAYGROUND_PRIORITY_OPTIONS.includes(
        savedPriority as (typeof ORDER_PLAYGROUND_PRIORITY_OPTIONS)[number],
      )
        ? savedPriority
        : "medium",
    );
    playgroundRuntimeState.set(stateKey, {
      note: savedNote,
      priority: savedPriority,
    });
  }, [contextIdentity, getMetaValue]);

  useEffect(() => {
    setMetaValue?.(ORDER_PLAYGROUND_META_NOTE_KEY, note);
    console.log("[CommerceOrderMetaBox] Playground note set", note);
    playgroundRuntimeState.set(contextIdentity, {
      note,
      priority,
    });
  }, [contextIdentity, note, priority, setMetaValue]);

  useEffect(() => {
    setMetaValue?.(ORDER_PLAYGROUND_META_PRIORITY_KEY, priority);
    console.log("[CommerceOrderMetaBox] Playground priority set", priority);
    playgroundRuntimeState.set(contextIdentity, {
      note,
      priority,
    });
  }, [contextIdentity, note, priority, setMetaValue]);

  useEffect(() => {
    if (!registerMetaPayloadCollector) {
      return;
    }
    return registerMetaPayloadCollector(() => {
      console.log("[CommerceOrderMetaBox] Playground collector fired", {
        note,
        priority,
      });
      return {
        [ORDER_PLAYGROUND_META_NOTE_KEY]: note,
        [ORDER_PLAYGROUND_META_PRIORITY_KEY]: priority,
      };
    });
  }, [note, priority, registerMetaPayloadCollector]);

  return (
    <MetaBoxFieldset
      title="Demo Meta Box"
      description="Example of the admin-runtime primitives: table layout, columns, and runtime meta persistence."
    >
      <MetaBoxColumns>
        <MetaBoxTable>
          <MetaBoxTableRow
            label="Internal note"
            description="Saved to postsMeta as `order:playground_note`."
          >
            <Textarea
              value={note}
              onChange={(event: ChangeEvent<HTMLTextAreaElement>) =>
                setNote(event.target.value)
              }
              placeholder="Add a short note that only admins can see…"
            />
          </MetaBoxTableRow>
          <MetaBoxTableRow
            label="Priority"
            description="Saved to postsMeta as `order:playground_priority`."
          >
            <select
              className="border-input focus-visible:ring-ring bg-background mt-2 w-full rounded-md border px-3 py-2 text-sm"
              value={priority}
              onChange={(event: ChangeEvent<HTMLSelectElement>) =>
                setPriority(event.target.value)
              }
            >
              {ORDER_PLAYGROUND_PRIORITY_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </option>
              ))}
            </select>
          </MetaBoxTableRow>
        </MetaBoxTable>
      </MetaBoxColumns>
    </MetaBoxFieldset>
  );
};

let orderMetaBoxesRegistered = false;

const registerCommerceOrderMetaBoxHook = () => {
  if (orderMetaBoxesRegistered) {
    return;
  }

  registerMetaBoxHook<CommerceAdminContext>("main", (context) => {
    if (context.slug.toLowerCase() !== COMMERCE_ORDER_POST_TYPE) {
      return null;
    }

    context.visibility = {
      ...(context.visibility ?? {}),
      showGeneralPanel: false,
    };

    return {
      id: "commerce-order-general",
      title: "Order Details",
      description: "Manage customer, address, and line item data.",
      location: "main",
      priority: -50,
      render: () => <CommerceOrderGeneralMetaBox context={context} />,
    };
  });

  registerMetaBoxHook<CommerceAdminContext>("main", (context) => {
    if (context.slug.toLowerCase() !== COMMERCE_ORDER_POST_TYPE) {
      return null;
    }

    return {
      id: "commerce-order-playground",
      title: "Order Playground (Demo)",
      description:
        "Shows how a meta box can collect and persist custom post meta.",
      location: "main",
      priority: 10,
      render: () => <CommerceOrderPlaygroundMetaBox context={context} />,
    };
  });

  orderMetaBoxesRegistered = true;
};

export const registerOrderMetaBoxes = () => {
  registerCommerceOrderMetaBoxHook();
};
