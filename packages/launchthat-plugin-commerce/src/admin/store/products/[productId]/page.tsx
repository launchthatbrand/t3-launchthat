"use client";

import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
  useAdminLayout,
} from "../../../ui/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import {
  MediaTabContent,
  SEOTabContent,
} from "../../../ui/AdminSinglePostLayout";
import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Label } from "@acme/ui/label";
import { Loader2 } from "lucide-react";
import { ProductFormContent } from "../_components/ProductFormContent";
import type { ProductFormData } from "../_components/ProductFormContent";
import type { ProductImage } from "../_components/FeaturedImagesUpload";
import { ProductSettings } from "../_components/ProductSettings";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import { api } from "@portal/convexspec";
import { toast } from "sonner";
import { usePluginTabs } from "../../../../lib/hooks";
import { useRouter } from "next/navigation";
import { useStoreRouteSegments } from "../../StoreRouteContext";

// Helper function to generate slug from product name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export default function EditProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [seoData, setSeoData] = useState({
    slug: "",
    metaTitle: "",
    metaDescription: "",
  });
  const segments = useStoreRouteSegments();
  const productId = segments[1] as Id<"products"> | undefined;

  if (!productId) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center">
        Unable to determine product from the current URL.
      </div>
    );
  }

  // Convex mutations and queries
  const updateProduct = useMutation(
    api.ecommerce.products.mutations.updateProduct,
  );
  const product = useQuery(api.ecommerce.products.queries.getProductById, {
    productId,
  });

  // Hook context for plugins - MUST be called before any conditional returns
  const hookContext = {
    postType: "product",
    postId: productId,
    userId: undefined, // You'd get this from auth
    isSubmitting,
    formData: product,
  };

  // Get plugin tabs - MUST be called before any conditional returns
  type PluginTab = { id: string; component: React.ComponentType<any> };
  const pluginTabs = usePluginTabs<PluginTab>([], hookContext);

  // Get current active tab from AdminLayout context
  const { activeTab } = useAdminLayout();

  type ProductUpdateInput = Omit<Partial<Doc<"products">>, "status"> & {
    status?: "draft" | "active" | "archived";
  };

  const coerceStatus = (
    status: string | undefined,
  ): ProductUpdateInput["status"] => {
    if (status === "draft" || status === "active" || status === "archived") {
      return status;
    }
    return undefined;
  };

  const sanitizeUpdates = (
    updates: Partial<Doc<"products">>,
  ): ProductUpdateInput => {
    const { status: rawStatus, ...rest } = updates;
    if (!rawStatus) {
      return rest;
    }
    const status = coerceStatus(rawStatus as string | undefined);
    if (status) {
      return { ...rest, status };
    }
    return rest;
  };

  // Handle product updates for settings
  const handleProductUpdate = async (updates: Partial<Doc<"products">>) => {
    try {
      setIsSubmitting(true);
      await updateProduct({
        productId,
        ...sanitizeUpdates(updates),
      });
      toast.success("Product updated successfully");
    } catch (error) {
      toast.error("Failed to update product");
      console.error("Error updating product:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Initialize SEO data when product loads
  React.useEffect(() => {
    if (product) {
      setSeoData({
        slug: product.slug || generateSlug(product.name),
        metaTitle: product.metaTitle || product.name,
        metaDescription:
          product.metaDescription || product.shortDescription || "",
      });

      // Initialize images if they exist
      if (product.images) {
        setProductImages(product.images as ProductImage[]);
      }
    }
  }, [product]);

  const handleFormSave = async (data: unknown) => {
    const productData = data as ProductFormData;

    setIsSubmitting(true);
    try {
      await updateProduct({
        productId,
        ...sanitizeUpdates(productData as Partial<Doc<"products">>),
        images: productImages, // Include images from media tab
        metaTitle: seoData.metaTitle,
        metaDescription: seoData.metaDescription,
        // Keep existing values for fields not in the form
        salePrice: product?.salePrice,
        costPrice: product?.costPrice,
        tags: product?.tags ?? [],
        metaKeywords: product?.metaKeywords,
      });
      toast.success("Product updated successfully");
    } catch (error) {
      console.error("Error updating product:", error);
      toast.error(
        "Error updating product: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Media tab handlers
  const handleImageAdded = (image: ProductImage) => {
    setProductImages((prev) => [...prev, image]);
    toast.success("Image uploaded successfully");
  };

  const handleImageRemoved = (index: number) => {
    setProductImages((prev) => prev.filter((_, i) => i !== index));
    toast.success("Image removed");
  };

  const handleImageUpdated = (
    index: number,
    updates: Partial<ProductImage>,
  ) => {
    setProductImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, ...updates } : img)),
    );
  };

  // Loading state
  if (!product) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <span className="ml-2 text-lg text-gray-500">Loading product...</span>
      </div>
    );
  }

  // Ensure product has the correct status type
  const typedProduct = {
    ...product,
    status:
      product.status === "draft" ||
      product.status === "active" ||
      product.status === "archived"
        ? (product.status as "draft" | "active" | "archived")
        : "draft", // Default fallback
  };

  // Sidebar content
  const sidebarContent = (
    <div className="space-y-4">
      {/* Product Settings */}
      <ProductSettings
        product={product}
        onUpdate={handleProductUpdate}
        isSubmitting={isSubmitting}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Product Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <div className="text-muted-foreground text-xs">SKU</div>
            <div className="font-mono text-sm">{product.sku}</div>
          </div>

          <Separator />

          <div>
            <div className="text-muted-foreground text-xs">Price</div>
            <div className="text-sm font-semibold">
              ${(product.basePrice || product.price || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-muted-foreground text-xs">Stock Status</div>
            <Badge
              variant={
                product.stockStatus === "in_stock" ? "default" : "destructive"
              }
            >
              {product.stockStatus === "in_stock" ? "In Stock" : "Out of Stock"}
            </Badge>
          </div>

          {product.inventoryLevel && (
            <div>
              <div className="text-muted-foreground text-xs">Inventory</div>
              <div className="text-sm">{product.inventoryLevel} units</div>
            </div>
          )}

          <Separator />

          <div>
            <div className="text-muted-foreground text-xs">Created</div>
            <div className="text-sm">
              {new Date(product._creationTime).toLocaleDateString()}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case "details":
        return (
          <ProductFormContent
            formData={typedProduct}
            onSave={handleFormSave}
            isSubmitting={isSubmitting}
          />
        );

      case "media":
        return (
          <MediaTabContent
            images={productImages}
            onImageAdded={handleImageAdded}
            onImageRemoved={handleImageRemoved}
            onImageUpdated={handleImageUpdated}
            maxFiles={5}
            acceptedFileTypes={[
              "image/jpeg",
              "image/png",
              "image/webp",
              "image/gif",
            ]}
            maxFileSize={5 * 1024 * 1024} // 5MB
          />
        );

      case "seo":
        return (
          <SEOTabContent
            slug={seoData.slug}
            metaTitle={seoData.metaTitle}
            metaDescription={seoData.metaDescription}
            onSlugChange={(slug) => setSeoData((prev) => ({ ...prev, slug }))}
            onMetaTitleChange={(title) =>
              setSeoData((prev) => ({ ...prev, metaTitle: title }))
            }
            onMetaDescriptionChange={(desc) =>
              setSeoData((prev) => ({ ...prev, metaDescription: desc }))
            }
            urlPreview="https://yourstore.com/products/"
          />
        );

      default:
        // Check for plugin tabs
        const pluginTab = pluginTabs.find((tab) => tab.id === activeTab);
        if (pluginTab) {
          const PluginComponent = pluginTab.component;
          return <PluginComponent {...hookContext} />;
        }

        // Default to details tab
        return (
          <ProductFormContent
            formData={typedProduct}
            onSave={handleFormSave}
            isSubmitting={isSubmitting}
          />
        );
    }
  };

  return (
    <AdminLayoutContent withSidebar>
      <AdminLayoutMain>{renderTabContent()}</AdminLayoutMain>

      <AdminLayoutSidebar>{sidebarContent}</AdminLayoutSidebar>
    </AdminLayoutContent>
  );
}
