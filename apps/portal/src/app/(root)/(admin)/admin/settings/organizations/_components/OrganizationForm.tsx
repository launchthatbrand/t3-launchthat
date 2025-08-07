"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Building2, Save, X } from "lucide-react";
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
const organizationFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  planId: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
});

type OrganizationFormData = z.infer<typeof organizationFormSchema>;

// Available component sections that can be enabled/disabled
export type OrganizationFormComponent = "General" | "Plan" | "Settings";

interface OrganizationFormProps {
  organizationId?: Id<"organizations">; // If provided, we're editing an existing organization
  open?: boolean; // For dialog mode
  onOpenChange?: (open: boolean) => void; // For dialog mode
  onSubmit?: (data: OrganizationFormData) => Promise<void>; // Custom submit handler
  onCancel?: () => void;
  onSuccess?: () => void; // Called after successful submission
  isSubmitting?: boolean;
  submitButtonText?: string;
  components?: OrganizationFormComponent[]; // Control which components are shown
  mode?: "dialog" | "inline"; // Display mode
}

export function OrganizationForm({
  organizationId,
  open = false,
  onOpenChange,
  onSubmit,
  onCancel,
  onSuccess,
  isSubmitting = false,
  submitButtonText = "Create Organization",
  components = ["General", "Plan", "Settings"], // Default to all components
  mode = "dialog",
}: OrganizationFormProps) {
  // Helper function to check if a component should be rendered
  const shouldShowComponent = (
    component: OrganizationFormComponent,
  ): boolean => {
    return components.includes(component);
  };

  // State
  const [isFormInitialized, setIsFormInitialized] = useState(false);

  // Queries
  const existingOrganization = useQuery(
    api.organizations.queries.getById,
    organizationId ? { organizationId } : "skip",
  );
  const plans = useQuery(api.organizations.queries.getPlans, {});
  const currentUser = useQuery(api.users.queries.getMe, {});

  // Mutations
  const createOrganization = useMutation(api.organizations.mutations.create);
  const updateOrganization = useMutation(api.organizations.mutations.update);

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin";

  // Form setup
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(organizationFormSchema),
    defaultValues: {
      name: "",
      description: "",
      planId: "",
      isPublic: false,
      allowSelfRegistration: false,
    },
  });

  // Load organization data when editing
  useEffect(() => {
    if (existingOrganization && organizationId && !isFormInitialized) {
      form.reset({
        name: existingOrganization.name,
        description: existingOrganization.description || "",
        planId: existingOrganization.planId || "",
        isPublic: existingOrganization.isPublic,
        allowSelfRegistration: existingOrganization.allowSelfRegistration,
      });
      setIsFormInitialized(true);
    }
  }, [existingOrganization, organizationId, form, isFormInitialized]);

  // Reset form when dialog closes or organizationId changes
  useEffect(() => {
    if (!open && mode === "dialog") {
      form.reset();
      setIsFormInitialized(false);
    }
  }, [open, mode, form]);

  useEffect(() => {
    setIsFormInitialized(false);
  }, [organizationId]);

  // Handle form submission
  const handleSubmit = async (data: OrganizationFormData) => {
    try {
      if (onSubmit) {
        // Use custom submit handler
        await onSubmit(data);
      } else {
        // Use default submit logic
        const submitData = {
          name: data.name,
          description: data.description ?? undefined,
          planId:
            data.planId && data.planId !== "__none__"
              ? (data.planId as Id<"plans">)
              : undefined,
          isPublic: data.isPublic,
          allowSelfRegistration: data.allowSelfRegistration,
        };

        if (organizationId) {
          // Update existing organization
          await updateOrganization({
            organizationId,
            ...submitData,
          });
          toast.success("Organization updated successfully");
        } else {
          // Create new organization
          await createOrganization(submitData);
          toast.success("Organization created successfully");
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
      console.error("Error submitting organization:", error);
      toast.error(
        organizationId
          ? "Failed to update organization"
          : "Failed to create organization",
      );
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
                <Building2 className="h-5 w-5" />
                General Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter organization name" {...field} />
                    </FormControl>
                    <FormDescription>
                      The display name for this organization
                    </FormDescription>
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
                        placeholder="Enter organization description"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Optional description of the organization
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Plan Selection */}
        {shouldShowComponent("Plan") && plans && (
          <Card>
            <CardHeader>
              <CardTitle>Subscription Plan</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="planId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Plan {!isAdmin && <span className="text-red-500">*</span>}
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isAdmin ? false : !plans || plans.length === 0}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={
                              isAdmin
                                ? "Select a plan (optional for admins)"
                                : "Select a plan"
                            }
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {isAdmin && (
                          <SelectItem value="__none__">
                            No Plan (Admin)
                          </SelectItem>
                        )}
                        {plans?.map((plan: any) => (
                          <SelectItem key={plan._id} value={plan._id}>
                            {plan.displayName} - $
                            {(plan.priceMonthly / 100).toFixed(2)}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      {isAdmin
                        ? "Admins can create organizations without a plan"
                        : "Choose the subscription plan for this organization"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Organization Settings */}
        {shouldShowComponent("Settings") && (
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="isPublic"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Public Organization
                      </FormLabel>
                      <FormDescription>
                        Make this organization visible to everyone
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
                name="allowSelfRegistration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Allow Self Registration
                      </FormLabel>
                      <FormDescription>
                        Allow users to join this organization without invitation
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
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {organizationId ? "Edit Organization" : "Create Organization"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">{formContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="space-y-6">{formContent}</div>;
}
