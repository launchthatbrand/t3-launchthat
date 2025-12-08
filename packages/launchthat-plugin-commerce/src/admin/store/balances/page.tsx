"use client";

import type { Doc } from "@convex-config/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
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

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
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
import { EntityList } from "@acme/ui/entity-list/EntityList";
import { Skeleton } from "@acme/ui/skeleton";

import { PaymentMethodForm } from "../../components/shared/PaymentMethodForm";

type StoreBalance = Doc<"storeBalances">;
type TransferRow = Doc<"transfers"> & Record<string, unknown>;
type BankAccountRow = Doc<"bankAccounts"> & Record<string, unknown>;

const formatAmount = (amount: number, currency = "USD") =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);

const statusBadge = (status: TransferRow["status"]) => {
  const config = {
    pending: { icon: Clock, label: "Pending", variant: "secondary" as const },
    in_transit: {
      icon: TrendingUp,
      label: "In Transit",
      variant: "default" as const,
    },
    completed: {
      icon: CheckCircle,
      label: "Completed",
      variant: "default" as const,
    },
    failed: {
      icon: XCircle,
      label: "Failed",
      variant: "destructive" as const,
    },
    cancelled: {
      icon: XCircle,
      label: "Cancelled",
      variant: "secondary" as const,
    },
    reversed: {
      icon: TrendingDown,
      label: "Reversed",
      variant: "destructive" as const,
    },
  } satisfies Record<
    TransferRow["status"],
    {
      icon: typeof Clock;
      label: string;
      variant: "secondary" | "default" | "destructive";
    }
  >;

  const { icon: Icon, label, variant } = config[status];
  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="h-3 w-3" />
      {label}
    </Badge>
  );
};

const bankStatusBadge = (status: BankAccountRow["status"]) => {
  const config = {
    pending_verification: { label: "Pending", variant: "secondary" as const },
    verified: { label: "Verified", variant: "default" as const },
    failed_verification: {
      label: "Failed",
      variant: "destructive" as const,
    },
    disabled: { label: "Disabled", variant: "outline" as const },
  };
  const entry = config[status];
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
};

export default function BalancesPage() {
  const router = useRouter();
  const [isAccountDialogOpen, setIsAccountDialogOpen] = useState(false);

  const storeBalanceResult = useQuery(
    api.ecommerce.balances.queries.getStoreBalance,
    {},
  );
  const transfersResult = useQuery(
    api.ecommerce.balances.queries.getTransfers,
    {},
  );
  const bankAccountsResult = useQuery(
    api.ecommerce.balances.queries.getBankAccounts,
    {},
  );

  const storeBalance = storeBalanceResult ?? null;
  const transfers = transfersResult ?? [];
  const bankAccounts = bankAccountsResult ?? [];

  const isStoreBalanceLoading = storeBalanceResult === undefined;
  const isTransfersLoading = transfersResult === undefined;
  const isAccountsLoading = bankAccountsResult === undefined;

  const handleNewTransfer = useCallback(() => {
    router.push("/admin/store/balances/transfers/new");
  }, [router]);

  const transferColumns = useMemo<ColumnDefinition<TransferRow>[]>(() => {
    const renderDate = (value?: number | null) =>
      value ? (
        format(new Date(value), "MMM dd, yyyy")
      ) : (
        <span className="text-muted-foreground">-</span>
      );

    return [
      {
        id: "transferId",
        accessorKey: "transferId",
        header: "Transfer ID",
        cell: (transfer: TransferRow) => (
          <span className="font-medium">{transfer.transferId ?? "—"}</span>
        ),
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        cell: (transfer: TransferRow) => (
          <span className="font-medium text-green-600">
            {formatAmount(transfer.amount, transfer.currency)}
          </span>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (transfer: TransferRow) => statusBadge(transfer.status),
      },
      {
        id: "initiatedAt",
        accessorKey: "initiatedAt",
        header: "Initiated",
        cell: (transfer: TransferRow) => renderDate(transfer.initiatedAt),
      },
      {
        id: "expectedArrival",
        accessorKey: "expectedArrival",
        header: "Expected Arrival",
        cell: (transfer: TransferRow) =>
          renderDate(transfer.expectedArrival ?? null),
      },
      {
        id: "completedAt",
        accessorKey: "completedAt",
        header: "Completed",
        cell: (transfer: TransferRow) =>
          renderDate(transfer.completedAt ?? null),
      },
      {
        id: "description",
        accessorKey: "description",
        header: "Description",
        cell: (transfer: TransferRow) =>
          transfer.description ?? (
            <span className="text-muted-foreground">-</span>
          ),
      },
      {
        id: "paymentProcessor",
        accessorKey: "paymentProcessor",
        header: "Processor",
        cell: (transfer: TransferRow) => (
          <Badge variant="outline">
            {transfer.paymentProcessor ?? "Unknown"}
          </Badge>
        ),
      },
    ];
  }, []);

  const transferFilters = useMemo<FilterConfig<TransferRow>[]>(() => {
    return [
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
  }, []);

  const transferActions = useMemo<EntityAction<TransferRow>[]>(() => {
    return [
      {
        id: "view",
        label: "View Details",
        icon: <Eye className="h-4 w-4" />,
        variant: "outline",
        onClick: (transfer) =>
          router.push(`/admin/store/balances/transfers/${transfer._id}`),
      },
    ];
  }, [router]);

  const transferHeaderActions = useMemo(
    () => (
      <Button size="sm" onClick={handleNewTransfer}>
        <Plus className="mr-2 h-4 w-4" />
        New Transfer
      </Button>
    ),
    [handleNewTransfer],
  );

  const bankAccountColumns = useMemo<ColumnDefinition<BankAccountRow>[]>(() => {
    return [
      {
        id: "accountName",
        accessorKey: "accountName",
        header: "Account",
        cell: (account: BankAccountRow) => (
          <div className="font-medium">{account.accountName ?? "—"}</div>
        ),
      },
      {
        id: "bankName",
        accessorKey: "bankName",
        header: "Bank",
        cell: (account: BankAccountRow) => account.bankName ?? "-",
      },
      {
        id: "accountType",
        accessorKey: "accountType",
        header: "Type",
        cell: (account: BankAccountRow) => (
          <Badge variant="outline" className="uppercase">
            {account.accountType}
          </Badge>
        ),
      },
      {
        id: "accountNumber",
        accessorKey: "accountNumber",
        header: "Account Number",
        cell: (account: BankAccountRow) => {
          if (!account.accountNumber) {
            return <span className="text-muted-foreground">-</span>;
          }
          return <>•••• {account.accountNumber.slice(-4)}</>;
        },
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (account: BankAccountRow) => bankStatusBadge(account.status),
      },
      {
        id: "isDefault",
        accessorKey: "isDefault",
        header: "Default",
        cell: (account: BankAccountRow) =>
          account.isDefault ? (
            <Badge variant="secondary">Default</Badge>
          ) : (
            <span className="text-muted-foreground">-</span>
          ),
      },
    ];
  }, []);

  const bankAccountActionsContent = (
    <Dialog open={isAccountDialogOpen} onOpenChange={setIsAccountDialogOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <CreditCard className="mr-2 h-4 w-4" />
          Add Bank Account
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Bank Account</DialogTitle>
        </DialogHeader>
        <PaymentMethodForm
          onSuccess={() => setIsAccountDialogOpen(false)}
          onCancel={() => setIsAccountDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );

  const balanceSummary = (() => {
    if (isStoreBalanceLoading) {
      return (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => (
            <Card key={`balance-skeleton-${index}`}>
              <CardContent className="space-y-3 py-6">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }

    if (!storeBalance) {
      return (
        <Card>
          <CardContent className="flex h-32 flex-col items-center justify-center text-center">
            <DollarSign className="text-muted-foreground mb-2 h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No balance information available yet.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Balance
            </CardTitle>
            <DollarSign className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatAmount(
                storeBalance.availableBalance,
                storeBalance.currency,
              )}
            </div>
            <p className="text-muted-foreground text-xs">Ready for transfer</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Balance
            </CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {formatAmount(storeBalance.pendingBalance, storeBalance.currency)}
            </div>
            <p className="text-muted-foreground text-xs">
              Processing transfers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatAmount(storeBalance.totalBalance, storeBalance.currency)}
            </div>
            <p className="text-muted-foreground text-xs">Total store funds</p>
          </CardContent>
        </Card>
      </div>
    );
  })();

  return (
    <div className="container mx-auto space-y-6 py-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Store Balance & Transfers</h1>
          <p className="text-muted-foreground">
            Review payouts, connect bank accounts, and track transfer history.
          </p>
        </div>
        <div className="flex gap-2">
          {bankAccountActionsContent}
          <Button size="sm" onClick={handleNewTransfer}>
            <Plus className="mr-2 h-4 w-4" />
            New Transfer
          </Button>
        </div>
      </div>

      {balanceSummary}

      <EntityList<TransferRow>
        title="Transfer History"
        description="View and manage payouts sent to your bank accounts."
        data={transfers}
        columns={transferColumns}
        filters={transferFilters}
        entityActions={transferActions}
        actions={transferHeaderActions}
        isLoading={isTransfersLoading}
        enableSearch
        defaultViewMode="list"
        viewModes={["list"]}
        onRowClick={(transfer) =>
          router.push(`/admin/store/balances/transfers/${transfer._id}`)
        }
        emptyState={
          <div className="flex h-40 flex-col items-center justify-center gap-2 text-center">
            <TrendingUp className="text-muted-foreground h-8 w-8" />
            <p className="text-muted-foreground text-sm">
              No transfers have been created yet.
            </p>
          </div>
        }
      />

      <EntityList<BankAccountRow>
        title="Connected Bank Accounts"
        description="Accounts available for transfers and payouts."
        data={bankAccounts}
        columns={bankAccountColumns}
        isLoading={isAccountsLoading}
        actions={bankAccountActionsContent}
        enableSearch={false}
        viewModes={["list"]}
        emptyState={
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-center">
            <CreditCard className="text-muted-foreground h-6 w-6" />
            <p className="text-muted-foreground text-sm">
              No bank accounts connected. Add one to start receiving transfers.
            </p>
          </div>
        }
      />
    </div>
  );
}
