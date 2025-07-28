"use client";

import { ArrowLeft, Edit } from "lucide-react";
import { Card, CardContent } from "@acme/ui/card";
import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { Button } from "@acme/ui/button";
import type { Id } from "@convex-config/_generated/dataModel";
import { OrderForm } from "~/components/admin/OrderForm";
import type { OrderFormData } from "~/components/admin/OrderForm";
import { api } from "@convex-config/_generated/api";
import { toast } from "@acme/ui/toast";
import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const { isLoaded: isAuthLoaded } = useAuth();

  // Get orderId from params
  const orderId = params.orderId as Id<"orders">;

  // Fetch order details - only when auth is loaded to prevent permission errors on hard refresh
  const order = useQuery(
    api.ecommerce.orders.index.getOrder,
    isAuthLoaded ? { orderId } : "skip",
  );

  // Handle order update
  const handleOrderUpdate = async (formData: OrderFormData) => {
    try {
      // TODO: Implement actual order update mutation
      console.log("Order update data:", formData);
      await new Promise((resolve) => setTimeout(resolve, 100)); // Simulate async operation
      toast.success("Order updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating order:", error);
      toast.error("Failed to update order");
    }
  };

  // Handle cancel editing
  const handleCancel = () => {
    setIsEditing(false);
  };

  // Loading state
  if (!order) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="mb-4 h-8 w-1/4 rounded bg-gray-200"></div>
          <div className="mb-4 h-64 rounded bg-gray-200"></div>
          <div className="h-64 rounded bg-gray-200"></div>
        </div>
      </div>
    );
  }

  // Handle not found
  if (!order) {
    return (
      <div className="p-6">
        <Button variant="ghost" onClick={() => router.back()} className="mb-6">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
        <Card>
          <CardContent className="pt-6">
            <div className="p-6 text-center">
              <h2 className="mb-2 text-xl font-semibold">Order Not Found</h2>
              <p className="text-muted-foreground">
                The order you are looking for does not exist or you do not have
                permission to view it.
              </p>
              <Button
                onClick={() => router.push("/admin/store/orders")}
                className="mt-4"
              >
                View All Orders
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      <OrderForm
        orderId={orderId}
        onSubmit={handleOrderUpdate}
        onCancel={handleCancel}
        submitButtonText="Update Order"
      />
    </div>
  );
}
