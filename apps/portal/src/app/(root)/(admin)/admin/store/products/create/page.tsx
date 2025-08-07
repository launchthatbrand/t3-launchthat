"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";

import ProductForm, { ProductFormData } from "../_components/ProductForm";

export default function CreateProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProduct = useMutation(api.ecommerce.mutations.createProduct);

  // Fetch categories for the form
  const categories =
    useQuery(api.ecommerce.queries.getProductCategories, {
      isActive: true,
    }) ?? [];

  const handleCreateProduct = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await createProduct({
        ...data,
        price: data.basePrice, // For backward compatibility
      });

      // Redirect back to catalog
      router.push("/admin/products/catalog");
    } catch (error) {
      console.error("Error creating product:", error);
      alert(
        "Error creating product: " +
          (error instanceof Error ? error.message : String(error)),
      );
    } finally {
      setIsSubmitting(false);
    }
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
        <h1 className="text-3xl font-bold">Create New Product</h1>
      </div>

      <ProductForm
        onSubmit={handleCreateProduct}
        isSubmitting={isSubmitting}
        categories={categories}
        submitButtonText="Create Product"
      />
    </div>
  );
}
