import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { ExternalLink, Package, Unlink } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

export interface LinkedProductProps {
  contentType: "course" | "lesson" | "topic";
  contentId: string;
  currentProductId?: string;
  onProductLinked?: (productId: string | undefined) => void;
  className?: string;
}

export const LinkedProduct: React.FC<LinkedProductProps> = ({
  contentType,
  contentId,
  currentProductId,
  onProductLinked,
  className,
}) => {
  const [selectedProductId, setSelectedProductId] = useState<
    string | undefined
  >(currentProductId);
  const [isLoading, setIsLoading] = useState(false);

  // Get all available products
  const products = useQuery(api.ecommerce.products.queries.listProducts, {
    isVisible: true,
    status: "active",
  });

  // Get the currently linked product details
  const linkedProduct = useQuery(
    api.ecommerce.products.queries.getProductById,
    currentProductId
      ? { productId: currentProductId as Id<"products"> }
      : "skip",
  );

  // Mutation to update course with linked product
  const updateCourse = useMutation(api.lms.courses.mutations.updateCourse);

  const handleLinkProduct = async () => {
    if (contentType !== "course") {
      toast.error("Product linking is currently only supported for courses");
      return;
    }

    setIsLoading(true);
    try {
      await updateCourse({
        courseId: contentId as Id<"courses">,
        productId: selectedProductId
          ? (selectedProductId as Id<"products">)
          : undefined,
      });

      onProductLinked?.(selectedProductId);
      toast.success(
        selectedProductId
          ? "Product linked successfully"
          : "Product unlinked successfully",
      );
    } catch (error) {
      console.error("Error linking product:", error);
      toast.error("Failed to link product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlinkProduct = async () => {
    setSelectedProductId(undefined);
    setIsLoading(true);
    try {
      await updateCourse({
        courseId: contentId as Id<"courses">,
        productId: undefined,
      });

      onProductLinked?.(undefined);
      toast.success("Product unlinked successfully");
    } catch (error) {
      console.error("Error unlinking product:", error);
      toast.error("Failed to unlink product");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProductChange = (value: string) => {
    const productId = value === "none" ? undefined : value;
    setSelectedProductId(productId);
    setHasChanges(true);
  };

  if (products === undefined) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-primary"></div>
            <span className="ml-2">Loading products...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Linked Product
        </CardTitle>
        <CardDescription>
          Link this {contentType} to a product that users can purchase to gain
          access. When access is restricted, users will see a "Buy Now" button
          for the linked product.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Linked Product Display */}
        {currentProductId && linkedProduct && (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-green-900">
                  Currently Linked Product
                </h4>
                <p className="text-sm text-green-700">{linkedProduct.name}</p>
                <div className="mt-2 flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="border-green-300 text-green-700"
                  >
                    ${(linkedProduct.price / 100).toFixed(2)}
                  </Badge>
                  {linkedProduct.slug && (
                    <Button
                      variant="ghost"
                      size="sm"
                      asChild
                      className="text-green-700 hover:text-green-900"
                    >
                      <a
                        href={`/store/product/${linkedProduct.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        View Product Page
                      </a>
                    </Button>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkProduct}
                disabled={isLoading}
                className="border-red-300 text-red-600 hover:border-red-400 hover:text-red-700"
              >
                <Unlink className="mr-1 h-4 w-4" />
                Unlink
              </Button>
            </div>
          </div>
        )}

        {/* Product Selection */}
        <div className="space-y-3">
          <Label htmlFor="product-select">
            {currentProductId
              ? "Change Linked Product"
              : "Select Product to Link"}
          </Label>
          <Select
            value={selectedProductId ?? "none"}
            onValueChange={handleProductChange}
          >
            <SelectTrigger id="product-select">
              <SelectValue placeholder="Choose a product..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No product linked</SelectItem>
              {products?.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  <div className="flex w-full items-center justify-between">
                    <span>{product.name}</span>
                    <Badge variant="secondary" className="ml-2">
                      ${(product.price / 100).toFixed(2)}
                    </Badge>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleLinkProduct}
            disabled={isLoading || selectedProductId === currentProductId}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                Updating...
              </>
            ) : selectedProductId ? (
              "Link Product"
            ) : (
              "Remove Product Link"
            )}
          </Button>
        </div>

        {/* Help Text */}
        <div className="space-y-1 text-xs text-muted-foreground">
          <p>
            • When a product is linked, users who don't have access will see a
            "Buy Now" button
          </p>
          <p>
            • The button will redirect them to the product page where they can
            make a purchase
          </p>
          <p>
            • After purchase, they will gain access to this content
            automatically
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
