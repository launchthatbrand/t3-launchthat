"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { CreditCard, Plus, Save, Trash2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
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

// Form validation schema
const planFormSchema = z.object({
  name: z.enum(["free", "starter", "business", "agency"], {
    required_error: "Please select a plan type",
  }),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  priceMonthly: z.number().min(0, "Monthly price must be 0 or greater"),
  priceYearly: z.number().optional(),
  maxOrganizations: z
    .number()
    .min(-1, "Max organizations must be -1 (unlimited) or greater"),
  features: z.optional(z.array(z.string())),
  isActive: z.boolean().default(true),
  sortOrder: z.number().optional(),
});

type PlanFormData = z.infer<typeof planFormSchema>;

// Available component sections that can be enabled/disabled
export type PlanFormComponent = "General" | "Pricing" | "Features" | "Settings";

interface PlanFormProps {
  planId?: Id<"plans">; // If provided, we're editing an existing plan
  open?: boolean; // For dialog mode
  onOpenChange?: (open: boolean) => void; // For dialog mode
  onSubmit?: (data: PlanFormData) => Promise<void>; // Custom submit handler
  onCancel?: () => void;
  onSuccess?: () => void; // Called after successful submission
  isSubmitting?: boolean;
  submitButtonText?: string;
  components?: PlanFormComponent[]; // Control which components are shown
  mode?: "dialog" | "inline"; // Display mode
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
  components = ["General", "Pricing", "Features", "Settings"], // Default to all components
  mode = "dialog",
}: PlanFormProps) {
  // Helper function to check if a component should be rendered
  const shouldShowComponent = (component: PlanFormComponent): boolean => {
    return components.includes(component);
  };

  // State
  const [isFormInitialized, setIsFormInitialized] = useState(false);
  const [newFeature, setNewFeature] = useState("");

  // Queries
  const plans = useQuery(api.core.organizations.queries.getPlans, {});
  const existingPlan = plans?.find((p: any) => p._id === planId);

  // Mutations
  const createPlan = useMutation(api.core.organizations.mutations.createPlan);
  const updatePlan = useMutation(api.core.organizations.mutations.updatePlan);

  // Form setup
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

  // Load plan data when editing
  useEffect(() => {
    if (existingPlan && planId && !isFormInitialized) {
      form.reset({
        name: existingPlan.name as "free" | "starter" | "business" | "agency",
        displayName: existingPlan.displayName,
        description: existingPlan.description,
        priceMonthly: existingPlan.priceMonthly / 100, // Convert cents to dollars
        priceYearly: existingPlan.priceYearly
          ? existingPlan.priceYearly / 100
          : undefined,
        maxOrganizations: existingPlan.maxOrganizations,
        features: existingPlan.features || [],
        isActive: existingPlan.isActive,
        sortOrder: existingPlan.sortOrder || 0,
      });
      setIsFormInitialized(true);
    }
  }, [existingPlan, planId, form, isFormInitialized]);

  // Reset form when dialog closes or planId changes
  useEffect(() => {
    if (!open && mode === "dialog") {
      form.reset();
      setIsFormInitialized(false);
    }
  }, [open, mode, form]);

  useEffect(() => {
    setIsFormInitialized(false);
  }, [planId]);

  // Handle adding features
  const handleAddFeature = () => {
    if (newFeature.trim()) {
      const currentFeatures = form.getValues("features");
      const updatedFeatures = [...currentFeatures, newFeature.trim()];
      form.setValue("features", updatedFeatures, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
      setNewFeature("");
    }
  };

  // Handle removing features
  const handleRemoveFeature = (index: number) => {
    const currentFeatures = form.getValues("features") || [];
    const updatedFeatures = currentFeatures.filter((_, i) => i !== index);
    form.setValue("features", updatedFeatures, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  // Handle form submission
  const handleSubmit = async (data: PlanFormData) => {
    try {
      if (onSubmit) {
        // Use custom submit handler
        await onSubmit(data);
      } else {
        // Use default submit logic
        const submitData = {
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          priceMonthly: Math.round(data.priceMonthly * 100), // Convert dollars to cents
          priceYearly: data.priceYearly
            ? Math.round(data.priceYearly * 100)
            : undefined,
          maxOrganizations: data.maxOrganizations,
          features: data.features,
          isActive: data.isActive,
          sortOrder: data.sortOrder || 0,
        };

        if (planId) {
          // Update existing plan
          await updatePlan({
            planId,
            ...submitData,
          });
          toast.success("Plan updated successfully");
        } else {
          // Create new plan
          await createPlan(submitData);
          toast.success("Plan created successfully");
        }
      }

      // Call success callback
      if (onSuccess) {
        onSuccess();
      }

      // Close dialog if in dialog mode
      if (mode === "dialog" && onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error submitting plan:", error);
      toast.error(planId ? "Failed to update plan" : "Failed to create plan");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (mode === "dialog" && onOpenChange) {
      onOpenChange(false);
    }
    form.reset();
    setNewFeature("");
  };

  // Form content
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* General Information */}
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

        {/* Pricing */}
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
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value) || 0)
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
                          value={field.value || ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
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
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 1)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Maximum number of organizations allowed (-1 for unlimited)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Features */}
        {shouldShowComponent("Features") && (
          <Card>
            <CardHeader>
              <CardTitle>Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="features"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Features</FormLabel>
                    <div className="space-y-3">
                      {/* Feature input */}
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add a feature..."
                          value={newFeature}
                          onChange={(e) => setNewFeature(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddFeature();
                            }
                          }}
                        />
                        <Button
                          type="button"
                          onClick={handleAddFeature}
                          size="sm"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Features list */}
                      <div className="space-y-2">
                        {(field.value || []).map((feature, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between rounded-md border p-2"
                          >
                            <span className="text-sm">{feature}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveFeature(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                        {(field.value || []).length === 0 && (
                          <p className="text-sm text-muted-foreground">
                            No features added yet
                          </p>
                        )}
                      </div>
                    </div>
                    <FormDescription>
                      List the key features included in this plan
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Settings */}
        {shouldShowComponent("Settings") && (
          <Card>
            <CardHeader>
              <CardTitle>Plan Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Plan</FormLabel>
                      <FormDescription>
                        Make this plan available for subscription
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
                        min="0"
                        placeholder="0"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Display order (lower numbers appear first)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Submit Buttons */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            <X className="mr-2 h-4 w-4" />
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Saving..." : submitButtonText}
          </Button>
        </div>
      </form>
    </Form>
  );

  // Return dialog or inline content
  if (mode === "dialog") {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{planId ? "Edit Plan" : "Create Plan"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">{formContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="space-y-6">{formContent}</div>;
}
