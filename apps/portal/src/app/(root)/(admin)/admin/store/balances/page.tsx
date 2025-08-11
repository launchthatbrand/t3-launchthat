"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@convex-config/_generated/api";
import { Doc } from "@convex-config/_generated/dataModel";
import { ColumnDef } from "@tanstack/react-table";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import {
  CheckCircle,
  Clock,
  CreditCard,
  DollarSign,
  Eye,
  Plus,
  TrendingDown,
  TrendingUp,
  XCircle,
} from "lucide-react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import type {
  EntityAction,
  FilterConfig,
} from "~/components/shared/EntityList/types";
import { PaymentMethodForm } from "~/components/admin/PaymentMethodForm";
import { EntityList } from "~/components/shared/EntityList/EntityList";

// Real types from Convex API
type StoreBalance = Doc<"storeBalances">;
type Transfer = Doc<"transfers">;
type BankAccount = Doc<"bankAccounts">;

export default function BalancesPage() {
  const router = useRouter();
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);

  // Get real data from Convex
  const storeBalance = useQuery(api.ecommerce.queries.getStoreBalance, {});
  const transfers = useQuery(api.ecommerce.queries.getTransfers, {}) ?? [];
  const bankAccounts =
    useQuery(api.ecommerce.queries.getBankAccounts, {}) ?? [];

  // Format currency amount
  const formatAmount = (amount: number, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  // Status badge styling for transfers
  const getTransferStatusBadge = (status: Transfer["status"]) => {
    const statusConfig = {
      pending: { variant: "secondary" as const, label: "Pending", icon: Clock },
      in_transit: {
        variant: "default" as const,
        label: "In Transit",
        icon: TrendingUp,
      },
      completed: {
        variant: "default" as const,
        label: "Completed",
        icon: CheckCircle,
      },
      failed: {
        variant: "destructive" as const,
        label: "Failed",
        icon: XCircle,
      },
      cancelled: {
        variant: "secondary" as const,
        label: "Cancelled",
        icon: XCircle,
      },
      reversed: {
        variant: "destructive" as const,
        label: "Reversed",
        icon: TrendingDown,
      },
    };

    const config = statusConfig[status];
    const IconComponent = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  // Transfer columns for EntityList
  const transferColumns: ColumnDef<Transfer>[] = [
    {
      accessorKey: "transferId",
      header: "Transfer ID",
      cell: ({ row }) => (
        <div className="font-medium">{row.getValue("transferId")}</div>
      ),
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount");
        const currency = row.original.currency;
        return (
          <div className="font-medium text-green-600">
            {formatAmount(amount as number, currency)}
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getTransferStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "initiatedAt",
      header: "Initiated",
      cell: ({ row }) => {
        const date = row.getValue("initiatedAt");
        return format(new Date(date as number), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "expectedArrival",
      header: "Expected Arrival",
      cell: ({ row }) => {
        const date = row.getValue("expectedArrival");
        if (!date) return <span className="text-muted-foreground">-</span>;
        return format(new Date(date as number), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "completedAt",
      header: "Completed",
      cell: ({ row }) => {
        const date = row.getValue("completedAt");
        if (!date) return <span className="text-muted-foreground">-</span>;
        return format(new Date(date as number), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => {
        const description = row.getValue("description");
        return description ?? <span className="text-muted-foreground">-</span>;
      },
    },
    {
      accessorKey: "paymentProcessor",
      header: "Processor",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("paymentProcessor")}</Badge>
      ),
    },
  ];

  // Filter configurations for transfers
  const transferFilters: FilterConfig<Transfer>[] = [
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "Pending", value: "pending" },
        { label: "In Transit", value: "in_transit" },
        { label: "Completed", value: "completed" },
        { label: "Failed", value: "failed" },
        { label: "Cancelled", value: "cancelled" },
        { label: "Reversed", value: "reversed" },
      ],
    },
    {
      id: "paymentProcessor",
      label: "Processor",
      type: "select",
      field: "paymentProcessor",
      options: [
        { label: "Stripe", value: "Stripe" },
        { label: "Authorize.Net", value: "Authorize.Net" },
        { label: "PayPal", value: "PayPal" },
        { label: "Square", value: "Square" },
      ],
    },
  ];

  // Entity actions for transfers
  const transferActions: EntityAction<Transfer>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (transfer) => {
        router.push(`/admin/store/balances/transfers/${transfer._id}`);
      },
      variant: "outline",
    },
  ];

  // Handle transfer row click
  const handleTransferRowClick = (transfer: Transfer) => {
    router.push(`/admin/store/balances/transfers/${transfer._id}`);
  };

  // Get bank account status badge
  const getBankAccountStatusBadge = (status: BankAccount["status"]) => {
    const config = {
      pending_verification: { variant: "secondary" as const, label: "Pending" },
      verified: { variant: "default" as const, label: "Verified" },
      failed_verification: { variant: "destructive" as const, label: "Failed" },
      disabled: { variant: "outline" as const, label: "Disabled" },
    };
    return (
      <Badge variant={config[status].variant}>{config[status].label}</Badge>
    );
  };

  // Show loading state while data is loading
  if (storeBalance === undefined) {
    return (
      <div className="container mx-auto space-y-6 py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900" />
            <p className="mt-2 text-sm text-muted-foreground">
              Loading balance data...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Store Balance & Transfers</h1>
          <p className="text-muted-foreground">
            Manage your store balance and bank account transfers
          </p>
        </div>

        <div className="flex gap-2">
          <Dialog
            open={isAddAccountDialogOpen}
            onOpenChange={setIsAddAccountDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <CreditCard className="mr-2 h-4 w-4" />
                Add Bank Account
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Bank Account</DialogTitle>
              </DialogHeader>
              <PaymentMethodForm
                onSuccess={() => setIsAddAccountDialogOpen(false)}
                onCancel={() => setIsAddAccountDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </div>
      </div>

      {/* Balance Overview Cards */}
      {storeBalance ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Available Balance
              </CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatAmount(
                  storeBalance.availableBalance,
                  storeBalance.currency,
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Ready for transfer
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Pending Balance
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {formatAmount(
                  storeBalance.pendingBalance,
                  storeBalance.currency,
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Processing transfers
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Balance
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatAmount(storeBalance.totalBalance, storeBalance.currency)}
              </div>
              <p className="text-xs text-muted-foreground">Total store funds</p>
            </CardContent>
          </Card>
        </div>
      ) : (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center">
            <DollarSign className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No balance information available
            </p>
          </CardContent>
        </Card>
      )}

      {/* Balance Details */}
      {storeBalance && (
        <Card>
          <CardHeader>
            <CardTitle>Balance Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-sm font-medium">Payment Processor</p>
                <Badge variant="outline">{storeBalance.paymentProcessor}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Last Updated</p>
                <p className="text-sm text-muted-foreground">
                  {format(
                    new Date(storeBalance.lastUpdated),
                    "MMM dd, yyyy 'at' h:mm a",
                  )}
                </p>
              </div>
              {storeBalance.storeName && (
                <div>
                  <p className="text-sm font-medium">Store Name</p>
                  <p className="text-sm text-muted-foreground">
                    {storeBalance.storeName}
                  </p>
                </div>
              )}
              {storeBalance.storeId && (
                <div>
                  <p className="text-sm font-medium">Store ID</p>
                  <p className="text-sm text-muted-foreground">
                    {storeBalance.storeId}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Bank Accounts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Connected Bank Accounts</CardTitle>
            <Dialog
              open={isAddAccountDialogOpen}
              onOpenChange={setIsAddAccountDialogOpen}
            >
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Account
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {bankAccounts.length > 0 ? (
            <div className="space-y-4">
              {bankAccounts.map((account: BankAccount) => (
                <div
                  key={account._id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div className="flex items-center space-x-4">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{account.accountName}</p>
                        {account.isDefault && (
                          <Badge variant="secondary" className="text-xs">
                            Default
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {account.bankName} • {account.accountType} •{" "}
                        {account.accountNumber}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getBankAccountStatusBadge(account.status)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed">
              <CreditCard className="mb-2 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No bank accounts connected
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transfer History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Transfer History</h2>

        <EntityList<Transfer>
          data={transfers}
          columns={transferColumns}
          filters={transferFilters}
          isLoading={transfers === undefined}
          title="Transfers"
          description="View and manage your bank account transfers"
          defaultViewMode="list"
          viewModes={["list"]}
          entityActions={transferActions}
          enableSearch={true}
          onRowClick={handleTransferRowClick}
          emptyState={
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
              <TrendingUp className="mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="text-lg font-medium">No Transfers Found</h3>
              <p className="text-muted-foreground">
                No transfers have been initiated yet
              </p>
            </div>
          }
          initialSort={{
            id: "initiatedAt",
            direction: "desc",
          }}
        />
      </div>
    </div>
  );
}
