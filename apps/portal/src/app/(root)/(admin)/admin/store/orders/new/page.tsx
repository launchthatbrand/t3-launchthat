"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

import type {
  OrderFormData,
  OrderLineItem,
} from "~/components/admin/OrderForm";
import AdminSinglePost, {
  AdminSinglePostLayout,
  AdminSinglePostMain,
  AdminSinglePostSidebar,
} from "~/components/admin/AdminSinglePostLayout";
import { OrderForm } from "~/components/admin/OrderForm";

export default function NewOrderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Create order mutation
  const createOrderMutation = useMutation(
    api.ecommerce.orders.index.createOrder,
  );

  // Handle order submission
  const handleSubmit = async (formData: OrderFormData) => {
    setIsSubmitting(true);

    try {
      // Calculate totals
      const subtotal = formData.lineItems.reduce(
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
          phone: formData.phone,
          company: formData.company,
        },
        items: formData.lineItems.map((item: OrderLineItem) => ({
          productId: item.productId,
          productSnapshot: {
            name: item.product?.name ?? "",
            description: item.product?.description ?? "",
            price: item.price,
            imageUrl: item.product?.images?.[0]?.url,
          },
          quantity: item.quantity,
          lineTotal: item.lineTotal,
        })),
        shippingAddress: {
          ...formData.shippingAddress,
          fullName: `${formData.firstName} ${formData.lastName}`,
        },
        billingAddress: formData.useSameAsBilling
          ? {
              ...formData.shippingAddress,
              fullName: `${formData.firstName} ${formData.lastName}`,
            }
          : formData.billingAddress,
        subtotal,
        tax,
        shipping,
        total,
        paymentMethod: formData.paymentMethod,
        notes: formData.notes,
      };

      const result = await createOrderMutation(orderData);
      toast.success("Order created successfully!");
      router.push(`/admin/orders/${result.orderId}`);
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
