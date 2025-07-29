"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { Plus, Trash2 } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { EntityAction } from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Order line item interface
export interface OrderLineItem {
  id: string; // temporary ID for form management
  productId: Id<"products">;
  productSnapshot: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  };
  quantity: number;
  price: number;
  lineTotal: number;
}

// Order form data
export interface OrderFormData {
  // Customer info
  userId?: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;

  // Address configuration
  differentShippingAddress: boolean;

  // Billing address (primary address)
  billingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };

  // Shipping address (only used if differentShippingAddress is true)
  shippingAddress: {
    fullName: string;
    addressLine1: string;
    addressLine2: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
    phoneNumber: string;
  };

  // Order details
  paymentMethod: string;
  notes: string;

  // Line items
  lineItems: OrderLineItem[];
}

interface OrderFormProps {
  orderId?: Id<"orders">; // If provided, we're editing an existing order
  onSubmit: (data: OrderFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
}

export function OrderForm({
  orderId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = "Create Order",
}: OrderFormProps) {
  // Fetch existing order if editing
  const existingOrder = useQuery(
    api.ecommerce.orders.index.getOrder,
    orderId ? { orderId } : "skip",
  );

  // Fetch products for line item selection
  const productsQuery = useQuery(api.ecommerce.products.index.listProducts, {});

  // Fetch users for selection - only when auth is ready
  const { isLoaded: isAuthLoaded } = useAuth();
  const usersQuery = useQuery(
    api.users.queries.listUsers,
    isAuthLoaded ? {} : "skip",
  );

  // Form state
  const [formData, setFormData] = useState<OrderFormData>({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    company: "",
    differentShippingAddress: false,
    billingAddress: {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      country: "US",
      phoneNumber: "",
    },
    shippingAddress: {
      fullName: "",
      addressLine1: "",
      addressLine2: "",
      city: "",
      stateOrProvince: "",
      postalCode: "",
      country: "US",
      phoneNumber: "",
    },
    paymentMethod: "credit_card",
    notes: "",
    lineItems: [],
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");

  // Handle user selection and prefill form data
  const handleUserSelect = (user: Doc<"users">) => {
    setFormData((prev) => ({
      ...prev,
      userId: user._id,
      email: user.email || "",
      firstName: user.name?.split(" ")[0] || "",
      lastName: user.name?.split(" ").slice(1).join(" ") || "",
      phone: "", // Users might not have phone in the database
      company: "", // Users might not have company in the database
      billingAddress: {
        fullName: user.name || "",
        addressLine1: "", // Users might not have address in the database
        addressLine2: "",
        city: "",
        stateOrProvince: "",
        postalCode: "",
        country: "US",
        phoneNumber: "",
      },
      // Only update shipping address if different shipping is enabled
      ...(prev.differentShippingAddress && {
        shippingAddress: {
          fullName: user.name || "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          stateOrProvince: "",
          postalCode: "",
          country: "US",
          phoneNumber: "",
        },
      }),
    }));
    setShowUserSelector(false);
    setUserSearchTerm("");
  };

  // Populate form with existing order data if editing
  useEffect(() => {
    if (existingOrder) {
      setFormData({
        userId: existingOrder.userId,
        email: existingOrder.email || "",
        firstName: existingOrder.customerInfo.firstName,
        lastName: existingOrder.customerInfo.lastName,
        phone: existingOrder.customerInfo.phone || "",
        company: existingOrder.customerInfo.company || "",
        differentShippingAddress: false, // Default assumption
        billingAddress: {
          fullName: existingOrder.billingAddress?.fullName || "",
          addressLine1: existingOrder.billingAddress?.addressLine1 || "",
          addressLine2: existingOrder.billingAddress?.addressLine2 || "",
          city: existingOrder.billingAddress?.city || "",
          stateOrProvince: existingOrder.billingAddress?.stateOrProvince || "",
          postalCode: existingOrder.billingAddress?.postalCode || "",
          country: existingOrder.billingAddress?.country || "US",
          phoneNumber: existingOrder.billingAddress?.phoneNumber || "",
        },
        shippingAddress: {
          fullName: existingOrder.shippingAddress?.fullName || "",
          addressLine1: existingOrder.shippingAddress?.addressLine1 || "",
          addressLine2: existingOrder.shippingAddress?.addressLine2 || "",
          city: existingOrder.shippingAddress?.city || "",
          stateOrProvince: existingOrder.shippingAddress?.stateOrProvince || "",
          postalCode: existingOrder.shippingAddress?.postalCode || "",
          country: existingOrder.shippingAddress?.country || "US",
          phoneNumber: existingOrder.shippingAddress?.phoneNumber || "",
        },
        paymentMethod: existingOrder.paymentMethod || "credit_card",
        notes: existingOrder.notes || "",
        lineItems:
          existingOrder.items?.map((item, index) => ({
            id: `${item.productId}-${index}`,
            productId: item.productId,
            productSnapshot: {
              name: item.productSnapshot?.name || "Unknown Product",
              description: item.productSnapshot?.description || "",
              price: item.productSnapshot?.price || 0,
              imageUrl: item.productSnapshot?.imageUrl,
            },
            quantity: item.quantity || 1,
            price: item.productSnapshot?.price || 0,
            lineTotal:
              item.lineTotal ||
              item.quantity * (item.productSnapshot?.price || 0),
          })) || [],
      });
    }
  }, [existingOrder]);

  // Calculate totals
  const subtotal = formData.lineItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  //   const tax = subtotal * 0.08; // 8% tax rate - make this configurable
  //   const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
  const total = subtotal;

  // Handle form field changes
  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const keys = field.split(".");
      if (keys.length === 1) {
        return { ...prev, [keys[0]]: value };
      } else if (keys.length === 2) {
        const [firstKey, secondKey] = keys;

        if (firstKey === "shippingAddress" || firstKey === "billingAddress") {
          return {
            ...prev,
            [firstKey]: {
              ...prev[firstKey],
              [secondKey]: value,
            },
          };
        }
      }
      return prev;
    });
  };

  // Handle checkbox changes
  const handleCheckboxChange = (field: string, checked: boolean) => {
    if (field === "differentShippingAddress") {
      setFormData((prev) => ({
        ...prev,
        differentShippingAddress: checked,
        // Copy billing address to shipping address when enabling different shipping
        ...(checked && {
          shippingAddress: { ...prev.billingAddress },
        }),
      }));
    }
  };

  // Clear user selection
  const handleClearUser = () => {
    setFormData((prev) => ({
      ...prev,
      userId: undefined,
      email: "",
      firstName: "",
      lastName: "",
      phone: "",
      company: "",
    }));
  };

  // Add product to line items
  const handleAddProduct = (
    productId: Id<"products">,
    quantity: number = 1,
  ) => {
    const product = productsQuery?.find((p) => p._id === productId);
    if (!product) return;

    const newItem: OrderLineItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId,
      productSnapshot: {
        name: product.name,
        description: product.description || "",
        price: product.price,
        imageUrl: product.images?.[0]?.url,
      },
      quantity,
      price: product.price,
      lineTotal: product.price * quantity,
    };

    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));
    setShowAddProduct(false);
  };

  // Update line item quantity
  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.map((item) =>
        item.id === itemId
          ? { ...item, quantity, lineTotal: item.price * quantity }
          : item,
      ),
    }));
  };

  // Remove line item
  const handleRemoveItem = (itemId: string) => {
    setFormData((prev) => ({
      ...prev,
      lineItems: prev.lineItems.filter((item) => item.id !== itemId),
    }));
  };

  // Submit order
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.lineItems.length === 0) {
      toast.error("Please add at least one product to the order");
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting order:", error);
      toast.error("Failed to submit order. Please try again.");
    }
  };

  // EntityList configuration for line items
  const lineItemColumns: ColumnDef<OrderLineItem>[] = [
    {
      id: "product",
      header: "Product",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            {item.productSnapshot?.imageUrl && (
              <Image
                src={item.productSnapshot.imageUrl}
                alt={item.productSnapshot.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded object-cover"
              />
            )}
            <div>
              <div className="font-medium">{item.productSnapshot?.name}</div>
              <div className="text-xs text-muted-foreground">
                {item.productSnapshot?.description}
              </div>
            </div>
          </div>
        );
      },
    },
    {
      id: "price",
      header: "Price",
      cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <Input
            type="number"
            min="1"
            value={item.quantity}
            onChange={(e) =>
              handleUpdateQuantity(item.id, parseInt(e.target.value) || 1)
            }
            className="w-20"
          />
        );
      },
    },
    {
      id: "lineTotal",
      header: "Total",
      cell: ({ row }) => `$${row.original.lineTotal.toFixed(2)}`,
    },
  ];

  const lineItemActions: EntityAction<OrderLineItem>[] = [
    {
      id: "remove",
      label: "Remove",
      onClick: (item) => handleRemoveItem(item.id),
      variant: "destructive",
      icon: <Trash2 className="h-4 w-4" />,
    },
  ];

  const lineItemHeaderActions = (
    <>
      <Button
        type="button"
        onClick={() => setShowAddProduct(true)}
        className="gap-2"
        size="sm"
      >
        <Plus className="h-4 w-4" />
        Add Product
      </Button>

      <Button type="button" variant="outline" size="sm" className="text-xs">
        Apply coupon
      </Button>
      <Button type="button" variant="outline" size="sm" className="text-xs">
        Recalculate
      </Button>
    </>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header - General, Billing, Shipping in Grid */}
      <Card className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* General Section */}
        <Card className="border-none shadow-none">
          <CardHeader>
            <CardTitle className="text-base">General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Date created and Status */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="dateCreated">Date created:</Label>
                <Input
                  id="dateCreated"
                  value={new Date().toISOString().split("T")[0]}
                  disabled
                  className="text-sm"
                />
              </div>

              <div>
                <Label htmlFor="status">Status:</Label>
                <Select value="pending" disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending payment</SelectItem>
                    <SelectItem value="processing">Processing</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="customer">Customer:</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.userId || "guest"}
                    onValueChange={(value) => {
                      if (value === "guest") {
                        handleClearUser();
                      } else {
                        const user = usersQuery?.find((u) => u._id === value);
                        if (user) handleUserSelect(user);
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guest">Guest</SelectItem>
                      {usersQuery?.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          {user.name || user.email}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Billing Section */}
        <Card className="border-none shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Billing</CardTitle>
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs text-blue-600"
                onClick={() => {
                  // TODO: Implement load billing address functionality
                  toast.info(
                    "Load billing address functionality to be implemented",
                  );
                }}
              >
                Load billing address
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billingFirstName" className="text-xs">
                  First name
                </Label>
                <Input
                  id="billingFirstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    handleInputChange("firstName", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="billingLastName" className="text-xs">
                  Last name
                </Label>
                <Input
                  id="billingLastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    handleInputChange("lastName", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="billingCompany" className="text-xs">
                Company
              </Label>
              <Input
                id="billingCompany"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billingAddressLine1" className="text-xs">
                  Address line 1
                </Label>
                <Input
                  id="billingAddressLine1"
                  value={formData.billingAddress.addressLine1}
                  onChange={(e) =>
                    handleInputChange(
                      "billingAddress.addressLine1",
                      e.target.value,
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="billingAddressLine2" className="text-xs">
                  Address line 2
                </Label>
                <Input
                  id="billingAddressLine2"
                  value={formData.billingAddress.addressLine2}
                  onChange={(e) =>
                    handleInputChange(
                      "billingAddress.addressLine2",
                      e.target.value,
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billingCity" className="text-xs">
                  City
                </Label>
                <Input
                  id="billingCity"
                  value={formData.billingAddress.city}
                  onChange={(e) =>
                    handleInputChange("billingAddress.city", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="billingPostalCode" className="text-xs">
                  Postcode / ZIP
                </Label>
                <Input
                  id="billingPostalCode"
                  value={formData.billingAddress.postalCode}
                  onChange={(e) =>
                    handleInputChange(
                      "billingAddress.postalCode",
                      e.target.value,
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billingCountry" className="text-xs">
                  Country / Region
                </Label>
                <Select
                  value={formData.billingAddress.country}
                  onValueChange={(value) =>
                    handleInputChange("billingAddress.country", value)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States (US)</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="billingState" className="text-xs">
                  State / County
                </Label>
                <Select
                  value={formData.billingAddress.stateOrProvince}
                  onValueChange={(value) =>
                    handleInputChange("billingAddress.stateOrProvince", value)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="billingEmail" className="text-xs">
                  Email address
                </Label>
                <Input
                  id="billingEmail"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="billingPhone" className="text-xs">
                  Phone
                </Label>
                <Input
                  id="billingPhone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="paymentMethod" className="text-xs">
                Payment method:
              </Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) =>
                  handleInputChange("paymentMethod", value)
                }
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N/A">N/A</SelectItem>
                  <SelectItem value="credit_card">Credit Card</SelectItem>
                  <SelectItem value="paypal">PayPal</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="transactionId" className="text-xs">
                Transaction ID
              </Label>
              <Input
                id="transactionId"
                placeholder="Transaction ID"
                className="h-8 text-sm"
              />
            </div>
          </CardContent>
        </Card>

        {/* Shipping Section */}
        <Card className="border-none shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Shipping</CardTitle>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600"
                  onClick={() => {
                    // TODO: Implement load shipping address functionality
                    toast.info(
                      "Load shipping address functionality to be implemented",
                    );
                  }}
                >
                  Load shipping address
                </Button>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs text-blue-600"
                  onClick={() => {
                    setFormData((prev) => ({
                      ...prev,
                      shippingAddress: { ...prev.billingAddress },
                    }));
                    toast.success("Billing address copied to shipping");
                  }}
                >
                  Copy billing address
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shippingFirstName" className="text-xs">
                  First name
                </Label>
                <Input
                  id="shippingFirstName"
                  value={formData.shippingAddress.fullName.split(" ")[0] || ""}
                  onChange={(e) => {
                    const lastName = formData.shippingAddress.fullName
                      .split(" ")
                      .slice(1)
                      .join(" ");
                    handleInputChange(
                      "shippingAddress.fullName",
                      `${e.target.value} ${lastName}`.trim(),
                    );
                  }}
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="shippingLastName" className="text-xs">
                  Last name
                </Label>
                <Input
                  id="shippingLastName"
                  value={
                    formData.shippingAddress.fullName
                      .split(" ")
                      .slice(1)
                      .join(" ") || ""
                  }
                  onChange={(e) => {
                    const firstName =
                      formData.shippingAddress.fullName.split(" ")[0] || "";
                    handleInputChange(
                      "shippingAddress.fullName",
                      `${firstName} ${e.target.value}`.trim(),
                    );
                  }}
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="shippingCompany" className="text-xs">
                Company
              </Label>
              <Input
                id="shippingCompany"
                value={formData.company}
                onChange={(e) => handleInputChange("company", e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shippingAddressLine1" className="text-xs">
                  Address line 1
                </Label>
                <Input
                  id="shippingAddressLine1"
                  value={formData.shippingAddress.addressLine1}
                  onChange={(e) =>
                    handleInputChange(
                      "shippingAddress.addressLine1",
                      e.target.value,
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="shippingAddressLine2" className="text-xs">
                  Address line 2
                </Label>
                <Input
                  id="shippingAddressLine2"
                  value={formData.shippingAddress.addressLine2}
                  onChange={(e) =>
                    handleInputChange(
                      "shippingAddress.addressLine2",
                      e.target.value,
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shippingCity" className="text-xs">
                  City
                </Label>
                <Input
                  id="shippingCity"
                  value={formData.shippingAddress.city}
                  onChange={(e) =>
                    handleInputChange("shippingAddress.city", e.target.value)
                  }
                  className="h-8 text-sm"
                />
              </div>
              <div>
                <Label htmlFor="shippingPostalCode" className="text-xs">
                  Postcode / ZIP
                </Label>
                <Input
                  id="shippingPostalCode"
                  value={formData.shippingAddress.postalCode}
                  onChange={(e) =>
                    handleInputChange(
                      "shippingAddress.postalCode",
                      e.target.value,
                    )
                  }
                  className="h-8 text-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="shippingCountry" className="text-xs">
                  Country / Region
                </Label>
                <Select
                  value={formData.shippingAddress.country}
                  onValueChange={(value) =>
                    handleInputChange("shippingAddress.country", value)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States (US)</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="shippingState" className="text-xs">
                  State / County
                </Label>
                <Select
                  value={formData.shippingAddress.stateOrProvince}
                  onValueChange={(value) =>
                    handleInputChange("shippingAddress.stateOrProvince", value)
                  }
                >
                  <SelectTrigger className="h-8 text-sm">
                    <SelectValue placeholder="Select an option..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CA">California</SelectItem>
                    <SelectItem value="NY">New York</SelectItem>
                    <SelectItem value="TX">Texas</SelectItem>
                    <SelectItem value="FL">Florida</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="shippingPhone" className="text-xs">
                Phone
              </Label>
              <Input
                id="shippingPhone"
                value={formData.shippingAddress.phoneNumber}
                onChange={(e) =>
                  handleInputChange(
                    "shippingAddress.phoneNumber",
                    e.target.value,
                  )
                }
                className="h-8 text-sm"
              />
            </div>

            <div>
              <Label htmlFor="customerNote" className="text-xs">
                Customer provided note:
              </Label>
              <Textarea
                id="customerNote"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Customer notes about the order"
                className="min-h-[60px] text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </Card>

      {/* Order Items Section */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h3 className="text-base font-medium">Line Items</h3>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <EntityList
            data={formData.lineItems}
            columns={lineItemColumns}
            entityActions={lineItemActions}
            actions={lineItemHeaderActions}
            defaultViewMode="list"
            viewModes={[""]}
            emptyState="No items added to order"
          />

          {/* Order Totals */}
          {formData.lineItems.length > 0 && (
            <div className="mt-6 flex justify-end">
              <div className="w-64 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Items Subtotal:</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>

                {/* Show shipping if available */}
                {existingOrder?.shipping !== undefined &&
                  existingOrder?.shipping !== null && (
                    <div className="flex justify-between">
                      <span>Shipping:</span>
                      <span>
                        {existingOrder.shipping === 0
                          ? "FREE"
                          : `$${existingOrder.shipping.toFixed(2)}`}
                      </span>
                    </div>
                  )}

                {/* Show tax if available */}
                {existingOrder?.tax !== undefined &&
                  existingOrder?.tax !== null && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>${existingOrder.tax.toFixed(2)}</span>
                    </div>
                  )}

                {/* Show discount if available */}
                {existingOrder?.discount && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount:</span>
                    <span>-${existingOrder.discount.toFixed(2)}</span>
                  </div>
                )}

                <hr className="my-2" />
                <div className="flex justify-between font-medium">
                  <span>Order Total:</span>
                  <span>${(existingOrder?.total || total).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Processing..." : submitButtonText}
        </Button>
      </div>

      {/* User Selection Dialog */}
      <Dialog open={showUserSelector} onOpenChange={setShowUserSelector}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Select User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              placeholder="Search users..."
              value={userSearchTerm}
              onChange={(e) => setUserSearchTerm(e.target.value)}
            />
            <div className="max-h-96 overflow-auto">
              {usersQuery
                ?.filter(
                  (user) =>
                    user.name
                      ?.toLowerCase()
                      .includes(userSearchTerm.toLowerCase()) ||
                    user.email
                      ?.toLowerCase()
                      .includes(userSearchTerm.toLowerCase()),
                )
                .map((user) => (
                  <div
                    key={user._id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                    onClick={() => handleUserSelect(user)}
                  >
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                    </div>
                    <Badge variant="outline">{user.role || "user"}</Badge>
                  </div>
                ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Product Dialog */}
      <Dialog open={showAddProduct} onOpenChange={setShowAddProduct}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-96 overflow-auto">
              {productsQuery?.map((product) => (
                <div
                  key={product._id}
                  className="flex cursor-pointer items-center justify-between rounded-lg border p-3 hover:bg-gray-50"
                  onClick={() => handleAddProduct(product._id)}
                >
                  <div>
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-muted-foreground">
                      SKU: {product.sku}
                    </div>
                  </div>
                  <Badge variant="outline">${product.price.toFixed(2)}</Badge>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </form>
  );
}
