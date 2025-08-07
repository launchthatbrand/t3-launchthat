"use client";

import "~/plugins";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { api } from "@convex-config/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

import type { OrderFormData } from "~/components/admin/OrderForm";
import {
  AdminSinglePost,
  AdminSinglePostHeader,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostSidebar,
  AdminSinglePostTabs,
  AdminSinglePostTabsContent,
  AdminSinglePostTabsList,
  AdminSinglePostTabsTrigger,
  MediaTabContent,
} from "~/components/admin/AdminSinglePostLayout";
// Import calendar linking components
import { CalendarEventLink } from "~/components/admin/CalendarEventLink";
// Import the client content renderer and admin layout
import { AllSectionsRenderer } from "~/components/admin/ClientContentRenderer";
import { OrderForm } from "~/components/admin/OrderForm";
import { OrderNotes } from "~/components/admin/OrderNotes";
import { usePluginTabs } from "~/lib/hooks";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isLoaded: isAuthLoaded } = useAuth();

  // Get orderId from params
  const orderId = params.orderId as Id<"orders">;

  // Hook context for plugins - MUST be called before any conditional returns
  const hookContext = {
    postType: "order",
    postId: orderId,
    userId: undefined, // You'd get this from auth
    isSubmitting,
  };

  // Get plugin tabs
  const pluginTabs = usePluginTabs([], hookContext);

  // Queries and mutations - MUST be called before any conditional returns
  const order = useQuery(
    api.ecommerce.orders.index.getOrder,
    orderId ? { orderId: orderId } : "skip",
  );
  const updateOrderMutation = useMutation(api.ecommerce.orders.mutation.update);

  // Check authentication state
  if (!isAuthLoaded) {
    return <div>Loading...</div>;
  }

  if (!orderId) {
    return <div>Order ID is required</div>;
  }

  // Loading state
  if (!order) {
    return <div>Loading order...</div>;
  }

  // Event handlers
  const handleOrderUpdate = async (data: OrderFormData) => {
    setIsSubmitting(true);
    try {
      // Separate products and shipping from line items
      const productLineItems = data.lineItems.filter(
        (item) => item.type === "product",
      );
      const shippingItems = data.lineItems.filter(
        (item) => item.type === "shipping",
      );

      // Prepare shipping details (take the first shipping item if multiple exist)
      const shippingDetails =
        shippingItems.length > 0
          ? {
              method: shippingItems[0].shippingMethod!,
              description: shippingItems[0].shippingDescription!,
              cost: shippingItems[0].lineTotal,
            }
          : null; // Use null instead of undefined to explicitly clear shipping

      const shippingTotal = shippingItems.reduce(
        (sum, item) => sum + item.lineTotal,
        0,
      );

      await updateOrderMutation({
        id: orderId,
        ...data,
        // Convert Date to timestamp for Convex compatibility
        createdAt: data.createdAt ? data.createdAt.getTime() : undefined,
        // Override line items to only include products
        lineItems: productLineItems.map((item) => ({
          id: item.id,
          productId: item.productId,
          productSnapshot: item.productSnapshot,
          quantity: item.quantity,
          price: item.price,
          lineTotal: item.lineTotal,
        })),
        // Override shipping fields with extracted data
        shipping: shippingTotal,
        shippingDetails,
      });
      toast.success("Order updated successfully");
    } catch (error) {
      console.error("Failed to update order:", error);
      toast.error("Failed to update order");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/store/orders");
  };

  // Note: The AdminLayout header (with tabs) is rendered by the layout.tsx
  // This page only needs to render the content that responds to those tabs

  return (
    <div className="container py-6">
      {/* Using AllSectionsRenderer to handle client-side tab content switching */}
      <AllSectionsRenderer defaultSection="details">
        {/* Order Details Section */}
        <div data-section="details">
          <AdminSinglePost
            postType="order"
            postTitle={`Order ${orderId}`}
            postId={orderId}
            isSubmitting={isSubmitting}
            defaultTab="content"
          >
            {/* <AdminSinglePostHeader
              showBackButton={true}
              backUrl="/admin/store/orders"
              showSaveButton={false} // Save is handled per section
            /> */}

            <AdminSinglePostLayout className="border-none shadow-none">
              <AdminSinglePostMain className="ADMIN_SINGLE_POST_MAIN border-none shadow-none">
                <OrderForm
                  orderId={orderId}
                  onSubmit={handleOrderUpdate}
                  onCancel={handleCancel}
                  isSubmitting={isSubmitting}
                  submitButtonText="Update Order"
                  components={["General", "LineItems", "Calendar"]}
                />
              </AdminSinglePostMain>

              <AdminSinglePostSidebar className="flex flex-col gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Order Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <Button variant="outline" className="w-full">
                      Print Order
                    </Button>
                    <Button variant="outline" className="w-full">
                      Export PDF
                    </Button>
                    <Button variant="outline" className="w-full">
                      Send Email
                    </Button>
                  </CardContent>
                </Card>

                <OrderNotes orderId={orderId} />

                {/* <CalendarEventLink
                  orderId={orderId}
                  orderNumber={order?.orderNumber}
                /> */}
              </AdminSinglePostSidebar>
            </AdminSinglePostLayout>
          </AdminSinglePost>
        </div>

        {/* Media Section */}
        <div data-section="media">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">Order Media</h2>
              <MediaTabContent
                images={[]} // Orders don't have images by default, but can be extended
                onImageAdded={() => {}}
                onImageRemoved={() => {}}
                onImageUpdated={() => {}}
                maxFiles={10}
                acceptedFileTypes={[
                  "image/jpeg",
                  "image/png",
                  "image/webp",
                  "application/pdf",
                ]}
              />
            </CardContent>
          </Card>
        </div>

        {/* Items Section */}
        <div data-section="items">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">Order Items</h2>
              <p className="text-muted-foreground">
                Order items management would go here.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Customer Section */}
        <div data-section="customer">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">Customer Information</h2>
              <p className="text-muted-foreground">
                Customer details and history would go here.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Payment Section */}
        <div data-section="payment">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">Payment Details</h2>
              <p className="text-muted-foreground">
                Payment information and transaction history would go here.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Shipping Section */}
        <div data-section="shipping">
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">Shipping Information</h2>
              <p className="text-muted-foreground">
                Shipping details and tracking information would go here.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* History Section */}
        <div data-section="history">
          asd
          <Card>
            <CardContent className="p-6">
              <h2 className="mb-4 text-xl font-bold">Order History</h2>
              <OrderNotes orderId={orderId} />
            </CardContent>
          </Card>
        </div>

        {/* Plugin Sections - Dynamically rendered */}
        {pluginTabs.map((plugin) => {
          const PluginComponent = plugin.component;
          return (
            <div key={plugin.id} data-section={plugin.id}>
              <Card>
                <CardContent className="p-6">
                  <PluginComponent {...hookContext} />
                </CardContent>
              </Card>
            </div>
          );
        })}
      </AllSectionsRenderer>
    </div>
  );
}
