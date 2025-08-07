"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { ChevronLeft, Edit, Loader2, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@acme/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";

export default function CustomCheckoutsPage() {
  const router = useRouter();
  return <AuthenticatedCheckoutsPage router={router} />;
}

function AuthenticatedCheckoutsPage({
  router,
}: {
  router: ReturnType<typeof useRouter>;
}) {
  const isAdminResult = useConvexQuery(api.accessControl.checkIsAdmin, {});

  useEffect(() => {
    if (isAdminResult === false) {
      toast.error("You are not authorized to view this page.");
      router.push("/dashboard");
    }
  }, [isAdminResult, router]);

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // At this point, isAdminResult is true.
  return <CheckoutsContent />;
}

function CheckoutsContent() {
  const [isCreating, setIsCreating] = useState(false);
  const [newCheckout, setNewCheckout] = useState({
    title: "",
    slug: "",
    description: "",
    productIds: [] as Id<"products">[],
    collectEmail: true,
    collectName: true,
    collectPhone: false,
    collectShippingAddress: false,
    collectBillingAddress: false,
    allowCoupons: true,
    status: "draft",
  });

  // Fetch data
  const customCheckouts = useConvexQuery(
    api.ecommerce.checkout.customCheckouts.getAllCustomCheckouts,
    {},
  );

  const products = useConvexQuery(
    api.ecommerce.products.index.listProducts,
    {},
  );

  const contentTypes = useConvexQuery(api.core.contentTypes.list, {
    includeBuiltIn: true,
  });

  // Find checkouts content type
  const checkoutsContentType = contentTypes?.find(
    (type) => type.slug === "checkouts",
  );

  // Mutations
  const createCustomCheckout = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.createCustomCheckoutFromContentType,
  );

  const deleteCustomCheckout = useConvexMutation(
    api.ecommerce.checkout.customCheckouts.deleteCustomCheckout,
  );

  const handleCreateCheckout = async () => {
    if (!checkoutsContentType) {
      toast.error("Checkouts content type not found");
      return;
    }

    try {
      setIsCreating(true);

      // Validate inputs
      if (!newCheckout.title || !newCheckout.slug) {
        toast.error("Title and slug are required");
        return;
      }

      if (newCheckout.productIds.length === 0) {
        toast.error("At least one product must be selected");
        return;
      }

      // Create the checkout
      await createCustomCheckout({
        contentTypeId: checkoutsContentType._id,
        title: newCheckout.title,
        slug: newCheckout.slug,
        description: newCheckout.description,
        productIds: newCheckout.productIds,
        collectEmail: newCheckout.collectEmail,
        collectName: newCheckout.collectName,
        collectPhone: newCheckout.collectPhone,
        collectShippingAddress: newCheckout.collectShippingAddress,
        collectBillingAddress: newCheckout.collectBillingAddress,
        allowCoupons: newCheckout.allowCoupons,
        status: newCheckout.status,
      });

      // Reset form
      setNewCheckout({
        title: "",
        slug: "",
        description: "",
        productIds: [],
        collectEmail: true,
        collectName: true,
        collectPhone: false,
        collectShippingAddress: false,
        collectBillingAddress: false,
        allowCoupons: true,
        status: "draft",
      });

      toast.success("Custom checkout created successfully");
    } catch (error) {
      console.error("Failed to create custom checkout:", error);
      toast.error("Failed to create custom checkout", {
        description: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteCheckout = async (id: Id<"customCheckouts">) => {
    if (confirm("Are you sure you want to delete this custom checkout?")) {
      try {
        await deleteCustomCheckout({ id });
        toast.success("Custom checkout deleted successfully");
      } catch (error) {
        console.error("Failed to delete custom checkout:", error);
        toast.error("Failed to delete custom checkout", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  const handleSlugChange = (value: string) => {
    // Generate slug from title (lowercase, replace spaces with hyphens)
    const slug = value
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    setNewCheckout({
      ...newCheckout,
      slug,
    });
  };

  // Loading state
  if (
    customCheckouts === undefined ||
    products === undefined ||
    contentTypes === undefined
  ) {
    return (
      <div className="container flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/ecommerce">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Custom Checkouts</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Create and manage custom checkout experiences with bundled products
        </p>
      </div>

      <div className="mb-4 flex justify-between">
        <h2 className="text-xl font-semibold">All Custom Checkouts</h2>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Custom Checkout
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Custom Checkout</DialogTitle>
              <DialogDescription>
                Configure a custom checkout experience for your customers
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., Premium Bundle"
                  value={newCheckout.title}
                  onChange={(e) => {
                    setNewCheckout({
                      ...newCheckout,
                      title: e.target.value,
                    });
                    if (!newCheckout.slug) {
                      handleSlugChange(e.target.value);
                    }
                  }}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  placeholder="e.g., premium-bundle"
                  value={newCheckout.slug}
                  onChange={(e) =>
                    setNewCheckout({
                      ...newCheckout,
                      slug: e.target.value,
                    })
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Used in URLs like /checkout/premium-bundle. Use only lowercase
                  letters, numbers, and hyphens.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what this checkout is for"
                  value={newCheckout.description}
                  onChange={(e) =>
                    setNewCheckout({
                      ...newCheckout,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="products">Products</Label>
                <Select
                  onValueChange={(value) => {
                    const productId = value as Id<"products">;
                    if (!newCheckout.productIds.includes(productId)) {
                      setNewCheckout({
                        ...newCheckout,
                        productIds: [...newCheckout.productIds, productId],
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
                <div className="mt-2 flex flex-wrap gap-2">
                  {newCheckout.productIds.map((productId) => {
                    const product = products.find((p) => p._id === productId);
                    return (
                      <Badge
                        key={productId}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        {product?.name || "Unknown product"}
                        <button
                          type="button"
                          className="ml-1 rounded-full p-1 hover:bg-muted"
                          onClick={() =>
                            setNewCheckout({
                              ...newCheckout,
                              productIds: newCheckout.productIds.filter(
                                (id) => id !== productId,
                              ),
                            })
                          }
                        >
                          <Trash className="h-3 w-3" />
                        </button>
                      </Badge>
                    );
                  })}
                </div>
              </div>
              <div className="mt-4">
                <h3 className="mb-2 text-sm font-medium">
                  Field Configuration
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="collect-email"
                      checked={newCheckout.collectEmail}
                      onCheckedChange={(checked) =>
                        setNewCheckout({
                          ...newCheckout,
                          collectEmail: checked,
                        })
                      }
                    />
                    <Label htmlFor="collect-email">Collect Email</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="collect-name"
                      checked={newCheckout.collectName}
                      onCheckedChange={(checked) =>
                        setNewCheckout({ ...newCheckout, collectName: checked })
                      }
                    />
                    <Label htmlFor="collect-name">Collect Name</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="collect-phone"
                      checked={newCheckout.collectPhone}
                      onCheckedChange={(checked) =>
                        setNewCheckout({
                          ...newCheckout,
                          collectPhone: checked,
                        })
                      }
                    />
                    <Label htmlFor="collect-phone">Collect Phone Number</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="collect-shipping"
                      checked={newCheckout.collectShippingAddress}
                      onCheckedChange={(checked) =>
                        setNewCheckout({
                          ...newCheckout,
                          collectShippingAddress: checked,
                        })
                      }
                    />
                    <Label htmlFor="collect-shipping">
                      Collect Shipping Address
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="collect-billing"
                      checked={newCheckout.collectBillingAddress}
                      onCheckedChange={(checked) =>
                        setNewCheckout({
                          ...newCheckout,
                          collectBillingAddress: checked,
                        })
                      }
                    />
                    <Label htmlFor="collect-billing">
                      Collect Billing Address
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      id="allow-coupons"
                      checked={newCheckout.allowCoupons}
                      onCheckedChange={(checked) =>
                        setNewCheckout({
                          ...newCheckout,
                          allowCoupons: checked,
                        })
                      }
                    />
                    <Label htmlFor="allow-coupons">Allow Coupon Codes</Label>
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newCheckout.status}
                  onValueChange={(value) =>
                    setNewCheckout({ ...newCheckout, status: value })
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
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateCheckout}
                disabled={isCreating}
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>Create Custom Checkout</>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-6">
          {Array.isArray(customCheckouts) && customCheckouts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Products</TableHead>
                  <TableHead>Fields</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customCheckouts.map((checkout) => (
                  <TableRow key={checkout._id}>
                    <TableCell className="font-medium">
                      {checkout.title}
                    </TableCell>
                    <TableCell>
                      <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
                        {checkout.slug}
                      </code>
                    </TableCell>
                    <TableCell>{checkout.productIds.length}</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {checkout.collectEmail && (
                          <Badge variant="outline" className="text-xs">
                            Email
                          </Badge>
                        )}
                        {checkout.collectName && (
                          <Badge variant="outline" className="text-xs">
                            Name
                          </Badge>
                        )}
                        {checkout.collectPhone && (
                          <Badge variant="outline" className="text-xs">
                            Phone
                          </Badge>
                        )}
                        {checkout.collectShippingAddress && (
                          <Badge variant="outline" className="text-xs">
                            Shipping
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          checkout.status === "active"
                            ? "default"
                            : checkout.status === "draft"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {checkout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link
                            href={`/admin/ecommerce/custom-checkouts/${checkout._id}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteCheckout(checkout._id)}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : Array.isArray(customCheckouts) && customCheckouts.length === 0 ? (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
              <p className="text-muted-foreground">No custom checkouts found</p>
              <p className="text-sm text-muted-foreground">
                Create your first custom checkout to get started
              </p>
            </div>
          ) : (
            <div className="flex h-40 w-full flex-col items-center justify-center gap-2">
              <p className="text-destructive">Error loading custom checkouts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
