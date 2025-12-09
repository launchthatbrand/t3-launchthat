"use client";

import type { Doc, Id } from "@convex-config/_generated/dataModel";
import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@portal/convexspec";
import { useQuery } from "convex/react";
import { format } from "date-fns";
import { AlertTriangle, Eye, Plus } from "lucide-react";

import type {
  ColumnDefinition,
  EntityAction,
  FilterConfig,
} from "@acme/ui/entity-list/types";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";
import { EntityList } from "@acme/ui/entity-list/EntityList";

import { ChargebackForm } from "../../components/chargebacks/ChargebackForm";

type ChargebackRow = Doc<"chargebacks"> & Record<string, unknown>;

interface ChargebacksPageProps {
  buildChargebackHref?: (id: Id<"chargebacks">) => string;
  buildOrderHref?: (id: Id<"orders">) => string;
  onNavigate?: (href: string) => void;
}

export default function ChargebacksPage({
  buildChargebackHref,
  buildOrderHref,
  onNavigate,
}: ChargebacksPageProps = {}) {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const navigate = useCallback(
    (href: string) => {
      if (onNavigate) {
        onNavigate(href);
        return;
      }
      router.push(href);
    },
    [onNavigate, router],
  );
  const resolveChargebackHref = useCallback(
    (id: Id<"chargebacks">) =>
      buildChargebackHref
        ? buildChargebackHref(id)
        : `/admin/store/chargebacks/${id}`,
    [buildChargebackHref],
  );
  const resolveOrderHref = useCallback(
    (id: Id<"orders">) =>
      buildOrderHref ? buildOrderHref(id) : `/admin/store/orders/${id}`,
    [buildOrderHref],
  );

  // Get all chargebacks
  const chargebacksResult = useQuery(
    api.ecommerce.chargebacks.queries.getChargebacks,
    {},
  );
  const chargebacks = chargebacksResult ?? [];

  console.log("chargebacks", chargebacks);

  // Status badge styling
  const getStatusBadge = (status: ChargebackRow["status"]) => {
    const statusConfig = {
      received: { variant: "secondary" as const, label: "Received" },
      under_review: { variant: "default" as const, label: "Under Review" },
      accepted: { variant: "destructive" as const, label: "Accepted" },
      disputed: { variant: "outline" as const, label: "Disputed" },
      won: { variant: "default" as const, label: "Won" },
      lost: { variant: "destructive" as const, label: "Lost" },
      expired: { variant: "secondary" as const, label: "Expired" },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Format currency amount
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(amount / 100);
  };

  // Column definitions for the EntityList
  const columns = useMemo<ColumnDefinition<ChargebackRow>[]>(() => {
    return [
      {
        id: "chargebackId",
        accessorKey: "_id",
        header: "Chargeback ID",
        cell: (chargeback: ChargebackRow) => (
          <Link href={resolveChargebackHref(chargeback._id)}>
            {chargeback._id}
          </Link>
        ),
      },
      {
        id: "order",
        accessorKey: "orderId",
        header: "Order",
        cell: (chargeback: ChargebackRow) => (
          <Button
            variant="link"
            className="h-auto p-0 text-left"
            onClick={() =>
              navigate(resolveOrderHref(chargeback.orderId as Id<"orders">))
            }
          >
            {chargeback.orderId}
          </Button>
        ),
      },
      {
        id: "customer",
        accessorKey: "customerInfo",
        header: "Customer",
        cell: (chargeback: ChargebackRow) => (
          <div>
            <div className="font-medium">
              {chargeback.customerInfo?.name ?? "—"}
            </div>
            <div className="text-muted-foreground text-sm">
              {chargeback.customerInfo?.email ?? "No email"}
            </div>
          </div>
        ),
      },
      {
        id: "amount",
        accessorKey: "amount",
        header: "Amount",
        cell: (chargeback: ChargebackRow) => (
          <div className="font-medium">
            {formatAmount(chargeback.amount, chargeback.currency)}
          </div>
        ),
      },
      {
        id: "status",
        accessorKey: "status",
        header: "Status",
        cell: (chargeback: ChargebackRow) => getStatusBadge(chargeback.status),
      },
      {
        id: "reason",
        accessorKey: "reasonCode",
        header: "Reason",
        cell: (chargeback: ChargebackRow) => (
          <div>
            <div className="font-medium">{chargeback.reasonCode}</div>
            <div className="text-muted-foreground max-w-48 truncate text-sm">
              {chargeback.reasonDescription ?? "—"}
            </div>
          </div>
        ),
      },
      {
        id: "processor",
        accessorKey: "processorName",
        header: "Processor",
        cell: (chargeback: ChargebackRow) => (
          <Badge variant="outline">{chargeback.processorName}</Badge>
        ),
      },
      {
        id: "chargebackDate",
        accessorKey: "chargebackDate",
        header: "Chargeback Date",
        cell: (chargeback: ChargebackRow) =>
          format(new Date(chargeback.chargebackDate), "MMM dd, yyyy"),
      },
      {
        id: "disputeDeadline",
        accessorKey: "disputeDeadline",
        header: "Dispute Deadline",
        cell: (chargeback: ChargebackRow) => {
          if (!chargeback.disputeDeadline) {
            return <span className="text-muted-foreground">-</span>;
          }
          const deadlineDate = new Date(chargeback.disputeDeadline);
          const isOverdue = deadlineDate < new Date();
          return (
            <div
              className={`flex items-center gap-1 ${isOverdue ? "text-destructive" : ""}`}
            >
              {isOverdue && <AlertTriangle className="h-4 w-4" />}
              {format(deadlineDate, "MMM dd, yyyy")}
            </div>
          );
        },
      },
    ];
  }, [navigate, resolveChargebackHref, resolveOrderHref]);

  // Filter configurations
  const filters: FilterConfig<ChargebackRow>[] = [
    {
      id: "chargebackId",
      label: "Chargeback ID",
      type: "text",
      field: "chargebackId",
    },
    {
      id: "status",
      label: "Status",
      type: "select",
      field: "status",
      options: [
        { label: "Received", value: "received" },
        { label: "Under Review", value: "under_review" },
        { label: "Accepted", value: "accepted" },
        { label: "Disputed", value: "disputed" },
        { label: "Won", value: "won" },
        { label: "Lost", value: "lost" },
        { label: "Expired", value: "expired" },
      ],
    },
    {
      id: "processorName",
      label: "Processor",
      type: "select",
      field: "processorName",
      options: [
        { label: "Stripe", value: "Stripe" },
        { label: "Authorize.Net", value: "Authorize.Net" },
        { label: "PayPal", value: "PayPal" },
        { label: "Square", value: "Square" },
      ],
    },
  ];

  // Entity actions
  const entityActions: EntityAction<ChargebackRow>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (chargeback) => navigate(resolveChargebackHref(chargeback._id)),
      variant: "outline",
    },
  ];

  // Handle row click
  // const handleRowClick = (chargeback: Chargeback) => {
  //   router.push(`/admin/store/chargebacks/${chargeback._id}`);
  // };

  return (
    <div className="container mx-auto py-6">
      <EntityList<ChargebackRow>
        data={chargebacks}
        columns={columns}
        filters={filters}
        isLoading={chargebacksResult === undefined}
        title="Chargebacks"
        description="Manage chargebacks and disputes for your store"
        defaultViewMode="list"
        viewModes={["list"]}
        entityActions={entityActions}
        enableSearch={true}
        actions={
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Chargeback
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Chargeback</DialogTitle>
              </DialogHeader>
              <ChargebackForm
                onChargebackCreated={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <AlertTriangle className="text-muted-foreground mb-4 h-12 w-12" />
            <h3 className="text-lg font-medium">No Chargebacks Found</h3>
            <p className="text-muted-foreground">
              No chargebacks have been recorded yet
            </p>
          </div>
        }
        initialSort={{
          id: "_creationTime",
          direction: "desc",
        }}
      />
    </div>
  );
}
