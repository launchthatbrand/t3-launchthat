"use client";

import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  Package,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Doc } from "src/lib/types";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { Id } from "@convex-config/_generated/dataModel";
import React from "react";
import { api } from "@portal/convexspec";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useStoreRouteSegments } from "../../../StoreRouteContext";

// Types for the transfer details page
type Transfer = Doc<"transfers">;
interface TransferOrder extends Record<string, unknown> {
  _id: Id<"orders">;
  _creationTime: number;
  orderId: string;
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
  total: number;
  status: string;
  paymentStatus: string;
  items: {
    productId: string;
    productSnapshot: {
      name: string;
      price: number;
      imageUrl?: string;
    };
    quantity: number;
    lineTotal: number;
  }[];
  subtotal: number;
  shipping: number;
  discount: number;
}

export default function TransferDetailsPage() {
  const segments = useStoreRouteSegments();
  const router = useRouter();
  const transferId = segments[2] as string | undefined;

  if (!transferId) {
    return (
      <div className="container py-6">
        <Card>
          <CardHeader>
            <CardTitle>Transfer not found</CardTitle>
          </CardHeader>
          <CardContent>
            Unable to determine the requested transfer from the current URL.
          </CardContent>
        </Card>
      </div>
    );
  }

  // Get transfer data using the new properly typed query
  const transferData = useQuery(
    api.ecommerce.balances.queries.getTransferWithOrders,
    transferId ? { transferId: transferId as Id<"transfers"> } : "skip",
  );

  console.log("[TransferDetailsPage] transferData", transferData);

  // Fallback: get basic transfer data if the enhanced query isn't working
  const basicTransferData = useQuery(
    api.ecommerce.balances.queries.getTransferWithOrders,
    transferId ? { transferId: transferId as Id<"transfers"> } : "skip",
  );

  const bankAccountData = useQuery(
    api.ecommerce.balances.queries.getBankAccount,
    transferData?.transfer?.bankAccountId
      ? { bankAccountId: transferData.transfer.bankAccountId }
      : "skip",
  );

  // Use transfer data from enhanced query or fallback to basic data
  const currentTransfer = transferData?.transfer || basicTransferData;
  const transfer = currentTransfer;
  const bankAccount = transferData?.bankAccount || bankAccountData;
  const relatedOrders = transferData?.orders || [];

  // Extract orders from notes if available (for backwards compatibility)
  const getOrdersFromNotes = (notes?: string): string[] => {
    if (!notes) {
      return [];
    }
    const match = notes.match(/orders:\s*([^.]+)/);
    if (!match?.[1]) {
      return [];
    }
    return match[1].split(",").map((id) => id.trim());
  };

  // Format currency amount
  const formatAmount = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  // Status badge styling
  const getStatusBadge = (status: Transfer["status"]) => {
    const statusConfig: Record<
      string,
      { variant: "secondary" | "default" | "destructive"; label: string }
    > = {
      pending: { variant: "secondary", label: "Pending" },
      in_transit: { variant: "default", label: "In Transit" },
      completed: { variant: "default", label: "Completed" },
      failed: { variant: "destructive", label: "Failed" },
      cancelled: { variant: "secondary", label: "Cancelled" },
      reversed: { variant: "destructive", label: "Reversed" },
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    if (!config) {
      return (
        <Badge variant="secondary" className="uppercase">
          {(status as string) ?? "unknown"}
        </Badge>
      );
    }
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Handle loading state
  if (transferData === undefined && !currentTransfer) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="text-muted-foreground mt-2 text-sm">
              Loading transfer details...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Use the enhanced data if available, otherwise fallback to basic data
  // const transfer = transferData?.transfer || currentTransfer;
  // const bankAccount = transferData?.bankAccount;
  // const relatedOrders = transferData?.orders || [];

  if (!transfer) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 flex-col items-center justify-center">
          <Package className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="text-lg font-medium">Transfer Not Found</h3>
          <p className="text-muted-foreground">
            The requested transfer could not be found.
          </p>
          <Button
            variant="outline"
            onClick={() => router.push("/admin/store/balances")}
            className="mt-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Balances
          </Button>
        </div>
      </div>
    );
  }

  // Extract order IDs from notes for debugging
  const orderIdsFromNotes = getOrdersFromNotes(transfer.notes);
  console.log("[TransferDetailsPage] orderIdsFromNotes", orderIdsFromNotes);
  console.log("[TransferDetailsPage] relatedOrders", relatedOrders);

  // Mock order data for display if no real orders are found
  const displayOrders: TransferOrder[] =
    relatedOrders.length > 0
      ? relatedOrders
      : orderIdsFromNotes.map((orderId, index) => {
          const itemTotal = (index + 1) * 1999; // Line total
          const subtotal = itemTotal;
          const shipping = Math.floor(Math.random() * 1000) + 500; // $5-$15 shipping
          const discount =
            Math.random() > 0.7 ? Math.floor(Math.random() * 500) + 200 : 0; // 30% chance of $2-$7 discount
          const total = subtotal + shipping - discount;

          return {
            _id: `mock_${orderId}` as Id<"orders">,
            _creationTime: Date.now(),
            orderId: orderId,
            customerInfo: {
              firstName: "MOCK",
              lastName: "USER",
              email: "mockuser@launchthat.app",
            },
            total: total,
            subtotal: subtotal,
            shipping: shipping,
            discount: discount,
            status: "completed",
            paymentStatus: "paid",
            items: [
              {
                productId: "mock_product",
                productSnapshot: {
                  name: "MOCK PRODUCT",
                  price: 1999,
                  imageUrl: undefined,
                },
                quantity: index + 1,
                lineTotal: itemTotal,
              },
            ],
          };
        });

  // Define columns for the orders table
  const orderColumns: ColumnDefinition<TransferOrder>[] = [
    {
      id: "orderId",
      accessorKey: "orderId",
      header: "Order ID",
      cell: (order: TransferOrder) => (
        <Button
          variant="link"
          className="h-auto p-0 text-left"
          onClick={() => router.push(`/admin/store/orders/${order._id}`)}
        >
          {order.orderId}
        </Button>
      ),
    },
    {
      id: "customerInfo",
      accessorKey: "customerInfo",
      header: "Customer",
      cell: (order: TransferOrder) => (
        <div>
          <div className="font-medium">
            {order.customerInfo.firstName} {order.customerInfo.lastName}
          </div>
          <div className="text-muted-foreground text-sm">
            {order.customerInfo.email}
          </div>
        </div>
      ),
    },
    {
      id: "subtotal",
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: (order: TransferOrder) => (
        <div className="text-right">{formatAmount(order.subtotal || 0)}</div>
      ),
    },
    {
      id: "shipping",
      accessorKey: "shipping",
      header: "Shipping",
      cell: (order: TransferOrder) => (
        <div className="text-right">
          {order.shipping === 0 ? (
            <span className="text-sm text-green-600">FREE</span>
          ) : (
            formatAmount(order.shipping || 0)
          )}
        </div>
      ),
    },
    {
      id: "discount",
      accessorKey: "discount",
      header: "Discount",
      cell: (order: TransferOrder) => (
        <div className="text-right">
          {order.discount && order.discount > 0 ? (
            <span className="text-green-600">
              -{formatAmount(order.discount)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </div>
      ),
    },
    {
      id: "total",
      accessorKey: "total",
      header: "Total",
      cell: (order: TransferOrder) => (
        <div className="text-right font-medium text-green-600">
          {formatAmount(order.total ?? 0)}
        </div>
      ),
    },
    {
      id: "status",
      accessorKey: "status",
      header: "Order Status",
      cell: (order: TransferOrder) => (
        <Badge variant="outline">{order.status}</Badge>
      ),
    },
    {
      id: "paymentStatus",
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: (order: TransferOrder) => (
        <Badge variant="default">{order.paymentStatus}</Badge>
      ),
    },
    {
      id: "_creationTime",
      accessorKey: "_creationTime",
      header: "Created",
      cell: (order: TransferOrder) =>
        format(new Date(order._creationTime), "MMM dd, yyyy"),
    },
  ];

  // Entity actions for orders
  const orderActions: EntityAction<TransferOrder>[] = [
    {
      id: "view",
      label: "View Order",
      icon: <ExternalLink className="h-4 w-4" />,
      onClick: (order) => router.push(`/admin/store/orders/${order._id}`),
      variant: "outline",
    },
  ];

  // Handle order row click
  // const handleOrderRowClick = (order: TransferOrder) => {
  //   router.push(`/admin/store/orders/${order.orderId}`);
  // };

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => router.push("/admin/store/balances")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Balances
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Transfer Details</h1>
            <p className="text-muted-foreground">
              Transfer ID: {transfer.transferId}
            </p>
          </div>
        </div>
        {getStatusBadge(transfer.status)}
      </div>

      {/* Transfer Overview */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Transfer Amount
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(transfer.amount, transfer.currency)}
            </div>
            {transfer.fees && (
              <p className="text-muted-foreground text-xs">
                Fees: {formatAmount(transfer.fees, transfer.currency)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initiated</CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(transfer.initiatedAt), "MMM dd")}
            </div>
            <p className="text-muted-foreground text-xs">
              {format(new Date(transfer.initiatedAt), "yyyy 'at' h:mm a")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expected Arrival
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {transfer.expectedArrival ? (
              <>
                <div className="text-2xl font-bold">
                  {format(new Date(transfer.expectedArrival), "MMM dd")}
                </div>
                <p className="text-muted-foreground text-xs">
                  {format(new Date(transfer.expectedArrival), "yyyy")}
                </p>
              </>
            ) : (
              <div className="text-muted-foreground text-sm">Not available</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Transfer Details */}
      <Card>
        <CardHeader>
          <CardTitle>Transfer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Payment Processor</p>
              <Badge variant="outline">{transfer.paymentProcessor}</Badge>
            </div>
            <div>
              <p className="text-sm font-medium">Processor Transfer ID</p>
              <p className="text-muted-foreground text-sm">
                {transfer.processorTransferId || "Not available"}
              </p>
            </div>
            {transfer.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-muted-foreground text-sm">
                  {transfer.description}
                </p>
              </div>
            )}
            {transfer.failureReason && (
              <div>
                <p className="text-sm font-medium">Failure Reason</p>
                <p className="text-destructive text-sm">
                  {transfer.failureReason}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Bank Account Information */}
      {bankAccount && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Bank Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">{bankAccount.accountName}</span>
                <Badge variant="secondary">{bankAccount.accountType}</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {bankAccount.bankName} • {bankAccount.accountNumber}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Debug Information */}
      {orderIdsFromNotes.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <CardHeader>
            <CardTitle className="text-yellow-800 dark:text-yellow-200">
              Debug Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Found {orderIdsFromNotes.length} order IDs in transfer notes:{" "}
              {orderIdsFromNotes.join(", ")}
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              {relatedOrders.length > 0
                ? `Showing ${relatedOrders.length} orders from junction table`
                : "No orders found in junction table - showing mock data"}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Related Orders */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Related Orders</h2>

        <EntityList<TransferOrder>
          data={displayOrders}
          columns={orderColumns}
          filters={[]}
          isLoading={false}
          title="Orders in this Transfer"
          description={`${displayOrders.length} orders included in this transfer`}
          defaultViewMode="list"
          viewModes={["list"]}
          entityActions={orderActions}
          enableSearch={true}
          emptyState={
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
              <Package className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="text-lg font-medium">No Orders Found</h3>
              <p className="text-muted-foreground">
                No orders are associated with this transfer
              </p>
            </div>
          }
        />
      </div>
    </div>
  );
}
