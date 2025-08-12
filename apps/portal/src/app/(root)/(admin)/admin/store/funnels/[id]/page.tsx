"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useParams } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/convex";
import { Loader2, Save, Trash } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import { FunnelForm } from "../_components/FunnelForm";

export default function FunnelEditPage() {
  const params = useParams<{ id: string }>();
  const id = params.id as Id<"funnels">;

  const funnel = useConvexQuery(
    api.ecommerce.funnels.queries.getAllFunnels,
    {},
  );
  const current = Array.isArray(funnel)
    ? (funnel as any).find((f: any) => String(f._id) === String(id))
    : undefined;

  if (funnel === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Loading funnel...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!current) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Funnel not found</p>
      </div>
    );
  }

  return (
    <div className="container py-6">
      <Card>
        <CardHeader>
          <CardTitle>Edit Funnel</CardTitle>
          <CardDescription>
            Update funnel details and checkout config
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FunnelForm
            id={id}
            initial={current}
            onSuccess={() => toast.success("Saved")}
          />
        </CardContent>
      </Card>
    </div>
  );
}
