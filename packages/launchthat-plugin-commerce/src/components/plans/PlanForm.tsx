"use client";

import type { GenericId as Id } from "convex/values";
import { useEffect, useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { CreditCard, Plus, Save, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import { Input } from "@acme/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

const planFormSchema = z.object({
  name: z.enum(["free", "starter", "business", "agency"]),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  priceMonthly: z.number().min(0, "Monthly price must be 0 or greater"),
  priceYearly: z.number().optional(),
  maxOrganizations: z
    .number()
    .min(-1, "Max organizations must be -1 (unlimited) or greater"),
  features: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  sortOrder: z.number().optional(),
});

type PlanFormData = z.infer<typeof planFormSchema>;

export type PlanFormComponent = "General" | "Pricing" | "Features" | "Settings";

export interface PlanFormProps {
  planId?: Id<"plans">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: PlanFormData) => Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  components?: PlanFormComponent[];
  mode?: "dialog" | "inline";
}

export function PlanForm({
  planId,
  open = false,
  onOpenChange,
  onSubmit,
  onCancel,
  onSuccess,
  isSubmitting = false,
  submitButtonText = "Create Plan",
  components = ["General", "Pricing", "Features", "Settings"],
  mode = "dialog",
}: PlanFormProps) {
  const shouldShowComponent = (component: PlanFormComponent) =>
    components.includes(component);

  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  const plans = useQuery(api.core.organizations.queries.getPlans, {});
  const existingPlan = useMemo(
    () => plans?.find((plan) => plan._id === planId),
    [plans, planId],
  );

  const createPlan = useMutation(api.core.organizations.mutations.createPlan);
  const updatePlan = useMutation(api.core.organizations.mutations.updatePlan);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "free",
      displayName: "",
      description: "",
      priceMonthly: 0,
      priceYearly: undefined,
      maxOrganizations: 1,
      features: [],
      isActive: true,
      sortOrder: 0,
    },
  });

  useEffect(() => {
    if (existingPlan && planId && !isFormInitialized) {
      form.reset({
        name: existingPlan.name as "free" | "starter" | "business" | "agency",
        displayName: existingPlan.displayName ?? "",
        description: existingPlan.description ?? "",
        priceMonthly: (existingPlan.priceMonthly ?? 0) / 100,
        priceYearly: existingPlan.priceYearly
          ? existingPlan.priceYearly / 100
          : undefined,
        maxOrganizations: existingPlan.maxOrganizations ?? 1,
        features: existingPlan.features ?? [],
        isActive: existingPlan.isActive ?? true,
        sortOrder: existingPlan.sortOrder ?? 0,
      });
      setIsFormInitialized(true);
    }
  }, [existingPlan, planId, form, isFormInitialized]);

  useEffect(() => {
    if (!open && mode === "dialog") {
      form.reset();
      setIsFormInitialized(false);
    }
  }, [open, mode, form]);

  useEffect(() => {
    setIsFormInitialized(false);
  }, [planId]);

  const handleAddFeature = () => {
    if (!newFeature.trim()) {
      return;
    }
    const currentFeatures = form.getValues("features") ?? [];
    form.setValue("features", [...currentFeatures, newFeature.trim()], {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
    setNewFeature("");
  };

  const handleRemoveFeature = (index: number) => {
    const currentFeatures = form.getValues("features") ?? [];
    const nextFeatures = currentFeatures.filter((_, i) => i !== index);
    form.setValue("features", nextFeatures, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const handleSubmit = async (data: PlanFormData) => {
    const submitData = {
      name: data.name,
      displayName: data.displayName,
      description: data.description,
      priceMonthly: Math.round(data.priceMonthly * 100),
      priceYearly: data.priceYearly
        ? Math.round(data.priceYearly * 100)
        : undefined,
      maxOrganizations: data.maxOrganizations,
      features: data.features,
      isActive: data.isActive,
      sortOrder: data.sortOrder ?? 0,
    };

    try {
      if (onSubmit) {
        await onSubmit(data);
      } else if (planId) {
        await updatePlan({
          planId,
          ...submitData,
        });
        toast.success("Plan updated successfully");
      } else {
        await createPlan(submitData);
        toast.success("Plan created successfully");
      }

      onSuccess?.();

      if (mode === "dialog" && onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error submitting plan:", error);
      toast.error(planId ? "Failed to update plan" : "Failed to create plan");
    }
  };

  const handleCancel = () => {
    onCancel?.();
    if (mode === "dialog" && onOpenChange) {
      onOpenChange(false);
    }
    form.reset();
    setNewFeature("");
  };

  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {shouldShowComponent("General") && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="business">Business</SelectItem>
                        <SelectItem value="agency">Agency</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The internal plan type identifier
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter plan display name" {...field} />
                    </FormControl>
                    <FormDescription>The name shown to users</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter plan description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Brief description of what this plan offers
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {shouldShowComponent("Pricing") && (
          <Card>
            <CardHeader>
              <CardTitle>Pricing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="priceMonthly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Monthly Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          {...field}
                          onChange={(event) =>
                            field.onChange(parseFloat(event.target.value) || 0)
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Monthly subscription price in dollars
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="priceYearly"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yearly Price ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00 (optional)"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(event) =>
                            field.onChange(
                              event.target.value
                                ? parseFloat(event.target.value)
                                : undefined,
                            )
                          }
                        />
                      </FormControl>
                      <FormDescription>
                        Optional yearly subscription price
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="maxOrganizations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Maximum Organizations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="-1"
                        placeholder="1"
                        {...field}
                        onChange={(event) =>
                          field.onChange(parseInt(event.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Set -1 for unlimited organizations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {shouldShowComponent("Features") && (
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Add a feature"
                  value={newFeature}
                  onChange={(event) => setNewFeature(event.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddFeature}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(form.watch("features") ?? []).map((feature, index) => (
                  <span
                    key={`${feature}-${index}`}
                    className="bg-muted inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm"
                  >
                    {feature}
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(index)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {shouldShowComponent("Settings") && (
          <Card>
            <CardHeader>
              <CardTitle>Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel>Plan Status</FormLabel>
                      <FormDescription>
                        Toggle whether this plan is available for selection
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(event) =>
                          field.onChange(parseInt(event.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first in plan listings
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={handleCancel}>
            {mode === "dialog" ? "Cancel" : "Reset"}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="gap-2">
            <Save className="h-4 w-4" />
            {submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );

  if (mode === "inline") {
    return formContent;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{planId ? "Edit Plan" : "Create Plan"}</DialogTitle>
        </DialogHeader>
        {formContent}
      </DialogContent>
    </Dialog>
  );
}
