"use client";

import { AlertTriangle, Eye, Plus } from "lucide-react";
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
import React, { useState } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { ChargebackForm } from "~/components/admin/ChargebackForm";
import { ColumnDef } from "@tanstack/react-table";
import { Doc } from "@convex-config/_generated/dataModel";
import { EntityList } from "~/components/shared/EntityList/EntityList";
import Link from "next/link";
import { api } from "@convex-config/_generated/api";
import { format } from "date-fns";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";

type Chargeback = Doc<"chargebacks">;

export default function ChargebacksPage() {
  const router = useRouter();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get all chargebacks
  const chargebacks = useQuery(
    api.ecommerce.chargebacks.index.getChargebacks,
    {},
  );

  console.log("chargebacks", chargebacks);

  // Status badge styling
  const getStatusBadge = (status: Chargeback["status"]) => {
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
  const columns: ColumnDef<Chargeback>[] = [
    {
      accessorKey: "_id",
      header: "Chargeback ID",
      cell: ({ row }) => (
        <Link href={`/admin/store/chargebacks/${row.getValue("_id")}`}>
          {row.getValue("_id")}
        </Link>
      ),
    },
    {
      accessorKey: "orderId",
      header: "Order",
      cell: ({ row }) => {
        const orderId = row.getValue("orderId");
        return (
          <Button
            variant="link"
            className="h-auto p-0 text-left"
            onClick={() =>
              router.push(`/admin/store/orders/${orderId as string}`)
            }
          >
            {orderId as string}
          </Button>
        );
      },
    },
    {
      accessorKey: "customerInfo",
      header: "Customer",
      cell: ({ row }) => {
        const customerInfo = row.getValue("customerInfo");
        return (
          <div>
            <div className="font-medium">{customerInfo.name}</div>
            <div className="text-sm text-muted-foreground">
              {customerInfo.email}
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = row.getValue("amount") as number;
        const currency = row.original.currency;
        return (
          <div className="font-medium">{formatAmount(amount, currency)}</div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => getStatusBadge(row.getValue("status")),
    },
    {
      accessorKey: "reasonCode",
      header: "Reason",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.getValue("reasonCode")}</div>
          <div className="max-w-48 truncate text-sm text-muted-foreground">
            {row.original.reasonDescription}
          </div>
        </div>
      ),
    },
    {
      accessorKey: "processorName",
      header: "Processor",
      cell: ({ row }) => (
        <Badge variant="outline">{row.getValue("processorName")}</Badge>
      ),
    },
    {
      accessorKey: "chargebackDate",
      header: "Chargeback Date",
      cell: ({ row }) => {
        const date = row.getValue("chargebackDate") as number;
        return format(new Date(date), "MMM dd, yyyy");
      },
    },
    {
      accessorKey: "disputeDeadline",
      header: "Dispute Deadline",
      cell: ({ row }) => {
        const deadline = row.getValue("disputeDeadline") as number | undefined;
        if (!deadline) return <span className="text-muted-foreground">-</span>;

        const deadlineDate = new Date(deadline);
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

  // Filter configurations
  const filters: FilterConfig<Chargeback>[] = [
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
  const entityActions: EntityAction<Chargeback>[] = [
    {
      id: "view",
      label: "View Details",
      icon: <Eye className="h-4 w-4" />,
      onClick: (chargeback) =>
        router.push(`/admin/store/chargebacks/${chargeback._id}`),
      variant: "outline",
    },
  ];

  // Handle row click
  // const handleRowClick = (chargeback: Chargeback) => {
  //   router.push(`/admin/store/chargebacks/${chargeback._id}`);
  // };

  return (
    <div className="container mx-auto py-6">
      <EntityList<Chargeback>
        data={chargebacks ?? []}
        columns={columns}
        filters={filters}
        isLoading={chargebacks === undefined}
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
                onSuccess={() => setIsCreateDialogOpen(false)}
                onCancel={() => setIsCreateDialogOpen(false)}
              />
            </DialogContent>
          </Dialog>
        }
        emptyState={
          <div className="flex h-64 flex-col items-center justify-center rounded-lg border border-dashed">
            <AlertTriangle className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No Chargebacks Found</h3>
            <p className="text-muted-foreground">
              No chargebacks have been recorded yet
            </p>
          </div>
        }
        initialSort={{
          key: "_creationTime",
          direction: "desc",
        }}
      />
    </div>
  );
}
