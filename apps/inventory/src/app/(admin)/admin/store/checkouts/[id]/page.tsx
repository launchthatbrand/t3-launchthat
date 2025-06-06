"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { ChevronLeft, ExternalLink, Loader2, Save, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

export default function EditCustomCheckoutPage() {
  const params = useParams();
  const router = useRouter();
  const checkoutId = params.id as string;
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [checkout, setCheckout] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("general");

  // Fetch data
  const customCheckouts = useConvexQuery(
    api.ecommerce.checkout.customCheckouts.getAllCustomCheckouts,
    {},
  );

  const products = useConvexQuery(api.ecommerce.products.getAllProducts, {});

  // Mutations
  const updateCustomCheckout = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.updateCustomCheckout,
  );

  const deleteCustomCheckout = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.deleteCustomCheckout,
  );

  // Initialize checkout state from fetched data
  useEffect(() => {
    if (customCheckouts && Array.isArray(customCheckouts)) {
      const foundCheckout = customCheckouts.find((c) => c._id === checkoutId);

      if (foundCheckout) {
        setCheckout({
          ...foundCheckout,
          collectEmail: foundCheckout.collectEmail ?? true,
          collectName: foundCheckout.collectName ?? true,
          collectPhone: foundCheckout.collectPhone ?? false,
          collectShippingAddress: foundCheckout.collectShippingAddress ?? false,
          collectBillingAddress: foundCheckout.collectBillingAddress ?? false,
          allowCoupons: foundCheckout.allowCoupons ?? true,
        });
      }
    }
  }, [customCheckouts, checkoutId]);

  const handleSaveCheckout = async () => {
    if (!checkout) return;

    try {
      setIsSaving(true);

      // Validate inputs
      if (!checkout.title || !checkout.slug) {
        toast.error("Title and slug are required");
        return;
      }

      if (checkout.productIds.length === 0) {
        toast.error("At least one product must be selected");
        return;
      }

      // Update the checkout
      await updateCustomCheckout({
        id: checkout._id,
        title: checkout.title,
        description: checkout.description,
        productIds: checkout.productIds,
        collectEmail: checkout.collectEmail,
        collectName: checkout.collectName,
        collectPhone: checkout.collectPhone,
        collectShippingAddress: checkout.collectShippingAddress,
        collectBillingAddress: checkout.collectBillingAddress,
        allowCoupons: checkout.allowCoupons,
        status: checkout.status,
      });

      toast.success("Custom checkout updated successfully");
    } catch (error) {
      console.error("Failed to update custom checkout:", error);
      toast.error("Failed to update custom checkout", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCheckout = async () => {
    if (!checkout) return;

    if (confirm("Are you sure you want to delete this custom checkout?")) {
      try {
        setIsDeleting(true);
        await deleteCustomCheckout({ id: checkout._id });
        toast.success("Custom checkout deleted successfully");
        router.push("/admin/ecommerce/custom-checkouts");
      } catch (error) {
        console.error("Failed to delete custom checkout:", error);
        toast.error("Failed to delete custom checkout", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
        setIsDeleting(false);
      }
    }
  };

  // Loading state
  if (customCheckouts === undefined || products === undefined) {
    return (
      <div className="container flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Checkout not found
  if (!checkout) {
    return (
      <div className="container py-6">
        <div className="mb-6 flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/ecommerce/custom-checkouts">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Custom Checkout Not Found</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          The custom checkout you are looking for does not exist or you do not
          have permission to view it.
        </p>
        <Button className="mt-4" asChild>
          <Link href="/admin/ecommerce/custom-checkouts">
            Back to Custom Checkouts
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/ecommerce/custom-checkouts">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Edit Custom Checkout</h1>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <p className="text-muted-foreground">{checkout.title}</p>
          <Badge
            variant={
              checkout.status === "active"
                ? "success"
                : checkout.status === "draft"
                  ? "secondary"
                  : "outline"
            }
          >
            {checkout.status}
          </Badge>
          <Button variant="outline" size="sm" className="ml-2" asChild>
            <Link href={`/checkout/${checkout.slug}`} target="_blank">
              <ExternalLink className="mr-2 h-4 w-4" />
              View Checkout
            </Link>
          </Button>
        </div>
      </div>

      <div className="mb-6 flex items-center justify-between">
        <Tabs
          defaultValue="general"
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="fields">Form Fields</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>
                  Basic information about your custom checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Premium Bundle"
                    value={checkout.title}
                    onChange={(e) =>
                      setCheckout({
                        ...checkout,
                        title: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    placeholder="e.g., premium-bundle"
                    value={checkout.slug}
                    disabled
                  />
                  <p className="text-xs text-muted-foreground">
                    The slug cannot be changed after creation.
                  </p>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe what this checkout is for"
                    value={checkout.description}
                    onChange={(e) =>
                      setCheckout({
                        ...checkout,
                        description: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={checkout.status}
                    onValueChange={(value) =>
                      setCheckout({ ...checkout, status: value })
                    }
                  >
                    <SelectTrigger id="status">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Products</CardTitle>
                <CardDescription>
                  Select the products to include in this custom checkout
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4 grid gap-2">
                  <Label htmlFor="products">Add Products</Label>
                  <Select
                    onValueChange={(value) => {
                      const productId = value as Id<"products">;
                      if (!checkout.productIds.includes(productId)) {
                        setCheckout({
                          ...checkout,
                          productIds: [...checkout.productIds, productId],
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select products to include" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product._id} value={product._id}>
                          {product.name} (${product.price.toFixed(2)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <h3 className="text-sm font-medium">Selected Products</h3>
                  {checkout.productIds.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No products selected
                    </p>
                  ) : (
                    <div className="rounded-md border">
                      {checkout.productIds.map((productId: Id<"products">) => {
                        const product = products.find(
                          (p) => p._id === productId,
                        );

                        return (
                          <div
                            key={productId}
                            className="flex items-center justify-between border-b p-3 last:border-0"
                          >
                            <div>
                              <p className="font-medium">
                                {product?.name || "Unknown product"}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                ${product?.price.toFixed(2) || "0.00"}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setCheckout({
                                  ...checkout,
                                  productIds: checkout.productIds.filter(
                                    (id: Id<"products">) => id !== productId,
                                  ),
                                })
                              }
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="fields" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Form Fields</CardTitle>
                <CardDescription>
                  Configure the fields to collect during checkout
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collect-email">Collect Email</Label>
                    <Switch
                      id="collect-email"
                      checked={checkout.collectEmail}
                      onCheckedChange={(checked) =>
                        setCheckout({ ...checkout, collectEmail: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collect-name">Collect Name</Label>
                    <Switch
                      id="collect-name"
                      checked={checkout.collectName}
                      onCheckedChange={(checked) =>
                        setCheckout({ ...checkout, collectName: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collect-phone">Collect Phone Number</Label>
                    <Switch
                      id="collect-phone"
                      checked={checkout.collectPhone}
                      onCheckedChange={(checked) =>
                        setCheckout({ ...checkout, collectPhone: checked })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collect-shipping">
                      Collect Shipping Address
                    </Label>
                    <Switch
                      id="collect-shipping"
                      checked={checkout.collectShippingAddress}
                      onCheckedChange={(checked) =>
                        setCheckout({
                          ...checkout,
                          collectShippingAddress: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="collect-billing">
                      Collect Billing Address
                    </Label>
                    <Switch
                      id="collect-billing"
                      checked={checkout.collectBillingAddress}
                      onCheckedChange={(checked) =>
                        setCheckout({
                          ...checkout,
                          collectBillingAddress: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="allow-coupons">Allow Coupon Codes</Label>
                    <Switch
                      id="allow-coupons"
                      checked={checkout.allowCoupons}
                      onCheckedChange={(checked) =>
                        setCheckout({ ...checkout, allowCoupons: checked })
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <div className="flex justify-between">
        <Button
          variant="destructive"
          onClick={handleDeleteCheckout}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Deleting...
            </>
          ) : (
            <>
              <Trash className="mr-2 h-4 w-4" />
              Delete Checkout
            </>
          )}
        </Button>
        <Button onClick={handleSaveCheckout} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
