"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";

import type { AdminMetaBoxContext } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import { toast } from "@acme/ui/toast";

import {
  COMMERCE_ORDER_POST_TYPE,
  decodeOrderPostId,
  encodeOrderPostId,
} from "../adapters";
import { OrderForm } from "../components/orders/OrderForm";

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

type ProductLineItemForUpdate = ProductLineItemForCreate & {
  productSnapshot: NonNullable<CommerceOrderLineItem["productSnapshot"]>;
};

const isProductLineItemForCreate = (
  item: CommerceOrderLineItem,
): item is ProductLineItemForCreate => {
  return item.type === "product" && item.productId !== undefined;
};

const isProductLineItemForUpdate = (
  item: CommerceOrderLineItem,
): item is ProductLineItemForUpdate => {
  return (
    item.type === "product" &&
    item.productId !== undefined &&
    item.productSnapshot !== undefined
  );
};

const allowedPaymentMethods = [
  "credit_card",
  "paypal",
  "apple_pay",
  "google_pay",
  "bank_transfer",
  "crypto",
  "other",
] as const;

type PaymentMethod = (typeof allowedPaymentMethods)[number];

type CommerceAdminContext = AdminMetaBoxContext<Doc<"posts">, Doc<"postTypes">>;

const CommerceOrderGeneralMetaBox = ({
  context,
}: {
  context: CommerceAdminContext;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createOrderMutation = useMutation(
    api.ecommerce.orders.mutations.createOrder,
  );
  const updateOrderMutation = useMutation(
    api.ecommerce.orders.mutations.updateOrder,
  );

  const orderRecordId = useMemo(
    () => decodeOrderPostId(context.post?._id ?? null),
    [context.post?._id],
  );
  const isNewRecord = context.isNewRecord || !orderRecordId;

  const handleSubmit = useCallback(
    async (formData: CommerceOrderFormData) => {
      setIsSubmitting(true);
      try {
        const productItemsForCreate = formData.lineItems.filter(
          isProductLineItemForCreate,
        );
        const productItemsForUpdate = formData.lineItems.filter(
          isProductLineItemForUpdate,
        );
        const shippingItems = formData.lineItems.filter(
          (item) => item.type === "shipping",
        );
        const shippingDetails =
          shippingItems.length > 0 && shippingItems[0]?.shippingMethod
            ? {
                method: shippingItems[0].shippingMethod ?? "shipping",
                description: shippingItems[0].shippingDescription ?? "",
                cost: shippingItems[0].lineTotal,
              }
            : null;
        const shippingTotal = shippingItems.reduce(
          (sum, item) => sum + item.lineTotal,
          0,
        );

        if (isNewRecord) {
          if (productItemsForCreate.length === 0) {
            toast.error("Add at least one product before creating an order.");
            return;
          }
          const subtotal = productItemsForCreate.reduce(
            (sum, item) => sum + item.lineTotal,
            0,
          );
          const tax = subtotal * 0.08;
          const total = subtotal + tax + shippingTotal;

          const { recordId } = await (createOrderMutation({
            userId: formData.userId,
            email: formData.email,
            customerInfo: {
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone ?? undefined,
              company: formData.company ?? undefined,
            },
            items: productItemsForCreate.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            })),
            totalAmount: total,
            notes: formData.notes ?? undefined,
          }) as Promise<{ recordId: Id<"orders"> }>);

          const syntheticId = encodeOrderPostId(recordId);
          toast.success("Order created successfully.");
          router.replace(
            `/admin/edit?post_type=${COMMERCE_ORDER_POST_TYPE}&post_id=${syntheticId}`,
          );
          return;
        }

        if (!orderRecordId) {
          toast.error("Unable to determine order ID.");
          return;
        }

        if (productItemsForUpdate.length === 0) {
          toast.error("Add at least one product before updating an order.");
          return;
        }

        const paymentMethod: PaymentMethod = allowedPaymentMethods.includes(
          formData.paymentMethod as PaymentMethod,
        )
          ? (formData.paymentMethod as PaymentMethod)
          : "other";

        await (updateOrderMutation({
          id: orderRecordId,
          userId: formData.userId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone ?? undefined,
          company: formData.company ?? undefined,
          billingAddress: formData.billingAddress,
          shippingAddress: formData.shippingAddress,
          paymentMethod,
          lineItems: productItemsForUpdate.map((item) => ({
            id: item.id,
            productId: item.productId,
            productSnapshot: item.productSnapshot,
            quantity: item.quantity,
            price: item.price,
            lineTotal: item.lineTotal,
          })),
          shipping: shippingTotal,
          shippingDetails,
          notes: formData.notes ?? undefined,
          differentShippingAddress: formData.differentShippingAddress,
          createdAt: formData.createdAt
            ? formData.createdAt.getTime()
            : undefined,
        }) as Promise<{ success: boolean }>);
        toast.success("Order updated successfully.");
      } catch (error) {
        console.error("[CommerceOrderGeneralMetaBox] submission failed", error);
        toast.error("Unable to save this order. Please try again.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      createOrderMutation,
      isNewRecord,
      orderRecordId,
      router,
      updateOrderMutation,
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

  const resolvedOrderId =
    !isNewRecord && orderRecordId ? orderRecordId : undefined;

  return (
    <OrderForm
      orderId={resolvedOrderId}
      onSubmit={handleOrderFormSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      submitButtonText={isNewRecord ? "Create Order" : "Update Order"}
    />
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

  orderMetaBoxesRegistered = true;
};

export const registerOrderMetaBoxes = () => {
  registerCommerceOrderMetaBoxHook();
};
