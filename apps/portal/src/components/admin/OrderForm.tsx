"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { useQuery } from "convex/react";
import { Calendar, ListChecks, Plus, Trash2, Truck } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { DateTimePicker } from "@acme/ui/date-time-picker";
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
import { Separator } from "@acme/ui/separator";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { EntityAction } from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import { AddProductDialog } from "./AddProductDialog";
import { AddShippingDialog } from "./AddShippingDialog";
import { CalendarEventLink } from "./CalendarEventLink";
import { OrderAddressSection } from "./OrderAddressSection";

// Address data interface
export interface AddressData {
  fullName: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  country: string;
  phoneNumber: string;
}

// Order form data interface
export interface OrderFormData {
  userId?: Id<"users">;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  company: string;
  differentShippingAddress: boolean;
  billingAddress: AddressData;
  shippingAddress: AddressData;
  paymentMethod: string;
  notes: string;
  createdAt?: Date; // Changed to optional Date field

  // Product line items (now includes both products and shipping)
  lineItems: OrderLineItem[];
}

// Unified line item interface that can handle both products and shipping
export interface OrderLineItem {
  id: string; // temporary ID for form management
  type: "product" | "shipping";

  // Product-specific fields
  productId?: Id<"products">;
  productSnapshot?: {
    name: string;
    description: string;
    price: number;
    imageUrl?: string;
  };

  // Shipping-specific fields
  shippingMethod?: string;
  shippingDescription?: string;

  // Common fields
  quantity: number;
  price: number;
  lineTotal: number;

  // Display fields (computed from product data or shipping info)
  displayName: string;
  displayDescription: string;
  displayImageUrl?: string;
}

// Available component sections that can be enabled/disabled
export type OrderFormComponent =
  | "General"
  | "User"
  | "Shipping"
  | "Payment"
  | "Customer"
  | "Calendar"
  | "LineItems";

/**
 * OrderForm component with configurable sections
 *
 * Usage examples:
 *
 * // Show all components (default)
 * <OrderForm
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 * />
 *
 * // Show only General and LineItems (no billing/shipping addresses)
 * <OrderForm
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   components={["General", "LineItems"]}
 * />
 *
 * // Show General, Customer, and LineItems (no addresses or calendar)
 * <OrderForm
 *   onSubmit={handleSubmit}
 *   onCancel={handleCancel}
 *   components={["General", "Customer", "LineItems"]}
 * />
 */
interface OrderFormProps {
  orderId?: Id<"orders">; // If provided, we're editing an existing order
  onSubmit: (data: OrderFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  components?: OrderFormComponent[]; // New prop to control which components are shown
}

export function OrderForm({
  orderId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  submitButtonText = "Create Order",
  components = [
    "General",
    "Shipping",
    "User",
    "Payment",
    "Customer",
    "Calendar",
    "LineItems",
  ], // Default to all components
}: OrderFormProps) {
  // Helper function to check if a component should be rendered
  const shouldShowComponent = (component: OrderFormComponent): boolean => {
    return components.includes(component);
  };

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

  // Initial form data
  const [formData, setFormData] = useState<OrderFormData>({
    userId: undefined,
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
    createdAt: undefined, // Initialize createdAt as undefined
    lineItems: [],
  });

  const [showAddProduct, setShowAddProduct] = useState(false);
  const [showAddShipping, setShowAddShipping] = useState(false); // New state for shipping dialog
  const [showUserSelector, setShowUserSelector] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState("");
  const [isFormInitialized, setIsFormInitialized] = useState(false); // Flag to prevent form data overwrites

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
    if (existingOrder && !isFormInitialized) {
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
        createdAt: existingOrder.createdAt
          ? new Date(existingOrder.createdAt)
          : undefined, // Populate createdAt as Date
        lineItems: [
          // Load product items
          ...(existingOrder.items?.map((item, index) => ({
            id: `${item.productId}-${index}`,
            type: "product" as const,
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
            displayName: item.productSnapshot?.name || "Unknown Product",
            displayDescription: item.productSnapshot?.description || "",
            displayImageUrl: item.productSnapshot?.imageUrl,
          })) || []),
          // Load shipping as a line item if it exists
          ...(existingOrder.shippingDetails
            ? [
                {
                  id: `shipping-${Date.now()}`,
                  type: "shipping" as const,
                  shippingMethod: existingOrder.shippingDetails.method,
                  shippingDescription:
                    existingOrder.shippingDetails.description,
                  quantity: 1,
                  price: existingOrder.shippingDetails.cost,
                  lineTotal: existingOrder.shippingDetails.cost,
                  displayName: existingOrder.shippingDetails.method,
                  displayDescription: existingOrder.shippingDetails.description,
                },
              ]
            : []),
        ],
      });
      setIsFormInitialized(true); // Mark form as initialized
    }
  }, [existingOrder, isFormInitialized]);

  // Reset form initialization when orderId changes (switching between orders)
  useEffect(() => {
    setIsFormInitialized(false);
  }, [orderId]);

  // Calculate totals - products and shipping
  const productSubtotal = formData.lineItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );

  const shippingTotal = formData.lineItems
    .filter((item) => item.type === "shipping")
    .reduce((sum, item) => sum + item.lineTotal, 0);
  const subtotal = productSubtotal + shippingTotal;
  //   const tax = productSubtotal * 0.08; // 8% tax rate on products only - make this configurable
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
  const handleAddProduct = (product: any, quantity: number) => {
    if (!product) return;

    const newItem: OrderLineItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: "product",
      productId: product._id,
      productSnapshot: {
        name: product.name,
        description: product.description || "",
        price: product.price,
        imageUrl: product.images?.[0]?.url,
      },
      quantity,
      price: product.price,
      lineTotal: product.price * quantity,
      displayName: product.name,
      displayDescription: product.description || "",
      displayImageUrl: product.images?.[0]?.url,
    };

    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newItem],
    }));

    setShowAddProduct(false);
  };

  // Add shipping details to order
  const handleAddShipping = (
    shippingMethod: string,
    description: string,
    price: number,
  ) => {
    const newShippingItem: OrderLineItem = {
      id: Math.random().toString(36).substr(2, 9),
      type: "shipping",
      shippingMethod,
      shippingDescription: description,
      quantity: 1, // Shipping always has quantity of 1
      price: price,
      lineTotal: price,
      displayName: shippingMethod,
      displayDescription: description,
    };

    setFormData((prev) => ({
      ...prev,
      lineItems: [...prev.lineItems, newShippingItem],
    }));

    setShowAddShipping(false);
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
      id: "item",
      header: "Product",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex items-center gap-3">
            {/* Show appropriate icon for item type */}
            {item.type === "shipping" ? (
              <div className="flex h-10 w-10 items-center justify-center rounded bg-blue-100">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
            ) : (
              item.displayImageUrl && (
                <Image
                  src={item.displayImageUrl}
                  alt={item.displayName}
                  width={40}
                  height={40}
                  className="h-10 w-10 rounded object-cover"
                />
              )
            )}
            <div>
              <div className="font-medium">{item.displayName}</div>
              <div className="text-sm text-muted-foreground">
                {item.displayDescription}
              </div>
            </div>
          </div>
        );
      },
    },
    // {
    //   id: "price",
    //   header: "Price",
    //   cell: ({ row }) => `$${row.original.price.toFixed(2)}`,
    // },
    {
      id: "quantity",
      header: "Quantity",
      cell: ({ row }) => {
        const item = row.original;

        // Shipping items have fixed quantity of 1
        if (item.type === "shipping") {
          return (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">N/A</span>
            </div>
          );
        }

        // Product items have editable quantity
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
    // {
    //   id: "lineTotal",
    //   header: "Total",
    //   cell: ({ row }) => `$${row.original.lineTotal.toFixed(2)}`,
    // },
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

      {/* <Button
        type="button"
        onClick={() => setShowAddShipping(true)}
        className="gap-2"
        size="sm"
        variant="outline"
      >
        <Truck className="h-4 w-4" />
        Add Shipping
      </Button>

      <Button type="button" variant="outline" size="sm" className="text-xs">
        Apply coupon
      </Button>
      <Button type="button" variant="outline" size="sm" className="text-xs">
        Recalculate
      </Button> */}
    </>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex gap-8">
          {/* Header - General, Billing, Shipping in Grid */}
          {(shouldShowComponent("General") ||
            shouldShowComponent("Customer") ||
            shouldShowComponent("Shipping") ||
            shouldShowComponent("Payment")) && (
            <Card className="w-full border-none shadow-none">
              <CardHeader className="p-0 pb-3">
                <CardTitle className="py-1 text-base">General</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 p-0 font-normal">
                {/* Basic Order Information */}
                {shouldShowComponent("General") && (
                  <div>
                    <Label htmlFor="createdAt" className="font-normal">
                      Created At
                    </Label>
                    <DateTimePicker
                      value={formData.createdAt}
                      onChange={(date) =>
                        setFormData((prev) => ({
                          ...prev,
                          createdAt: date,
                        }))
                      }
                      placeholder="Select creation date and time"
                    />
                  </div>
                )}

                {/* Customer Selection */}
                {shouldShowComponent("Customer") && usersQuery && (
                  <div>
                    <Label htmlFor="userId">
                      Link to User Account (Optional)
                    </Label>
                    <Select
                      value={formData.userId || ""}
                      onValueChange={(value) => {
                        const selectedUser = usersQuery.find(
                          (user) => user._id === value,
                        );
                        setFormData((prev) => ({
                          ...prev,
                          userId: value ? (value as Id<"users">) : undefined,
                          email: selectedUser?.email || prev.email,
                          firstName: selectedUser?.firstName || prev.firstName,
                          lastName: selectedUser?.lastName || prev.lastName,
                          phone: selectedUser?.phone || prev.phone,
                        }));
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select user (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" key="no-user">
                          No linked user
                        </SelectItem>
                        {usersQuery.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {shouldShowComponent("Payment") && (
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Select
                      value={formData.paymentMethod}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          paymentMethod: value,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="credit_card">Credit Card</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="apple_pay">Apple Pay</SelectItem>
                        <SelectItem value="google_pay">Google Pay</SelectItem>
                        <SelectItem value="bank_transfer">
                          Bank Transfer
                        </SelectItem>
                        <SelectItem value="crypto">Cryptocurrency</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Notes */}
                {/* <div>
                <Label htmlFor="notes">Order Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Any special instructions or notes about this order..."
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div> */}
              </CardContent>
            </Card>
          )}

          {/* Billing and Shipping Section */}
          {(shouldShowComponent("Shipping") ||
            shouldShowComponent("Payment")) && (
            <OrderAddressSection
              formData={formData}
              onInputChange={handleInputChange}
              onFormDataChange={setFormData}
              showShipping={shouldShowComponent("Shipping")}
              showPayment={shouldShowComponent("Payment")}
            />
          )}
        </div>

        {/* Calendar Event Link */}
        {shouldShowComponent("Calendar") && (
          <CalendarEventLink
            orderId={orderId}
            currentEventId={existingOrder?.calendarEventId}
            onEventLinked={(eventId) => {
              // Update the order with the linked event
              // This would require adding calendarEventId to the order schema and update mutation
              toast.success("Calendar event linked successfully");
            }}
            onEventUnlinked={() => {
              // Remove the event link from the order
              toast.success("Calendar event unlinked successfully");
            }}
          />
        )}

        {/* Order Items Section */}
        {shouldShowComponent("LineItems") && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-base">
                  <ListChecks className="h-4 w-4" /> Order Items
                </CardTitle>
                <div className="flex gap-2">{lineItemHeaderActions}</div>
              </div>
            </CardHeader>
            <CardContent>
              {formData.lineItems.length > 0 ? (
                <EntityList
                  data={formData.lineItems}
                  columns={lineItemColumns}
                  entityActions={lineItemActions}
                  viewModes={[""]}
                  enableSearch={true}
                  enableFooter={false}
                />
              ) : (
                <div className="py-8 text-center">
                  <p className="mb-4 text-muted-foreground">
                    No items added to this order yet
                  </p>
                  <Button
                    type="button"
                    onClick={() => setShowAddProduct(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Product
                  </Button>
                </div>
              )}

              {/* Order Totals */}
              {formData.lineItems.length > 0 && (
                <div className="mt-6 flex justify-end">
                  <div className="w-64 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Items Subtotal:</span>
                      <span>${productSubtotal.toFixed(2)}</span>
                    </div>

                    {/* Show shipping if available */}
                    {shippingTotal > 0 && (
                      <div className="flex justify-between">
                        <span>Shipping:</span>
                        <span>${shippingTotal.toFixed(2)}</span>
                      </div>
                    )}

                    {/* Show tax if available */}
                    {/* {existingOrder?.tax !== undefined &&
                      existingOrder?.tax !== null && (
                        <div className="flex justify-between">
                          <span>Tax:</span>
                          <span>${existingOrder.tax.toFixed(2)}</span>
                        </div>
                      )} */}

                    {/* Show discount if available */}
                    {/* {existingOrder?.discount && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${existingOrder.discount.toFixed(2)}</span>
                      </div>
                    )} */}

                    <Separator />
                    <div className="flex justify-between font-semibold">
                      <span>Total:</span>
                      <span>${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Processing..." : submitButtonText}
          </Button>
        </div>
      </form>

      {/* Dialogs - outside the form to prevent nested form submission */}
      <AddProductDialog
        open={showAddProduct}
        onOpenChange={setShowAddProduct}
        onAddProduct={handleAddProduct}
      />

      {/* Add Shipping Dialog */}
      <AddShippingDialog
        open={showAddShipping}
        onOpenChange={setShowAddShipping}
        onAddShipping={handleAddShipping}
      />
    </div>
  );
}
