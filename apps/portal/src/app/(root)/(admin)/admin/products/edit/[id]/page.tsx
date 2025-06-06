"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";

import type { ProductFormData } from "../../_components/ProductForm";
import ProductForm from "../../_components/ProductForm";

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Unwrap params using React.use()
  const unwrappedParams = React.use(params);
  const productId = unwrappedParams.id as Id<"products">;

  const updateProduct = useMutation(api.ecommerce.products.index.updateProduct);
  const product = useQuery(api.ecommerce.products.index.getProduct, {
    productId,
  });

  // Get categories for the select dropdown
  const categories =
    useQuery(api.ecommerce.categories.index.getProductCategories, {
      isActive: true,
    }) ?? [];

  const handleUpdateProduct = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await updateProduct({
        productId,
        ...data,
        // Keep existing values for fields not in the form
        salePrice: product?.salePrice,
        costPrice: product?.costPrice,
        inventoryLevel: product?.stockQuantity,
        tags: product?.tags ?? [],
        metaTitle: product?.metaTitle,
        metaDescription: product?.metaDescription,
        metaKeywords: product?.metaKeywords,
      });

      // Redirect back to catalog
      router.push("/admin/products/catalog");
    } catch (error) {
      console.error("Error updating product:", error);
      alert(
        "Error updating product: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!product) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
        <span className="ml-2 text-lg text-gray-500">Loading product...</span>
      </div>
    );
  }

  // Ensure product has the correct status type for the form
  const typedProduct = {
    ...product,
    status:
      product.status === "draft" ||
      product.status === "active" ||
      product.status === "archived"
        ? (product.status as "draft" | "active" | "archived")
        : "draft", // Default fallback
  };

  return (
    <div className="container p-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={() => router.push("/admin/products/catalog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div>

      <ProductForm
        initialData={typedProduct}
        onSubmit={handleUpdateProduct}
        isSubmitting={isSubmitting}
        categories={categories}
        submitButtonText="Update Product"
      />
    </div>
  );
}
