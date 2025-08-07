"use client";

import type { Id } from "@/convex/_generated/dataModel";
import React, { useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { Save, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

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

// Define the form schema
const userFormSchema = z.object({
  name: z.string().min(2, {
    message: "Name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Please enter a valid email address.",
  }),
  role: z.string().min(1, {
    message: "Please select a role.",
  }),
  username: z.string().optional(),
  isActive: z.boolean(),
});

type UserFormValues = z.infer<typeof userFormSchema>;

export interface UserFormProps {
  userId?: Id<"users">;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSubmit?: (data: UserFormValues) => void | Promise<void>;
  onCancel?: () => void;
  onSuccess?: () => void;
  isSubmitting?: boolean;
  submitButtonText?: string;
  components?: ("General" | "Role" | "Settings")[];
  mode?: "dialog" | "inline";
}

export function UserForm({
  userId,
  open = false,
  onOpenChange,
  onSubmit,
  onCancel,
  onSuccess,
  isSubmitting = false,
  submitButtonText = "Create User",
  components = ["General", "Role", "Settings"], // Default to all components
  mode = "dialog",
}: UserFormProps) {
  // Queries - always call hooks in the same order
  const existingUser = useQuery(
    api.users.getUserById,
    userId ? { userId } : "skip",
  );

  // Mutations
  const createUser = useMutation(api.users.createOrGetUser);
  const updateUser = useMutation(api.users.updateUser);

  // Form setup
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
      username: "",
      isActive: true,
    },
  });

  // Update form when existing user data loads
  useEffect(() => {
    if (existingUser) {
      form.reset({
        name: existingUser.name ?? "",
        email: existingUser.email ?? "",
        role: existingUser.role ?? "user",
        username: existingUser.username ?? "",
        isActive: existingUser.isActive ?? true,
      });
    }
  }, [existingUser, form]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open && mode === "dialog") {
      form.reset();
    }
  }, [open, form, mode]);

  // Helper to check if component should be shown
  const shouldShowComponent = (component: string) => {
    return components.includes(component as any);
  };

  // Handle form submission
  const handleSubmit = async (data: UserFormValues) => {
    try {
      if (onSubmit) {
        // Custom submit handler
        await onSubmit(data);
      } else {
        // Default submit logic
        const submitData = {
          name: data.name,
          email: data.email,
          role: data.role,
          username: data.username || undefined,
          isActive: data.isActive,
        };

        if (userId) {
          // Update existing user
          const result: any = await updateUser({
            userId,
            data: submitData,
          });
          toast.success("User updated successfully");
        } else {
          // Create new user
          const result: any = await createUser({
            name: data.name,
            email: data.email,
            role: data.role as any,
            isActive: data.isActive,
          });
          toast.success("User created successfully");
        }
      }

      if (onSuccess) {
        onSuccess();
      }

      if (mode === "dialog" && onOpenChange) {
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to save user:", error);
      toast.error("Failed to save user");
    }
  };

  // Handle cancel
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    } else if (mode === "dialog" && onOpenChange) {
      onOpenChange(false);
    }
  };

  // Form content
  const formContent = (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        {/* General Information */}
        {shouldShowComponent("General") && (
          <Card>
            <CardHeader>
              <CardTitle>General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormDescription>The user's full name.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="john.doe@example.com"
                        type="email"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>The user's email address.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Username (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="johndoe" {...field} />
                    </FormControl>
                    <FormDescription>
                      Optional username for the user.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* Role Selection */}
        {shouldShowComponent("Role") && (
          <Card>
            <CardHeader>
              <CardTitle>Role & Permissions</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="customer">Customer</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The user's role determines their permissions.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>
        )}

        {/* User Settings */}
        {shouldShowComponent("Settings") && (
          <Card>
            <CardHeader>
              <CardTitle>User Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Active Status</FormLabel>
                      <FormDescription>
                        Whether the user account is active and can access the
                        system.
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
            <DialogTitle>{userId ? "Edit User" : "Create User"}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">{formContent}</div>
        </DialogContent>
      </Dialog>
    );
  }

  return <div className="space-y-6">{formContent}</div>;
}
