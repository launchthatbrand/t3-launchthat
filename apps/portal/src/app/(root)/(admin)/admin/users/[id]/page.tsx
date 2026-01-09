"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Loader2, Mail, Save, Trash } from "lucide-react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { applyFilters } from "@acme/admin-runtime/hooks";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@acme/ui/alert-dialog";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
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
import { Skeleton } from "@acme/ui/skeleton";

import { ADMIN_USER_DETAILS_SECTIONS_FILTER } from "~/lib/plugins/hookSlots";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

interface AdminUserDetailsSection {
  id: string;
  priority?: number;
  render: (ctx: { userId: string; organizationId?: string | null }) => React.ReactNode;
}

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
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function UserEditPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant ?? undefined);
  // Extract userId directly from params (no need for React.use() in Next.js 13+)
  const userId = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSendingLoginLink, setIsSendingLoginLink] = useState(false);

  const sectionsRaw = applyFilters(ADMIN_USER_DETAILS_SECTIONS_FILTER, [], {
    userId,
    organizationId,
  });
  const sections = Array.isArray(sectionsRaw)
    ? (sectionsRaw as AdminUserDetailsSection[])
    : ([] as AdminUserDetailsSection[]);
  const sortedSections = [...sections].sort(
    (a, b) => (a.priority ?? 10) - (b.priority ?? 10),
  );

  // Get user by ID
  const getUserByIdQuery = api.core.users.queries.getUserById as unknown;
  const user = useQuery(getUserByIdQuery as never, {
    userId: userId as Id<"users">,
  }) as
    | {
        _id: Id<"users">;
        name?: string;
        email: string;
        role?: string;
      }
    | null
    | undefined;

  // Update user mutation
  const updateUserMutation = api.core.users.mutations.updateUser as unknown;
  const updateUser = useMutation(updateUserMutation as never) as (args: {
    userId: Id<"users">;
    data: { name?: string; email?: string; role?: string };
  }) => Promise<unknown>;

  // Delete user mutation
  const deleteUserMutation = api.core.users.mutations.deleteUser as unknown;
  const deleteUser = useMutation(deleteUserMutation as never) as (args: {
    userId: Id<"users">;
  }) => Promise<{ success: boolean }>;

  // Setup form
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      name: "",
      email: "",
      role: "user",
    },
  });

  // Update form values when user data is loaded
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name ?? "",
        email: user.email,
        role: user.role ?? "user",
      });
    }
  }, [user, form]);

  // Handle form submission
  const onSubmit = async (values: UserFormValues) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await updateUser({
        userId: userId as Id<"users">,
        data: {
          name: values.name,
          email: values.email,
          role: values.role,
        },
      });

      if (result) {
        toast.success("User updated successfully");
      } else {
        setError("Failed to update user");
        toast.error("Failed to update user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle user deletion
  const handleDeleteUser = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteUser({
        userId: userId as Id<"users">,
      });

      if (result.success) {
        toast.success("User deleted successfully");
        router.push("/admin/users");
      } else {
        setError("Failed to delete user");
        toast.error("Failed to delete user");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSendLoginLink = async () => {
    if (!user?.email) return;
    setIsSendingLoginLink(true);
    try {
      const res = await fetch("/api/clerk/users/send-login-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name ?? "",
        }),
      });
      const json = (await res.json().catch(() => null)) as
        | { ok?: boolean; error?: string }
        | null;
      if (!res.ok) {
        throw new Error(
          json?.error ?? `Failed to send login link (${res.status})`,
        );
      }
      toast.success("Login link sent");
    } catch (err) {
      toast.error("Failed to send login link", {
        description: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsSendingLoginLink(false);
    }
  };

  // If user data is still loading
  if (user === undefined) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
          <CardFooter>
            <Skeleton className="h-10 w-24" />
          </CardFooter>
        </Card>
      </div>
    );
  }

  // If user not found
  if (user === null) {
    return (
      <div className="container mx-auto py-6">
        <Alert variant="destructive">
          <AlertTitle>User Not Found</AlertTitle>
          <AlertDescription>
            The user you are looking for could not be found. Please check the ID
            and try again.
          </AlertDescription>
        </Alert>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/users")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Edit User</h1>
          <p className="text-muted-foreground">
            Update user information and permissions
          </p>
        </div>
        <Button variant="outline" onClick={() => router.push("/admin/users")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Users
        </Button>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Login link</CardTitle>
          <CardDescription>
            Send the user a one-click sign-in link (expires after a short time).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-between gap-4">
          <div className="text-sm">
            <div className="font-medium">{user.email}</div>
            <div className="text-muted-foreground">
              This will email a sign-in link to the address above.
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            disabled={isSendingLoginLink}
            onClick={() => void handleSendLoginLink()}
          >
            {isSendingLoginLink ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Mail className="mr-2 h-4 w-4" />
            )}
            Resend login link
          </Button>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>
              View and edit basic user information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
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
                      <FormDescription>
                        The user's email address.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="manager">Manager</SelectItem>
                          <SelectItem value="admin">Administrator</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        The user's role determines their permissions.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        {sortedSections.map((section) => (
          <React.Fragment key={section.id}>
            {section.render({ userId })}
          </React.Fragment>
        ))}

        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Destructive actions that cannot be undone
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Deleting a user will permanently remove all of their data from the
              system. This action cannot be undone.
            </p>
          </CardContent>
          <CardFooter>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive">
                  <Trash className="mr-2 h-4 w-4" />
                  Delete User
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the user account and remove all associated data from our
                    servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDeleteUser}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      "Delete User"
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
