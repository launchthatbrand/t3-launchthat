"use client";

import type { Id } from "@convex-config/_generated/dataModel";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

import type {
  OrderFormData,
  OrderLineItem,
} from "../../../components/orders/OrderForm";
import { OrderForm } from "../../../components/orders/OrderForm";
import {
  AdminSinglePost,
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostSidebar,
} from "../../../ui/AdminSinglePostLayout";

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create order mutation
  const createOrder = useMutation(api.ecommerce.orders.mutations.createOrder);

  // Handle order submission
  const handleSubmit = async (formData: OrderFormData) => {
    setIsSubmitting(true);

    try {
      // Calculate totals
      type ProductLineItem = OrderLineItem & {
        productId: Id<"products">;
      };

      const productItems: ProductLineItem[] = formData.lineItems.filter(
        (item): item is ProductLineItem =>
          item.type === "product" && Boolean(item.productId),
      );

      if (productItems.length === 0) {
        toast.error(
          "Please add at least one product before creating an order.",
        );
        setIsSubmitting(false);
        return;
      }

      const subtotal = productItems.reduce(
        (sum: number, item: OrderLineItem) => sum + item.lineTotal,
        0,
      );
      const tax = subtotal * 0.08; // 8% tax rate - make this configurable
      const shipping = subtotal > 100 ? 0 : 10; // Free shipping over $100
      const total = subtotal + tax + shipping;

      const orderData = {
        userId: formData.userId,
        email: formData.email,
        customerInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
        },
        items: productItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
        totalAmount: total,
        notes: formData.notes || undefined,
      };

      const { recordId } = await createOrder(orderData);
      toast.success("Order created successfully!");
      router.push(`/admin/orders/${recordId}`);
    } catch (error) {
      console.error("Error creating order:", error);
      toast.error("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/admin/orders");
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center gap-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/admin/orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Create New Order</h1>
      </div>

      <AdminSinglePost
        postType="order"
        // postTitle={`Order ${orderId}`}
        // postId={orderId}
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
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              submitButtonText="Checkout Order"
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

            {/* <OrderNotes orderId={orderId} /> */}

            {/* <CalendarEventLink
                  orderId={orderId}
                  orderNumber={order?.orderNumber}
                /> */}
          </AdminSinglePostSidebar>
        </AdminSinglePostLayout>
      </AdminSinglePost>
    </div>
  );
}
