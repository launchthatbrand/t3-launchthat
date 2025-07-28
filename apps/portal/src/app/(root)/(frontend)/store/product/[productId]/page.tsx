"use client";

import { ArrowLeft, Package, ShoppingCart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Id } from "@convex-config/_generated/dataModel";
import Link from "next/link";
import React from "react";
import { api } from "@convex-config/_generated/api";
import { useParams } from "next/navigation";
import { useQuery } from "convex/react";

export default function ProductPage() {
  const params = useParams();
  const productId = params.productId as string;

  // Get product information
  const product = useQuery(api.ecommerce.products.index.getProduct, {
    productId: productId as Id<"products">,
  });

  // Get linked courses for this product
  const linkedCourses = useQuery(api.lms.courses.queries.listCourses, {});

  if (product === undefined) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="mt-2 text-sm text-gray-600">Loading product...</p>
        </div>
      </div>
    );
  }

  if (product === null) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="mx-auto max-w-md">
          <CardHeader className="text-center">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <CardTitle>Product Not Found</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600">
              The product you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link href="/courses">Browse Available Courses</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Find courses linked to this product
  const relatedCourses =
    linkedCourses?.filter((course) => course.productId === productId) ?? [];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/store/product" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Products
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Product Information */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-2xl">{product.name}</CardTitle>
                <Badge variant="secondary" className="text-lg font-semibold">
                  ${product.price}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {product.description && (
                <div>
                  <h3 className="mb-2 text-lg font-semibold">Description</h3>
                  <p className="text-gray-600">{product.description}</p>
                </div>
              )}

              {/* Related Courses */}
              {relatedCourses.length > 0 && (
                <div>
                  <h3 className="mb-4 text-lg font-semibold">
                    What You'll Get Access To:
                  </h3>
                  <div className="space-y-3">
                    {relatedCourses.map((course) => (
                      <Card
                        key={course._id}
                        className="border-l-4 border-l-primary"
                      >
                        <CardContent className="p-4">
                          <h4 className="font-semibold">{course.title}</h4>
                          {course.description && (
                            <p className="mt-1 text-sm text-gray-600">
                              {course.description}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Purchase Section */}
        <div className="lg:col-span-1">
          <Card className="sticky top-4">
            <CardHeader className="text-center">
              <CardTitle>Get Instant Access</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  ${product.price}
                </div>
                <p className="text-sm text-gray-600">One-time payment</p>
              </div>

              <Button className="w-full" size="lg">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Purchase Now
              </Button>

              {relatedCourses.length > 0 && (
                <div className="text-center text-sm text-gray-600">
                  <p>
                    ✓ Instant access to {relatedCourses.length} course
                    {relatedCourses.length > 1 ? "s" : ""}
                  </p>
                  <p>✓ Lifetime access</p>
                  <p>✓ All future updates included</p>
                </div>
              )}

              <div className="border-t pt-4 text-center">
                <p className="text-xs text-gray-500">
                  Secure checkout powered by our payment system
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
