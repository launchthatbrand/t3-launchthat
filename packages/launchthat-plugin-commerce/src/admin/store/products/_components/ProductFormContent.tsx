"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import React, { useEffect, useState } from "react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Textarea } from "@acme/ui/textarea";

// Define minimal form props interface for now
interface AdminPostFormProps {
  formData?: unknown;
  onSave: (data: unknown) => Promise<void>;
  isSubmitting: boolean;
}

// Product form data interface
export interface ProductFormData {
  name: string;
  description: string;
  shortDescription?: string;
  basePrice: number;
  salePrice?: number;
  costPrice?: number;
  sku: string;
  stockStatus?: "in_stock" | "out_of_stock";
  inventoryLevel?: number;
  status: "draft" | "active" | "archived";
  isVisible: boolean;
  isDigital: boolean;
  hasVariants: boolean;
  taxable: boolean;
  isFeatured: boolean;
  tags?: string[];
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
}

export interface ProductData extends ProductFormData {
  _id: Id<"products">;
  _creationTime: number;
  slug: string;
  createdAt: number;
  updatedAt: number;
  priceInCents?: number;
  price?: number;
  stockQuantity?: number;
}

// Extended props for ProductFormContent
export interface ProductFormContentProps extends AdminPostFormProps {}

export const ProductFormContent: React.FC<ProductFormContentProps> = ({
  onSave,
  isSubmitting,
  formData: initialData,
}) => {
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: 0,
    sku: "",
    status: "draft" as "draft" | "active" | "archived",
    isVisible: false,
    isDigital: false,
    hasVariants: false,
    taxable: true,
    isFeatured: false,
    stockQuantity: 0,
    stockStatus: "in_stock" as "in_stock" | "out_of_stock",
  });

  // Load initial data when component mounts or initialData changes
  useEffect(() => {
    if (initialData) {
      const productData = initialData as Partial<ProductData>;
      setFormData({
        name: productData.name ?? "",
        description: productData.description ?? "",
        shortDescription: productData.shortDescription ?? "",
        price: productData.basePrice ?? productData.price ?? 0,
        sku: productData.sku ?? "",
        status: productData.status ?? "draft",
        isVisible: productData.isVisible ?? false,
        isDigital: productData.isDigital ?? false,
        hasVariants: productData.hasVariants ?? false,
        taxable: productData.taxable ?? true,
        isFeatured: productData.isFeatured ?? false,
        stockQuantity:
          productData.stockQuantity ?? productData.inventoryLevel ?? 0,
        stockStatus: productData.stockStatus ?? "in_stock",
      });
    }
  }, [initialData]);

  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  };

  // Handle select changes
  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!onSave) return;

    // Ensure we have a valid status
    if (!["draft", "active", "archived"].includes(formData.status)) {
      alert("Please select a valid status");
      return;
    }

    // Use price directly (supports decimals like 0.13, 9.99, 999)
    const price = parseFloat(formData.price.toString());

    // Calculate inventory level based on stockQuantity
    let inventoryLevel: number | undefined;

    if (formData.isDigital) {
      // Digital products don't need inventory tracking
      inventoryLevel = undefined;
    } else {
      // Use stockQuantity if provided, otherwise undefined (unlimited)
      inventoryLevel = formData.stockQuantity
        ? parseInt(formData.stockQuantity.toString()) || undefined
        : undefined;
    }

    const productData = initialData as Partial<ProductData>;
    const productFormData: ProductFormData = {
      name: formData.name,
      description: formData.description,
      shortDescription: formData.shortDescription || undefined,
      basePrice: price,
      sku: formData.sku,
      stockStatus: formData.stockStatus,
      inventoryLevel,
      status: formData.status,
      isVisible: formData.isVisible,
      isDigital: formData.isDigital,
      hasVariants: formData.hasVariants,
      taxable: formData.taxable,
      isFeatured: formData.isFeatured,
      tags: productData?.tags ?? [],
      metaTitle: productData?.metaTitle,
      metaDescription: productData?.metaDescription,
      metaKeywords: productData?.metaKeywords,
    };

    await onSave(productFormData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              Enter the essential details for your product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shortDescription">Short Description</Label>
              <Input
                id="shortDescription"
                name="shortDescription"
                placeholder="Brief description (displayed in listings)"
                value={formData.shortDescription}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Detailed product description"
                rows={5}
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="Product SKU"
                value={formData.sku}
                onChange={handleChange}
                required
              />
            </div>
          </CardContent>
        </Card>

        {/* Pricing & Inventory */}
        <Card>
          <CardHeader>
            <CardTitle>Pricing & Inventory</CardTitle>
            <CardDescription>
              Set pricing and manage inventory for your product.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stockStatus">Stock Status</Label>
              <Select
                value={formData.stockStatus}
                onValueChange={(value) =>
                  handleSelectChange(
                    "stockStatus",
                    value as "in_stock" | "out_of_stock",
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_stock">In Stock</SelectItem>
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!formData.isDigital && (
              <div className="space-y-2">
                <Label htmlFor="stockQuantity">Stock Quantity</Label>
                <Input
                  id="stockQuantity"
                  name="stockQuantity"
                  type="number"
                  placeholder="Enter quantity (leave empty for unlimited)"
                  value={formData.stockQuantity || ""}
                  onChange={handleChange}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Submit button - this will be hidden when used in AdminSinglePostLayout */}
      <div className="mt-6 flex justify-end space-x-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save Product"}
        </Button>
      </div>
    </form>
  );
};

export default ProductFormContent;
