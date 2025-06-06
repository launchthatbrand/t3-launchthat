"use client";

import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { formatPrice } from "@/lib/utils";
import { useQuery } from "convex/react";
import { Eye, PlusCircle } from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Define the Order type based on the Convex schema
interface OrderItem {
  _id: string;
  orderId: string;
  email: string;
  createdAt: number;
  updatedAt: number;
  status: string;
  paymentStatus: string;
  total: number;
  shippingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    stateOrProvince: string;
    postalCode: string;
    country: string;
    phoneNumber?: string;
  };
}

// Define the badge variant type for type safety
type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

export default function OrdersAdminPage() {
  const router = useRouter();

  // Fetch orders without pagination for EntityList to handle
  const ordersData = useQuery(api.ecommerce.orders.index.listOrders, {});

  // Format date
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle creating a new order
  const handleCreateOrder = () => {
    router.push("/admin/orders/create");
  };

  // Define column configurations for EntityList
  const columns: ColumnDefinition<OrderItem>[] = [
    {
      id: "orderId",
      header: "Order ID",
      accessorKey: "orderId",
      sortable: true,
      cell: (order) => (
        <span className="font-medium">
          {order.orderId || `#${order._id.substring(order._id.length - 8)}`}
        </span>
      ),
    },
    {
      id: "date",
      header: "Date",
      accessorKey: "createdAt",
      sortable: true,
      cell: (order) => formatDate(order.createdAt),
    },
    {
      id: "customer",
      header: "Customer",
      accessorKey: "email",
      sortable: true,
      cell: (order) => (
        <div>
          {order.email || "N/A"}
          {order.shippingAddress && (
            <div className="text-xs text-muted-foreground">
              {order.shippingAddress.fullName}
            </div>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      sortable: true,
      cell: (order) => {
        const statusMap: Record<
          string,
          { label: string; variant: BadgeVariant }
        > = {
          pending: { label: "Pending", variant: "secondary" },
          processing: { label: "Processing", variant: "default" },
          shipped: { label: "Shipped", variant: "default" },
          delivered: { label: "Delivered", variant: "outline" },
          completed: { label: "Completed", variant: "outline" },
          cancelled: { label: "Cancelled", variant: "destructive" },
          checked_in: { label: "Checked In", variant: "default" },
          checked_out: { label: "Checked Out", variant: "outline" },
        };

        // Check if status exists in the map, if not provide default values
        const status =
          order.status && order.status in statusMap
            ? statusMap[order.status]
            : {
                label: order.status || "Unknown",
                variant: "outline" as BadgeVariant,
              };

        return (
          <Badge variant={status.variant ?? "outline"}>
            {status.label ?? "Unknown"}
          </Badge>
        );
      },
    },
    {
      id: "paymentStatus",
      header: "Payment",
      accessorKey: "paymentStatus",
      sortable: true,
      cell: (order) => {
        const statusMap: Record<
          string,
          { label: string; variant: BadgeVariant }
        > = {
          pending: { label: "Pending", variant: "secondary" },
          paid: { label: "Paid", variant: "outline" },
          failed: { label: "Failed", variant: "destructive" },
          refunded: { label: "Refunded", variant: "outline" },
          partially_refunded: { label: "Partial Refund", variant: "outline" },
          free: { label: "Free", variant: "default" },
        };

        // Check if payment status exists in the map, if not provide default values
        const status =
          order.paymentStatus && order.paymentStatus in statusMap
            ? statusMap[order.paymentStatus]
            : {
                label: order.paymentStatus || "Unknown",
                variant: "outline" as BadgeVariant,
              };

        return (
          <Badge variant={status.variant ?? "outline"}>
            {status.label ?? "Unknown"}
          </Badge>
        );
      },
    },
    {
      id: "total",
      header: "Amount",
      accessorKey: "total",
      sortable: true,
      cell: (order) => formatPrice(order.total),
    },
  ];

  // Define filter configurations for EntityList
  const filters: FilterConfig<OrderItem>[] = [
    {
      id: "status",
      label: "Order Status",
      type: "select",
      field: "status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Processing", value: "processing" },
        { label: "Shipped", value: "shipped" },
        { label: "Delivered", value: "delivered" },
        { label: "Completed", value: "completed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Checked In", value: "checked_in" },
        { label: "Checked Out", value: "checked_out" },
      ],
    },
    {
      id: "paymentStatus",
      label: "Payment Status",
      type: "select",
      field: "paymentStatus",
      options: [
        { label: "Pending", value: "pending" },
        { label: "Paid", value: "paid" },
        { label: "Failed", value: "failed" },
        { label: "Refunded", value: "refunded" },
        { label: "Partially Refunded", value: "partially_refunded" },
        { label: "Free", value: "free" },
      ],
    },
  ];

  // Define entity row actions
  const entityActions: EntityAction<OrderItem>[] = [
    {
      id: "view",
      label: "View Details",
      onClick: (order) => {
        router.push(`/admin/orders/${order._id}`);
      },
      variant: "outline",
      icon: <Eye className="mr-2 h-4 w-4" />,
    },
  ];

  return (
    <div className="container p-6">
      <EntityList<OrderItem>
        data={ordersData ?? []}
        columns={columns}
        filters={filters}
        isLoading={ordersData === undefined}
        title="Order Management"
        description="View and manage all customer orders in one place"
        defaultViewMode="list"
        entityActions={entityActions}
        actions={
          <Button onClick={handleCreateOrder} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add New Order
          </Button>
        }
        emptyState={
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <p className="text-muted-foreground">No orders found</p>
          </div>
        }
      />
    </div>
  );
}
