"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useEffect, useState } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAction, useMutation, useQuery } from "convex/react";
import { Building2, Copy, Globe, Save, X } from "lucide-react";
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
import { rootDomain } from "~/lib/utils";

// Form validation schema
const organizationFormSchema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  planId: z.string().optional(),
  isPublic: z.boolean().default(false),
  allowSelfRegistration: z.boolean().default(false),
  customDomain: z.string().optional(),
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
  const [isStartingDomain, setIsStartingDomain] = useState(false);
  const [isVerifyingDomain, setIsVerifyingDomain] = useState(false);
  const [domainMessage, setDomainMessage] = useState<string | null>(null);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainStatusOverride, setDomainStatusOverride] = useState<
    "unconfigured" | "pending" | "verified" | "error" | null
  >(null);
  const [domainRecordsOverride, setDomainRecordsOverride] = useState<
    { type: string; name: string; value: string }[] | null
  >(null);

  // Queries
  const existingOrganization = useQuery(
    api.core.organizations.queries.getById,
    organizationId ? { organizationId } : "skip",
  );
  const plans = useQuery(api.core.organizations.queries.getPlans, {});
  const currentUser = useQuery(api.core.users.queries.getMe, {});

  // Mutations
  const createOrganization = useMutation(
    api.core.organizations.mutations.create,
  );
  const updateOrganization = useMutation(
    api.core.organizations.mutations.update,
  );

  const startCustomDomainSetup = useAction(
    api.core.organizations.domains.startCustomDomainSetup,
  );
  const verifyCustomDomain = useAction(
    api.core.organizations.domains.verifyCustomDomain,
  );

  const handleCopy = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.success("Copied");
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleStartDomainSetup = async () => {
    if (!organizationId) {
      toast.error("Save the organization first.");
      return;
    }
    const domain = (form.getValues("customDomain") ?? "").trim();
    if (!domain) {
      toast.error("Enter a domain first.");
      return;
    }
    try {
      setIsStartingDomain(true);
      setDomainError(null);
      setDomainMessage(null);
      const result = (await startCustomDomainSetup({
        organizationId,
        domain,
      })) as {
        customDomain: string;
        status: "unconfigured" | "pending" | "verified" | "error";
        records: { type: string; name: string; value: string }[];
      };
      form.setValue("customDomain", result.customDomain, { shouldDirty: true });
      setDomainStatusOverride(result.status);
      setDomainRecordsOverride(result.records);
      setDomainMessage(
        result.status === "verified"
          ? "Domain verified."
          : "Domain added. Update DNS records, then click Verify.",
      );
      toast.success("Domain setup started");
    } catch (error) {
      console.error(error);
      setDomainError(
        error instanceof Error ? error.message : "Failed to start domain setup",
      );
    } finally {
      setIsStartingDomain(false);
    }
  };

  const handleVerifyDomain = async () => {
    if (!organizationId) return;
    try {
      setIsVerifyingDomain(true);
      setDomainError(null);
      setDomainMessage(null);
      const result = (await verifyCustomDomain({
        organizationId,
      })) as {
        customDomain: string;
        status: "unconfigured" | "pending" | "verified" | "error";
        records: { type: string; name: string; value: string }[];
      };
      form.setValue("customDomain", result.customDomain, { shouldDirty: true });
      setDomainStatusOverride(result.status);
      setDomainRecordsOverride(result.records);
      setDomainMessage(
        result.status === "verified"
          ? "Domain verified."
          : "Not verified yet. DNS may still be propagating.",
      );
      toast.success("Verification check complete");
    } catch (error) {
      console.error(error);
      setDomainError(
        error instanceof Error ? error.message : "Verification failed",
      );
    } finally {
      setIsVerifyingDomain(false);
    }
  };

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
      customDomain: "",
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
        customDomain:
          (existingOrganization.customDomain as unknown as string | undefined) ??
          "",
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

              <div className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="flex items-center gap-2 text-base font-medium">
                      <Globe className="h-4 w-4" />
                      Custom domain
                    </p>
                    <p className="text-muted-foreground text-sm">
                      Connect a domain to this organization. After verification,
                      both the custom domain and the launchthat subdomain will
                      work.
                    </p>
                  </div>
                  <div className="text-muted-foreground text-xs">
                    Status:{" "}
                    <span className="font-mono">
                      {domainStatusOverride ??
                        ((existingOrganization as any)?.customDomainStatus ??
                          "unconfigured")}
                    </span>
                  </div>
                </div>

                {!organizationId ? (
                  <p className="text-muted-foreground mt-3 text-sm">
                    Save the organization first to configure a domain.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    <FormField
                      control={form.control}
                      name="customDomain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Domain</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="dev.wsatraining.com"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Use the domain without protocol. Apex domains are
                            supported if your DNS provider supports ALIAS/ANAME.
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        onClick={() => void handleStartDomainSetup()}
                        disabled={isStartingDomain || isVerifyingDomain}
                      >
                        {isStartingDomain ? "Starting…" : "Start setup"}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleVerifyDomain()}
                        disabled={isStartingDomain || isVerifyingDomain}
                      >
                        {isVerifyingDomain ? "Verifying…" : "Verify"}
                      </Button>
                    </div>

                    {domainMessage ? (
                      <p className="text-sm text-emerald-600">{domainMessage}</p>
                    ) : null}
                    {domainError ? (
                      <p className="text-destructive text-sm">{domainError}</p>
                    ) : null}

                    <div className="mt-2 space-y-2">
                      <p className="text-sm font-medium">DNS records</p>
                      {(
                        domainRecordsOverride ??
                        ((existingOrganization as any)?.customDomainRecords as
                          | { type: string; name: string; value: string }[]
                          | undefined) ??
                        []
                      ).length === 0 ? (
                        <p className="text-muted-foreground text-sm">
                          Start setup to generate DNS records.
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {(domainRecordsOverride ??
                            ((existingOrganization as any)
                              ?.customDomainRecords as
                              | { type: string; name: string; value: string }[]
                              | undefined) ??
                            []).map((rec) => {
                            const line = `${rec.type} ${rec.name} ${rec.value}`;
                            return (
                              <div
                                key={line}
                                className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2"
                              >
                                <div className="min-w-0">
                                  <p className="text-xs font-mono">{line}</p>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  aria-label="Copy DNS record"
                                  onClick={() => void handleCopy(line)}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-sm font-medium">Access URLs</p>
                      {existingOrganization?.slug ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
                          <p className="text-xs font-mono">
                            https://{existingOrganization.slug}.{rootDomain}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Copy launchthat URL"
                            onClick={() =>
                              void handleCopy(
                                `https://${existingOrganization.slug}.${rootDomain}`,
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                      {form.getValues("customDomain")?.trim() ? (
                        <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-card px-3 py-2">
                          <p className="text-xs font-mono">
                            https://{form.getValues("customDomain")?.trim()}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Copy custom domain URL"
                            onClick={() =>
                              void handleCopy(
                                `https://${form.getValues("customDomain")?.trim()}`,
                              )
                            }
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </div>
                  </div>
                )}
              </div>
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
