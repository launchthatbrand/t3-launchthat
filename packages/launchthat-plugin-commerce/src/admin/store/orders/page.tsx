"use client";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { Eye, Package, PlusCircle, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import Link from "next/link";
import type { ReactNode } from "react";
import { api } from "@portal/convexspec";
import { toast } from "@acme/ui/toast";
import { useOrganization } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

type OrderRow = Doc<"orders"> & Record<string, unknown> & { email?: string };

export default function OrdersAdminPage() {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const { organization } = useOrganization();
  const organizationId = organization?.id as Id<"organizations">;

  const ordersResult = useQuery(
    api.ecommerce.orders.queries.listOrders,
    organizationId ? { organizationId } : {},
  );
  const orders = ordersResult ?? [];

  const deleteOrderMutation = useMutation(
    api.ecommerce.orders.mutations.deleteOrder,
  );

  // Helper functions
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Transform orders data for EntityList
  // const orders: OrderData[] = (ordersQuery ?? []).map((order) => ({
  //   ...order,
  //   formattedTotal: formatPrice(order.total),
  //   formattedDate: formatDate(order._creationTime),
  //   customerName: `${order.customerInfo.firstName} ${order.customerInfo.lastName}`,
  // }));

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "shipped":
        return "bg-indigo-100 text-indigo-800 hover:bg-indigo-100";
      case "delivered":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "completed":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "cancelled":
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
      case "refunded":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  const getPaymentStatusBadgeColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
      case "processing":
        return "bg-blue-100 text-blue-800 hover:bg-blue-100";
      case "paid":
        return "bg-green-100 text-green-800 hover:bg-green-100";
      case "failed":
        return "bg-red-100 text-red-800 hover:bg-red-100";
      case "refunded":
        return "bg-orange-100 text-orange-800 hover:bg-orange-100";
      default:
        return "bg-gray-100 text-gray-800 hover:bg-gray-100";
    }
  };

  // Handle delete order
  const handleDeleteOrder = async (order: OrderRow) => {
    if (isDeleting) return;
    setIsDeleting(true);
    try {
      await deleteOrderMutation({ orderId: order._id });
      toast.success("Order deleted successfully");
    } catch (error) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order");
    } finally {
      setIsDeleting(false);
    }
  };

  const columns = useMemo<ColumnDefinition<OrderRow>[]>(() => {
    return [
      {
        id: "orderId",
        accessorKey: "orderId",
        header: "Order ID",
        cell: (order: OrderRow) => (
          <Link
            href={`/admin/store/orders/${order._id}`}
            className="font-mono text-sm font-medium text-blue-600 hover:underline"
          >
            #{order.orderId}
          </Link>
        ),
      },
      {
        id: "date",
        accessorKey: "_creationTime",
        header: "Date",
        cell: (order: OrderRow) => (
          <div className="text-sm">{formatDate(order._creationTime)}</div>
        ),
      },
      {
        id: "customer",
        accessorKey: "customerInfo",
        header: "Customer",
        cell: (order: OrderRow) => (
          <div>
            <div className="font-medium">
              {`${order.customerInfo.firstName} ${order.customerInfo.lastName}`}
            </div>
            <div className="text-muted-foreground text-xs">
              {order.email ||
                (order.customerInfo as { email?: string }).email ||
                "No email"}
            </div>
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (order: OrderRow) => (
          <Badge
            className={getStatusBadgeColor(order.status)}
            variant="outline"
          >
            {order.status.replace(/_/g, " ").toUpperCase()}
          </Badge>
        ),
      },
      {
        id: "total",
        accessorKey: "total",
        header: "Total",
        cell: (order: OrderRow) => (
          <div className="text-right font-medium">
            {formatPrice(order.total)}
          </div>
        ),
      },
      {
        id: "paymentStatus",
        accessorKey: "paymentStatus",
        header: "Payment",
        cell: (order: OrderRow) => (
          <Badge
            className={getPaymentStatusBadgeColor(order.paymentStatus)}
            variant="outline"
          >
            {order.paymentStatus.replace(/_/g, " ").toUpperCase()}
          </Badge>
        ),
      },
    ];
  }, []);

  // Define filters
  const filters: FilterConfig<OrderRow>[] = [
    {
      id: "orderId",
      label: "Order ID",
      type: "text",
      field: "orderId",
    },
    {
      id: "email",
      label: "Customer Email",
      type: "text",
      field: "email",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Refunded", value: "refunded" },
      ],
    },
    {
      id: "paymentStatus",
      label: "Payment Status",
      type: "select",
      field: "paymentStatus",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Paid", value: "paid" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
      ],
    },
  ];

  // Define entity actions
  const entityActions: EntityAction<OrderRow>[] = [
    {
      id: "view",
      label: "View Details",
      onClick: (order) => router.push(`/admin/store/orders/${order._id}`),
      variant: "outline",
      icon: <Eye className="h-4 w-4" />,
    },
    {
      id: "delete",
      label: "Delete Order",
      onClick: (order) => handleDeleteOrder(order),
      variant: "destructive",
      icon: <Trash2 className="h-4 w-4" />,
      isDisabled: (order) =>
        order.status === "completed" || order.status === "shipped",
    },
  ];

  // Define header actions
  const headerActions: ReactNode = (
    <Button asChild>
      <Link href="/admin/store/orders/new">
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Order
      </Link>
    </Button>
  );

  return (
    <div className="container mx-auto py-6">
      <EntityList<OrderRow>
        data={orders}
        columns={columns}
        filters={filters}
        isLoading={ordersResult === undefined}
        title="Orders Management"
        description="Manage customer orders, track status, and handle fulfillment"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        actions={headerActions}
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <Package className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">No Orders Found</h3>
            <p className="text-muted-foreground">
              No orders have been placed yet
            </p>
            <Button asChild variant="outline" className="mt-4">
              <Link href="/admin/orders/new">
                <PlusCircle className="mr-2 h-4 w-4" />
                Create First Order
              </Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
