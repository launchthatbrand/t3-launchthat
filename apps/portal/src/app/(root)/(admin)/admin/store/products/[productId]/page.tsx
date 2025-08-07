"use client";

// Load plugins (self-register on import)
import "~/plugins";

import type { Doc, Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";

import type { ProductImage } from "../_components/FeaturedImagesUpload";
import type { ProductFormData } from "../_components/ProductFormContent";
import {
  AdminLayoutContent,
  AdminLayoutMain,
  AdminLayoutSidebar,
  useAdminLayout,
} from "~/components/admin/AdminLayout";
import {
  MediaTabContent,
  SEOTabContent,
} from "~/components/admin/AdminSinglePostLayout";
import { usePluginTabs } from "~/lib/hooks";
import { ProductFormContent } from "../_components/ProductFormContent";
import { ProductSettings } from "../_components/ProductSettings";

// Helper function to generate slug from product name
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
};

export default function EditProductPage({
  params,
}: {
  params: Promise<{ productId: string }>;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [productImages, setProductImages] = useState<ProductImage[]>([]);
  const [seoData, setSeoData] = useState({
    slug: "",
    metaTitle: "",
    metaDescription: "",
  });

  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.productId as Id<"products">;

  // Convex mutations and queries
  const updateProduct = useMutation(api.ecommerce.products.index.updateProduct);
  const product = useQuery(api.ecommerce.products.index.getProduct, {
    productId,
  });

  // Get categories for the select dropdown
  const categories =
    useQuery(api.ecommerce.categories.index.getProductCategories, {
      isActive: true,
    }) ?? [];

  // Hook context for plugins - MUST be called before any conditional returns
  const hookContext = {
    postType: "product",
    postId: productId,
    userId: undefined, // You'd get this from auth
    isSubmitting,
    formData: product,
  };

  // Get plugin tabs - MUST be called before any conditional returns
  const pluginTabs = usePluginTabs([], hookContext);

  // Get current active tab from AdminLayout context
  const { activeTab } = useAdminLayout();

  // Handle product updates for settings
  const handleProductUpdate = async (updates: Partial<Doc<"products">>) => {
    try {
      setIsSubmitting(true);
      await updateProduct({
        productId,
        ...updates,
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
        ...productData,
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
            <div className="text-xs text-muted-foreground">SKU</div>
            <div className="font-mono text-sm">{product.sku}</div>
          </div>

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground">Price</div>
            <div className="text-sm font-semibold">
              ${(product.basePrice || product.price || 0).toFixed(2)}
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground">Stock Status</div>
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
              <div className="text-xs text-muted-foreground">Inventory</div>
              <div className="text-sm">{product.inventoryLevel} units</div>
            </div>
          )}

          <Separator />

          <div>
            <div className="text-xs text-muted-foreground">Created</div>
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
            categories={categories}
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
          return <pluginTab.component {...hookContext} />;
        }

        // Default to details tab
        return (
          <ProductFormContent
            formData={typedProduct}
            onSave={handleFormSave}
            isSubmitting={isSubmitting}
            categories={categories}
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
