"use client";

import type { Id } from "@/convex/_generated/dataModel";
import type { ColumnDef } from "@tanstack/react-table";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexMutation, useConvexQuery } from "@/hooks/convex";
import { Edit, Plus, Trash } from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@acme/ui/dialog";

import { EntityList } from "~/components/shared/EntityList/EntityList";
import { FunnelForm } from "./_components/FunnelForm";

export default function FunnelsPage() {
  return <AuthenticatedFunnelsPage />;
}

function AuthenticatedFunnelsPage() {
  const isAdminResult = useConvexQuery(
    api.core.accessControl.queries.checkIsAdmin,
    {},
  ) as boolean | undefined;

  if (isAdminResult === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Verifying admin status...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return <FunnelsContent />;
}

interface FunnelListItem {
  _id: Id<"funnels">;
  title: string;
  slug: string;
  status: string;
  productIds: Id<"products">[];
  collectEmail?: boolean;
  collectName?: boolean;
  collectPhone?: boolean;
  collectShippingAddress?: boolean;
}

function FunnelsContent() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);

  const funnels = useConvexQuery(
    api.ecommerce.funnels.queries.getAllFunnels,
    {},
  ) as FunnelListItem[] | undefined | null;

  // Mutations
  const deleteCustomCheckout = useConvexMutation(
    api.ecommerce.funnels.mutations.deleteCustomCheckout,
  );

  const handleDeleteCheckout = async (id: Id<"funnels">) => {
    if (confirm("Are you sure you want to delete this funnel?")) {
      try {
        await deleteCustomCheckout({ id });
        toast.success("Funnel deleted successfully");
      } catch (error) {
        console.error("Failed to delete funnel:", error);
        toast.error("Failed to delete funnel", {
          description: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  };

  const columns: ColumnDef<FunnelListItem>[] = [
    {
      id: "title",
      header: "Title",
      accessorKey: "title",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.title}</span>
      ),
    },
    {
      id: "slug",
      header: "Slug",
      accessorKey: "slug",
      cell: ({ row }) => (
        <code className="rounded bg-muted px-1 py-0.5 font-mono text-sm">
          {row.original.slug}
        </code>
      ),
    },
    {
      id: "products",
      header: "Products",
      cell: ({ row }) => row.original.productIds.length,
    },
    {
      id: "fields",
      header: "Fields",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.collectEmail && (
            <Badge variant="outline" className="text-xs">
              Email
            </Badge>
          )}
          {row.original.collectName && (
            <Badge variant="outline" className="text-xs">
              Name
            </Badge>
          )}
          {row.original.collectPhone && (
            <Badge variant="outline" className="text-xs">
              Phone
            </Badge>
          )}
          {row.original.collectShippingAddress && (
            <Badge variant="outline" className="text-xs">
              Shipping
            </Badge>
          )}
        </div>
      ),
    },
    {
      id: "status",
      header: "Status",
      accessorKey: "status",
      cell: ({ row }) => (
        <Badge
          variant={
            row.original.status === "active"
              ? "default"
              : row.original.status === "draft"
                ? "secondary"
                : "outline"
          }
        >
          {row.original.status}
        </Badge>
      ),
    },
  ];

  const entityActions = [
    {
      id: "edit",
      label: "Edit",
      icon: <Edit className="h-4 w-4" />,
      onClick: (item: FunnelListItem) => {
        router.push(`/admin/store/funnels/${item._id}`);
      },
      variant: "ghost" as const,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash className="h-4 w-4" />,
      onClick: (item: FunnelListItem) => {
        void handleDeleteCheckout(item._id);
      },
      variant: "ghost" as const,
    },
  ];

  const createActions = (
    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Funnel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Funnel</DialogTitle>
          <DialogDescription>
            Configure a funnel experience for your customers
          </DialogDescription>
        </DialogHeader>
        <FunnelForm
          onSuccess={() => {
            setDialogOpen(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="container py-6">
      <Card>
        <CardContent className="p-6">
          <EntityList<FunnelListItem>
            title="All Funnels"
            description="Create and manage funnels with bundled products and custom fields"
            data={Array.isArray(funnels) ? funnels : []}
            isLoading={funnels === undefined}
            columns={columns}
            entityActions={entityActions}
            actions={createActions}
            enableSearch
          />
        </CardContent>
      </Card>
    </div>
  );
}
