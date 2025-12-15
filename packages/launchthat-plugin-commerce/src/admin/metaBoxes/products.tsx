"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";

import type { AdminMetaBoxContext } from "@acme/admin-runtime";
import { registerMetaBoxHook } from "@acme/admin-runtime";
import { toast } from "@acme/ui/toast";

import type {
  ProductData,
  ProductFormData,
} from "../store/products/_components/ProductForm";
import {
  decodeCommerceSyntheticId,
  encodeCommerceSyntheticId,
} from "../../lib/customAdapters";
import { COMMERCE_PRODUCT_POST_TYPE, isCommerceProductSlug } from "../adapters";
import { PRODUCT_META_KEYS } from "../constants";
import ProductForm from "../store/products/_components/ProductForm";

type CommerceAdminContext = AdminMetaBoxContext<Doc<"posts">, Doc<"postTypes">>;

const PRODUCT_META_PAYLOAD_DEFAULT: ProductFormData = {
  name: "",
  description: "",
  shortDescription: "",
  basePrice: 0,
  sku: "",
  status: "draft",
  isVisible: false,
  isDigital: false,
  hasVariants: false,
  featuredImages: [],
  images: [],
  taxable: true,
  isFeatured: false,
  stockStatus: "in_stock",
  inventoryLevel: undefined,
  tags: [],
  metaTitle: undefined,
  metaDescription: undefined,
  metaKeywords: undefined,
};

const slugify = (value: string) =>
  value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
    .trim();

const mapProductStatusToPostStatus = (
  status: ProductFormData["status"],
): "draft" | "published" | "archived" => {
  if (status === "active") {
    return "published";
  }
  if (status === "archived") {
    return "archived";
  }
  return "draft";
};

const mapPostStatusToProductStatus = (
  status?: Doc<"posts">["status"] | null,
): ProductFormData["status"] => {
  if (status === "published") {
    return "active";
  }
  if (status === "archived") {
    return "archived";
  }
  return "draft";
};

const parseProductPayload = (value?: string | null): ProductFormData | null => {
  if (!value) {
    return null;
  }
  try {
    const parsed = JSON.parse(value) as ProductFormData;
    return parsed;
  } catch {
    return null;
  }
};

const buildProductMeta = (
  data: ProductFormData,
): Record<string, string | number | boolean | null> => ({
  [PRODUCT_META_KEYS.payload]: JSON.stringify(data),
  [PRODUCT_META_KEYS.price]: data.basePrice ?? 0,
  [PRODUCT_META_KEYS.status]: data.status,
  [PRODUCT_META_KEYS.sku]: data.sku ?? "",
  [PRODUCT_META_KEYS.visibility]: data.isVisible,
});

const buildProductTitle = (data: ProductFormData) =>
  data.name?.trim() || "Untitled Product";

const buildProductExcerpt = (data: ProductFormData) =>
  data.shortDescription ?? "";

const buildProductContent = (data: ProductFormData) => {
  const lines = [
    data.description ?? "",
    data.shortDescription ? `Summary: ${data.shortDescription}` : null,
    data.sku ? `SKU: ${data.sku}` : null,
    typeof data.basePrice === "number"
      ? `Price: $${data.basePrice.toFixed(2)}`
      : null,
  ].filter(Boolean);
  return lines.join("\n");
};

const buildProductSlug = (data: ProductFormData) => {
  const base =
    data.name?.trim() ||
    data.sku?.trim() ||
    `product-${Date.now().toString(36)}`;
  return slugify(base);
};

const CommerceProductMetaBox = ({
  context,
}: {
  context: CommerceAdminContext;
}) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createCommercePost = useMutation(
    api.plugins.commerce.mutations.createPost,
  );
  const updateCommercePost = useMutation(
    api.plugins.commerce.mutations.updatePost,
  );

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

  const storedPayload = context.getMetaValue?.(PRODUCT_META_KEYS.payload) as
    | string
    | undefined;

  const parsedPayload = useMemo<ProductFormData | null>(() => {
    return parseProductPayload(storedPayload);
  }, [storedPayload]);

  const initialData = useMemo<Partial<ProductData> | undefined>(() => {
    if (!parsedPayload && !context.post) {
      return undefined;
    }
    const payload = parsedPayload ?? PRODUCT_META_PAYLOAD_DEFAULT;
    const featuredImages = payload.featuredImages ?? payload.images ?? [];
    const inventoryLevel =
      payload.inventoryLevel ??
      (typeof (payload as ProductData).stockQuantity === "number"
        ? (payload as ProductData).stockQuantity
        : undefined);

    return {
      name: payload.name ?? context.post?.title ?? "",
      description: payload.description ?? context.post?.content ?? "",
      shortDescription: payload.shortDescription ?? context.post?.excerpt ?? "",
      price: payload.basePrice ?? payload.basePrice ?? 0,
      basePrice: payload.basePrice ?? 0,
      sku: payload.sku ?? "",
      status:
        payload.status ??
        mapPostStatusToProductStatus(context.post?.status ?? null),
      isVisible: payload.isVisible ?? true,
      isDigital: payload.isDigital ?? false,
      hasVariants: payload.hasVariants ?? false,
      taxable: payload.taxable ?? true,
      isFeatured: payload.isFeatured ?? false,
      stockStatus: payload.stockStatus ?? "in_stock",
      stockQuantity: inventoryLevel ?? 0,
      featuredImages,
      images: featuredImages,
      tags: payload.tags,
      metaTitle: payload.metaTitle,
      metaDescription: payload.metaDescription,
      metaKeywords: payload.metaKeywords,
    };
  }, [context.post, parsedPayload]);

  const handleSubmit = useCallback(
    async (formData: ProductFormData) => {
      setIsSubmitting(true);
      try {
        const meta = buildProductMeta(formData);
        const title = buildProductTitle(formData);
        const excerpt = buildProductExcerpt(formData);
        const content = buildProductContent(formData);
        const slug = buildProductSlug(formData);
        const status = mapProductStatusToPostStatus(formData.status);

        if (isNewRecord) {
          const componentId = await createCommercePost({
            title,
            content,
            excerpt,
            slug,
            status,
            postTypeSlug: COMMERCE_PRODUCT_POST_TYPE,
            meta,
            organizationId: organizationIdString,
          });
          const syntheticId = encodeCommerceSyntheticId(
            COMMERCE_PRODUCT_POST_TYPE,
            componentId,
          );
          toast.success("Product created successfully.");
          router.replace(
            `/admin/edit?post_type=${COMMERCE_PRODUCT_POST_TYPE}&post_id=${syntheticId}`,
          );
          return;
        }

        if (!commerceInfo) {
          toast.error("Unable to determine product ID.");
          return;
        }

        await updateCommercePost({
          id: commerceInfo.componentId,
          title,
          content,
          excerpt,
          slug,
          status,
          meta,
        });
        toast.success("Product updated successfully.");
      } catch (error) {
        console.error("[CommerceProductMetaBox] submission failed", error);
        toast.error("Unable to save this product. Please try again.");
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

  const registerBeforeSaveHandler = useCallback(
    (handler: () => Promise<void>) => {
      if (!context.registerBeforeSave) {
        return undefined;
      }
      return context.registerBeforeSave(async () => {
        await handler();
      });
    },
    [context.registerBeforeSave],
  );

  return (
    <ProductForm
      initialData={initialData}
      onSubmit={handleSubmit}
      isSubmitting={isSubmitting}
      submitButtonText={isNewRecord ? "Create Product" : "Update Product"}
      onRegisterBeforeSave={registerBeforeSaveHandler}
    />
  );
};

let productMetaBoxesRegistered = false;

export const registerProductMetaBoxes = () => {
  if (productMetaBoxesRegistered) {
    return;
  }

  registerMetaBoxHook<CommerceAdminContext>("main", (context) => {
    if (!isCommerceProductSlug(context.slug)) {
      return null;
    }

    context.visibility = {
      ...(context.visibility ?? {}),
      showGeneralPanel: false,
    };

    return {
      id: "commerce-product-general",
      title: "Product Details",
      description: "Manage the core product information and pricing.",
      location: "main",
      priority: -50,
      render: () => <CommerceProductMetaBox context={context} />,
    };
  });

  productMetaBoxesRegistered = true;
};
