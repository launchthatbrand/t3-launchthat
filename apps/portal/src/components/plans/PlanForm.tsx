"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Plus, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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

const planFormSchema = z.object({
  name: z.enum(["free", "starter", "business", "agency"], {
    required_error: "Please select a plan type",
  }),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  maxOrganizations: z
    .number()
    .min(-1, "Must be -1 (unlimited) or greater than 0"),
  priceMonthly: z.number().min(0, "Price must be 0 or greater"),
  priceYearly: z.number().optional(),
  features: z.optional(z.array(z.string())),
  isActive: z.boolean().default(true),
  sortOrder: z.number().min(0, "Sort order must be 0 or greater").default(0),
});

type PlanFormData = z.infer<typeof planFormSchema>;

interface PlanFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planId?: Id<"plans">;
  onSuccess?: () => void;
}

export function PlanForm({
  open,
  onOpenChange,
  planId,
  onSuccess,
}: PlanFormProps) {
  const [newFeature, setNewFeature] = useState("");

  // Get plan data if editing
  const existingPlan = useQuery(api.core.organizations.queries.getPlans, {});

  const plan = existingPlan?.find((p) => p._id === planId);

  // Mutations
  const createPlan = useMutation(api.core.organizations.mutations.createPlan);
  const updatePlan = useMutation(api.core.organizations.mutations.updatePlan);

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "free",
      displayName: "",
      description: "",
      maxOrganizations: 1,
      priceMonthly: 0,
      priceYearly: undefined,
      features: [],
      isActive: true,
      sortOrder: 0,
    },
  });

  // Reset form when dialog opens/closes or plan changes
  useEffect(() => {
    if (open && plan) {
      // Editing mode
      form.reset({
        name: plan.name,
        displayName: plan.displayName,
        description: plan.description,
        maxOrganizations: plan.maxOrganizations,
        priceMonthly: plan.priceMonthly,
        priceYearly: plan.priceYearly,
        features: plan.features || [],
        isActive: plan.isActive,
        sortOrder: plan.sortOrder || 0,
      });
    } else if (open) {
      // Creating mode
      form.reset({
        name: "free",
        displayName: "",
        description: "",
        maxOrganizations: 1,
        priceMonthly: 0,
        priceYearly: undefined,
        features: [],
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [open, plan, form]);

  const handleSubmit = async (data: PlanFormData) => {
    try {
      if (planId) {
        // Update existing plan
        await updatePlan({
          planId,
          displayName: data.displayName,
          description: data.description,
          maxOrganizations: data.maxOrganizations,
          priceMonthly: data.priceMonthly,
          priceYearly: data.priceYearly,
          features: data.features,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        });
        toast.success("Plan updated successfully");
      } else {
        // Create new plan
        await createPlan({
          name: data.name,
          displayName: data.displayName,
          description: data.description,
          maxOrganizations: data.maxOrganizations,
          priceMonthly: data.priceMonthly,
          priceYearly: data.priceYearly,
          features: data.features,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        });
        toast.success("Plan created successfully");
      }

      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Failed to save plan:", error);
      toast.error("Failed to save plan");
    }
  };

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

  const handleRemoveFeature = (index: number) => {
    const currentFeatures = form.getValues("features");
    const updatedFeatures = currentFeatures.filter((_, i) => i !== index);
    form.setValue("features", updatedFeatures, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  };

  const formatPrice = (price: number) => {
    return (price / 100).toFixed(2);
  };

  const parsePrice = (price: string) => {
    return Math.round(parseFloat(price) * 100);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{planId ? "Edit Plan" : "Create New Plan"}</DialogTitle>
          <DialogDescription>
            {planId
              ? "Update the plan details and pricing information."
              : "Create a new subscription plan with pricing and features."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-6"
          >
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Plan Type</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={!!planId} // Don't allow changing plan type when editing
                    >
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
                      <Input {...field} placeholder="e.g., Professional Plan" />
                    </FormControl>
                    <FormDescription>The name shown to users</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe what this plan includes..."
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="maxOrganizations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Organizations</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        placeholder="-1 for unlimited"
                      />
                    </FormControl>
                    <FormDescription>-1 for unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                        value={formatPrice(field.value)}
                        onChange={(e) =>
                          field.onChange(parsePrice(e.target.value))
                        }
                        placeholder="0.00"
                      />
                    </FormControl>
                    <FormDescription>Price in USD</FormDescription>
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
                        value={field.value ? formatPrice(field.value) : ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parsePrice(e.target.value)
                              : undefined,
                          )
                        }
                        placeholder="Optional"
                      />
                    </FormControl>
                    <FormDescription>Optional yearly pricing</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="features"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Features</FormLabel>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={newFeature}
                        onChange={(e) => setNewFeature(e.target.value)}
                        placeholder="Add a feature..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFeature();
                          }
                        }}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleAddFeature}
                        disabled={!newFeature.trim()}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {field.value.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {field.value.map((feature, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="gap-1"
                          >
                            {feature}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-auto p-0.5 hover:bg-destructive hover:text-destructive-foreground"
                              onClick={() => handleRemoveFeature(index)}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    List the key features included in this plan
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sortOrder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Sort Order</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                        placeholder="0"
                      />
                    </FormControl>
                    <FormDescription>
                      Lower numbers appear first
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Plan</FormLabel>
                      <FormDescription>
                        Allow new signups for this plan
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
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {planId ? "Update Plan" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
