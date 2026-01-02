"use client";

import type { PluginMetaBoxRendererProps } from "launchthat-plugin-core";
import { useMemo, useState, useTransition } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { toast } from "@acme/ui/toast";

type FunnelStepRow = {
  id: string;
  slug: string;
  title?: string;
  kind: string;
  order: number;
};

export const FunnelStepsMetaBox = (props: PluginMetaBoxRendererProps) => {
  const postId = props.context.postId;
  const organizationId = props.context.organizationId;
  const canEdit = Boolean(postId) && !props.context.isNewRecord;

  const ensureBaselineSteps = useMutation(
    (api.plugins.commerce.funnelSteps.mutations as any).ensureBaselineStepsForFunnel,
  ) as (args: any) => Promise<any>;

  const addFunnelStep = useMutation(
    (api.plugins.commerce.funnelSteps.mutations as any).addFunnelStep,
  ) as (args: any) => Promise<any>;

  const steps = useQuery(
    (api.plugins.commerce.funnelSteps.queries as any).getFunnelStepsForFunnel,
    postId
      ? {
          funnelId: postId,
          organizationId,
        }
      : "skip",
  ) as FunnelStepRow[] | undefined;

  const sorted = useMemo(() => {
    return (steps ?? []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [steps]);

  const hasCheckout = useMemo(
    () => sorted.some((s) => s.kind === "checkout"),
    [sorted],
  );
  const hasThankYou = useMemo(
    () => sorted.some((s) => s.kind === "thankYou"),
    [sorted],
  );

  const [isPending, startTransition] = useTransition();

  const [addOpen, setAddOpen] = useState(false);
  const [addKind, setAddKind] = useState<"checkout" | "upsell" | "thankYou">("upsell");
  const [addTitle, setAddTitle] = useState("");
  const [addSlug, setAddSlug] = useState("");
  const [addOrder, setAddOrder] = useState("");

  const handleEnsureSteps = () => {
    if (!postId) return;
    startTransition(() => {
      void ensureBaselineSteps({ funnelId: postId, organizationId })
        .then(() => toast.success("Created checkout + thank you steps."))
        .catch((err: unknown) =>
          toast.error("Failed to create steps.", {
            description: err instanceof Error ? err.message : "Unexpected error.",
          }),
        );
    });
  };

  const resetAddForm = () => {
    setAddKind("upsell");
    setAddTitle("");
    setAddSlug("");
    setAddOrder("");
  };

  const handleOpenAdd = () => {
    resetAddForm();
    setAddOpen(true);
  };

  const handleCreateStep = () => {
    if (!postId) return;
    const order =
      addOrder.trim().length > 0 && Number.isFinite(Number(addOrder))
        ? Number(addOrder)
        : undefined;

    startTransition(() => {
      void addFunnelStep({
        funnelId: postId,
        organizationId,
        kind: addKind,
        title: addTitle.trim().length > 0 ? addTitle.trim() : undefined,
        slug: addSlug.trim().length > 0 ? addSlug.trim() : undefined,
        order,
      })
        .then(() => {
          toast.success("Step added.");
          setAddOpen(false);
        })
        .catch((err: unknown) =>
          toast.error("Failed to add step.", {
            description: err instanceof Error ? err.message : "Unexpected error.",
          }),
        );
    });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="space-y-2">
          <div className="text-sm font-medium">Steps</div>
          <div className="text-muted-foreground text-sm">
            This funnel contains an ordered set of steps (checkout, thank you, upsells).
            We render the default funnel under <code>/checkout</code> and custom funnels
            under <code>/f/&lt;funnelSlug&gt;/&lt;stepSlug&gt;</code>.
          </div>
          <div className="text-muted-foreground text-xs">
            Funnel ID: <code>{postId ?? "(new)"}</code>
          </div>
        </div>
      </Card>

      <Card className="p-4">
        {postId ? (
          sorted.length > 0 ? (
            <div className="space-y-3">
              {sorted.map((step) => (
                <div
                  key={step.id}
                  className="flex flex-wrap items-center justify-between gap-2 border-b pb-2 last:border-b-0 last:pb-0"
                >
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {step.title ?? step.slug}
                    </div>
                    <div className="text-muted-foreground text-xs">
                      <span className="font-mono">{step.slug}</span> · {step.kind} · order{" "}
                      {step.order}
                    </div>
                  </div>
                  <a
                    className="text-sm underline"
                    href={`/admin/edit?post_type=funnel_steps&post_id=${encodeURIComponent(
                      step.id,
                    )}`}
                  >
                    Edit
                  </a>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-muted-foreground text-sm">
              No steps yet. Create the baseline checkout + thank you steps to get started.
            </div>
          )
        ) : (
          <div className="text-muted-foreground text-sm">
            Save this funnel first to create steps.
          </div>
        )}
      </Card>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          onClick={handleOpenAdd}
          disabled={!canEdit || isPending}
        >
          Add Step
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={handleEnsureSteps}
          disabled={!canEdit || isPending || (hasCheckout && hasThankYou)}
        >
          Create missing required steps
        </Button>
      </div>

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add funnel step</DialogTitle>
            <DialogDescription>
              Each funnel can have <strong>one</strong> Checkout and <strong>one</strong> Thank you page.
              Upsells can be added multiple times.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Step type</Label>
              <Select
                value={addKind}
                onValueChange={(v) => setAddKind(v as any)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="checkout" disabled={hasCheckout}>
                    Checkout
                  </SelectItem>
                  <SelectItem value="upsell">Upsell</SelectItem>
                  <SelectItem value="thankYou" disabled={hasThankYou}>
                    Thank you page
                  </SelectItem>
                </SelectContent>
              </Select>
              {(addKind === "checkout" && hasCheckout) || (addKind === "thankYou" && hasThankYou) ? (
                <div className="text-muted-foreground text-xs">
                  This funnel already has that step type.
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <Label>Title (optional)</Label>
              <Input
                value={addTitle}
                onChange={(e) => setAddTitle(e.currentTarget.value)}
                placeholder={addKind === "upsell" ? "Upsell" : addKind === "checkout" ? "Checkout" : "Thank you"}
              />
            </div>

            <div className="space-y-2">
              <Label>Step slug (optional)</Label>
              <Input
                value={addSlug}
                onChange={(e) => setAddSlug(e.currentTarget.value)}
                placeholder={addKind === "checkout" ? "checkout" : addKind === "thankYou" ? "thank-you" : "upsell"}
              />
              <div className="text-muted-foreground text-xs">
                This is the <code>/f/&lt;funnelSlug&gt;/&lt;stepSlug&gt;</code> segment for custom funnels.
              </div>
            </div>

            <div className="space-y-2">
              <Label>Order (optional)</Label>
              <Input
                inputMode="numeric"
                value={addOrder}
                onChange={(e) => setAddOrder(e.currentTarget.value)}
                placeholder="e.g. 0, 1, 1.5"
              />
              <div className="text-muted-foreground text-xs">
                Sorting order within the funnel. Lower comes first.
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setAddOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateStep}
              disabled={
                !canEdit ||
                isPending ||
                (addKind === "checkout" && hasCheckout) ||
                (addKind === "thankYou" && hasThankYou)
              }
            >
              Add
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};


