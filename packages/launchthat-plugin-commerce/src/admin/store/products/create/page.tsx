"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";

import ProductForm, { ProductFormData } from "../_components/ProductForm";

export default function CreateProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createProduct = useMutation(
    api.ecommerce.products.mutations.createProduct,
  );

  const handleCreateProduct = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      await createProduct({
        ...data,
        price: data.basePrice, // For backward compatibility
        categoryIds: [],
        images: [],
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
        submitButtonText="Create Product"
      />
    </div>
  );
}
