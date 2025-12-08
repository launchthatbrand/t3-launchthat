"use client";

import type { Id } from "src/lib/types";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { Button } from "@acme/ui/button";

import type { ProductFormData } from "../../_components/ProductForm";
import ProductForm from "../../_components/ProductForm";
import { useStoreRouteSegments } from "../../../StoreRouteContext";

export default function EditProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const segments = useStoreRouteSegments();
  const productId = segments[2] as Id<"products"> | undefined;

  if (!productId) {
    return (
      <div className="text-muted-foreground flex h-full w-full items-center justify-center">
        Unable to determine product from URL.
      </div>
    );
  }

  const updateProduct = useMutation(
    api.ecommerce.products.mutations.updateProduct,
  );
  const product = useQuery(api.ecommerce.products.queries.getProductById, {
    productId,
  });

  const handleUpdateProduct = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await updateProduct({
        productId,
        ...data,
        // Keep existing values for fields not in the form
        salePrice: product?.salePrice,
        costPrice: product?.costPrice,
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
      {/* <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          className="mr-2"
          onClick={() => router.push("/admin/products/catalog")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Edit Product</h1>
      </div> */}

      <ProductForm
        initialData={typedProduct}
        onSubmit={handleUpdateProduct}
        isSubmitting={isSubmitting}
        submitButtonText="Update Product"
      />
    </div>
  );
}
