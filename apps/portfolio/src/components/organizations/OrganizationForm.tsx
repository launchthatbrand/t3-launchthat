"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
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

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  planId: z.string().optional(), // Made optional - will be conditionally required in the form
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
});

type OrganizationFormData = z.infer<typeof formSchema>;

interface OrganizationFormProps {
  /** Whether the dialog is open */
  open: boolean;
  /** Function to handle dialog open/close state */
  onOpenChange: (open: boolean) => void;
  /** Organization ID for editing (undefined for creating) */
  organizationId?: Id<"organizations">;
  /** Callback when organization is created/updated */
  onSuccess?: () => void;
}

export function OrganizationForm({
  open,
  onOpenChange,
  organizationId,
  onSuccess,
}: OrganizationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const plans = useQuery(api.organizations.queries.getPlans, {});
  const currentUser = useQuery(api.users.queries.getMe, {});

  // Fetch organization data when editing
  const organizationData = useQuery(
    api.organizations.queries.getById,
    organizationId ? { organizationId } : "skip",
  );

  // Check if current user is admin
  const isAdmin = currentUser?.role === "admin";

  // Mutations
  const createOrganization = useMutation(api.organizations.mutations.create);
  const updateOrganization = useMutation(api.organizations.mutations.update);

  // Form setup
  const form = useForm<OrganizationFormData>({
    resolver: zodResolver(formSchema),
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
    if (organizationData && organizationId) {
      form.reset({
        name: organizationData.name,
        description: organizationData.description || "",
        planId: organizationData.planId,
        isPublic: organizationData.isPublic,
        allowSelfRegistration: organizationData.allowSelfRegistration,
      });
    }
  }, [organizationData, organizationId, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);

  const onSubmit = async (data: OrganizationFormData) => {
    try {
      setIsSubmitting(true);

      // For non-admin users, ensure plan is selected
      if (!isAdmin && !data.planId) {
        toast.error("Plan selection is required");
        return;
      }

      if (organizationId) {
        // Update existing organization
        await updateOrganization({
          organizationId,
          name: data.name,
          description: data.description,
          planId: data.planId as Id<"plans"> | undefined,
          isPublic: data.isPublic,
          allowSelfRegistration: data.allowSelfRegistration,
        });
        toast.success("Organization updated successfully");
      } else {
        // Create new organization
        await createOrganization({
          name: data.name,
          description: data.description,
          planId: data.planId as Id<"plans"> | undefined,
          isPublic: data.isPublic,
          allowSelfRegistration: data.allowSelfRegistration,
        });
        toast.success("Organization created successfully");
      }

      onSuccess?.();
      onOpenChange?.(false);
    } catch (error) {
      console.error("Error saving organization:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save organization",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isEditing = !!organizationId;
  const title = isEditing ? "Edit Organization" : "Create Organization";
  const description = isEditing
    ? "Update organization details and settings"
    : "Create a new organization with specified plan and settings";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Organization Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter organization name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief description of the organization"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Optional description for internal reference
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan Selection */}
            <FormField
              control={form.control}
              name="planId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isAdmin ? "Plan (Optional)" : "Plan *"}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={!plans?.length}
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
                      {plans?.map((plan: any) => (
                        <SelectItem key={plan._id} value={plan._id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {plan.displayName}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              ${(plan.priceMonthly / 100).toFixed(0)}/mo
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {plan.maxOrganizations === -1
                                ? "Unlimited orgs"
                                : `${plan.maxOrganizations} org${plan.maxOrganizations !== 1 ? "s" : ""}`}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    {isAdmin
                      ? "As an admin, you can create organizations without a plan or assign them to any plan."
                      : "Choose a subscription plan that determines organization limits and features."}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Public Visibility */}
            <FormField
              control={form.control}
              name="isPublic"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Public Organization
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Allow the organization to be discoverable by others
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

            {/* Self Registration */}
            <FormField
              control={form.control}
              name="allowSelfRegistration"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Self Registration
                    </FormLabel>
                    <FormDescription className="text-sm">
                      Allow users to request access to join this organization
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {isEditing ? "Update" : "Create"} Organization
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
