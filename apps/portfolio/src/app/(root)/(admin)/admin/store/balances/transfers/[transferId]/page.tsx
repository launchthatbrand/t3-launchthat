"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc, Id } from "@convex-config/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  DollarSign,
  ExternalLink,
  Eye,
  Package,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Types for the transfer details page
type Transfer = Doc<"transfers">;
interface TransferOrder {
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
  const params = useParams();
  const router = useRouter();
  const transferId = params.transferId as string;

  // Get transfer data using the new properly typed query
  const transferData = useQuery(
    api.ecommerce.balances.index.getTransferWithOrders,
    transferId ? { transferId: transferId as Id<"transfers"> } : "skip",
  );

  console.log("[TransferDetailsPage] transferData", transferData);

  // Fallback: get basic transfer data if the enhanced query isn't working
  const basicTransferData = useQuery(
    api.ecommerce.balances.index.getTransferWithOrders,
    transferId ? { transferId: transferId as Id<"transfers"> } : "skip",
  );

  const bankAccountData = useQuery(
    api.ecommerce.balances.index.getBankAccount,
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
    if (!notes) return [];
    const orderIdMatches = notes.match(/orders:\s*([^.]+)/);
    if (orderIdMatches) {
      return orderIdMatches[1].split(",").map((id) => id.trim());
    }
    return [];
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
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending" },
      in_transit: { variant: "default" as const, label: "In Transit" },
      completed: { variant: "default" as const, label: "Completed" },
      failed: { variant: "destructive" as const, label: "Failed" },
      cancelled: { variant: "secondary" as const, label: "Cancelled" },
      reversed: { variant: "destructive" as const, label: "Reversed" },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Handle loading state
  if (transferData === undefined && !currentTransfer) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="mt-2 text-sm text-muted-foreground">
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
          <Package className="mb-4 h-12 w-12 text-muted-foreground" />
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
  const orderColumns: ColumnDef<TransferOrder>[] = [
    {
      accessorKey: "orderId",
      header: "Order ID",
      cell: ({ row }) => {
        const orderId = row.getValue("orderId");
        const orderDbId = row.original._id; // Get the Convex database ID
        return (
          <Button
            variant="link"
            className="h-auto p-0 text-left"
            onClick={() => router.push(`/admin/store/orders/${orderDbId}`)} // Use the database ID for navigation
          >
            {String(orderId)} {/* Display the human-readable order ID */}
          </Button>
        );
      },
    },
    {
      accessorKey: "customerInfo",
      header: "Customer",
      cell: ({ row }) => {
        const customerInfo = row.getValue(
          "customerInfo",
        ) as TransferOrder["customerInfo"];
        return (
          <div>
            <div className="font-medium">
              {customerInfo.firstName} {customerInfo.lastName}
            </div>
            <div className="text-sm text-muted-foreground">
              {customerInfo.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "subtotal",
      header: "Subtotal",
      cell: ({ row }) => {
        const amount = row.original.subtotal;
        return <div className="text-right">{formatAmount(amount || 0)}</div>;
      },
    },
    {
      accessorKey: "shipping",
      header: "Shipping",
      cell: ({ row }) => {
        const amount = row.original.shipping;
        return (
          <div className="text-right">
            {amount === 0 ? (
              <span className="text-sm text-green-600">FREE</span>
            ) : (
              formatAmount(amount || 0)
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "discount",
      header: "Discount",
      cell: ({ row }) => {
        const amount = row.original.discount;
        return (
          <div className="text-right">
            {amount && amount > 0 ? (
              <span className="text-green-600">-{formatAmount(amount)}</span>
            ) : (
              <span className="text-muted-foreground">—</span>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => {
        const amount = row.getValue("total") as number;
        return (
          <div className="text-right font-medium text-green-600">
            {formatAmount(amount)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Order Status",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("status")}</Badge>
      ),
    },
    {
      accessorKey: "paymentStatus",
      header: "Payment Status",
      cell: ({ row }) => (
        <Badge variant="default">{row.getValue("paymentStatus")}</Badge>
      ),
    },
    {
      accessorKey: "_creationTime",
      header: "Created",
      cell: ({ row }) => {
        const date = row.getValue("_creationTime") as number;
        return format(new Date(date), "MMM dd, yyyy");
      },
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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(transfer.amount, transfer.currency)}
            </div>
            {transfer.fees && (
              <p className="text-xs text-muted-foreground">
                Fees: {formatAmount(transfer.fees, transfer.currency)}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Initiated</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {format(new Date(transfer.initiatedAt), "MMM dd")}
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transfer.initiatedAt), "yyyy 'at' h:mm a")}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Expected Arrival
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {transfer.expectedArrival ? (
              <>
                <div className="text-2xl font-bold">
                  {format(new Date(transfer.expectedArrival), "MMM dd")}
                </div>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(transfer.expectedArrival), "yyyy")}
                </p>
              </>
            ) : (
              <div className="text-sm text-muted-foreground">Not available</div>
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
              <p className="text-sm text-muted-foreground">
                {transfer.processorTransferId || "Not available"}
              </p>
            </div>
            {transfer.description && (
              <div>
                <p className="text-sm font-medium">Description</p>
                <p className="text-sm text-muted-foreground">
                  {transfer.description}
                </p>
              </div>
            )}
            {transfer.failureReason && (
              <div>
                <p className="text-sm font-medium">Failure Reason</p>
                <p className="text-sm text-destructive">
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
              <p className="text-sm text-muted-foreground">
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
              <Package className="mb-4 h-12 w-12 text-muted-foreground" />
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
