"use client";

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
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from "@acme/ui";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { useAction, useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import type { Id } from "@/convex/_generated/dataModel";
// Import Convex functions
import { api } from "@/convex/_generated/api";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Base fields common to all connections
const baseSchema = {
  name: z.string().min(2, {
    message: "Connection name must be at least 2 characters.",
  }),
};

const wpFields = {
  siteUrl: z.string().url({
    message: "Please enter a valid URL including http:// or https://",
  }),
  apiUsername: z.string().min(1, {
    message: "API username is required.",
  }),
  apiKey: z.string().min(1, {
    message: "API key is required.",
  }),
};

const vimeoFields = {
  syncMode: z.enum(["all", "folder"]).default("all"),
  folderIds: z.string().optional(), // comma separated
};

// Unified schema: all possible fields optional except required name
const unifiedSchema = z.object({
  ...baseSchema,
  siteUrl: z.string().url().optional(),
  apiUsername: z.string().optional(),
  apiKey: z.string().optional(),
  playlistIds: z.string().optional(),
  categories: z.string().optional(),
  syncMode: z.enum(["all", "folder"]).optional(),
  folderIds: z.string().optional(),
});

type FormValues = z.infer<typeof unifiedSchema>;

export default function ConnectionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);

  // Get connection details
  const connection = useQuery(api.integrations.connections.queries.get, {
    id: id as Id<"connections">,
  });

  // Get app list to resolve app name
  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];

  const currentApp = apps.find((a) => a._id === connection?.appId);

  // Mutations
  const updateConnection = useAction(
    api.integrations.connections.actions.update,
  );
  const testConnection = useMutation(
    api.integrations.connections.mutations.test,
  );
  const removeConnection = useMutation(
    api.integrations.connections.mutations.remove,
  );

  // Form setup
  const form = useForm<FormValues>({
    resolver: zodResolver(unifiedSchema),
    defaultValues: {
      name: "",
      siteUrl: "",
      apiUsername: "",
      apiKey: "",
      playlistIds: "",
      categories: "",
      syncMode: "all",
      folderIds: "",
    } as unknown as FormValues,
  });

  // Initialize form when connection data is loaded
  useEffect(() => {
    if (connection && !isLoading) {
      try {
        // Parse credentials JSON
        const credentials = JSON.parse(connection!.credentials);

        if (currentApp?.name.toLowerCase() === "vimeo") {
          form.reset({
            name: connection.name,
            playlistIds: credentials.playlistIds || "",
            categories: credentials.categories || "",
            syncMode: credentials.syncMode || "all",
            folderIds: credentials.folderIds || "",
          } as Partial<FormValues>);
        } else {
          form.reset({
            name: connection.name,
            siteUrl: credentials.siteUrl || "",
            apiUsername: credentials.apiUsername || "",
            apiKey: credentials.apiKey || "",
          } as Partial<FormValues>);
        }

        setDebugInfo(`Loaded connection details for: ${connection.name}`);
      } catch (error) {
        console.error("Error parsing credentials:", error);
        setDebugInfo(
          `Error parsing credentials: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    setIsLoading(false);
  }, [connection, form]);

  // Handle test connection
  const handleTestConnection = async (values: FormValues) => {
    setIsTesting(true);
    setTestSuccess(null);
    setTestError(null);
    setDebugInfo(`Testing connection...`);

    try {
      // For Vimeo we keep existing credentials (access token). Filters are handled in scenarios.
      const credentials =
        currentApp?.name.toLowerCase() === "vimeo"
          ? connection!.credentials
          : JSON.stringify({
              siteUrl: (values as any).siteUrl,
              apiUsername: (values as any).apiUsername,
              apiKey: (values as any).apiKey,
            });

      // Test the connection
      const result = await testConnection({
        id: id as Id<"connections">,
        credentials,
      });

      if (result.success) {
        setTestSuccess(true);
        setDebugInfo((prev) => `${prev ?? ""}\nConnection test successful`);
      } else {
        setTestError(result.message);
        setDebugInfo(
          (prev) => `${prev ?? ""}\nConnection test failed: ${result.message}`,
        );
      }
    } catch (error) {
      console.error("Connection test error:", error);
      setTestError(
        error instanceof Error
          ? error.message
          : "Connection failed. Please check your credentials and try again.",
      );
      setDebugInfo(
        (prev) =>
          `${prev ?? ""}\nTest error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsTesting(false);
    }
  };

  // Handle update connection
  const handleUpdateConnection = async (values: FormValues) => {
    setIsUpdating(true);
    setDebugInfo((prev) => `${prev ?? ""}\nUpdating connection...`);

    try {
      // For Vimeo we keep existing credentials (access token). Filters are handled in scenarios.
      const credentials =
        currentApp?.name.toLowerCase() === "vimeo"
          ? connection!.credentials
          : JSON.stringify({
              siteUrl: (values as any).siteUrl,
              apiUsername: (values as any).apiUsername,
              apiKey: (values as any).apiKey,
            });

      // Update the connection
      await updateConnection({
        id: id as Id<"connections">,
        name: values.name,
        credentials,
        status: "active", // Reset status to active after update
      });

      setDebugInfo((prev) => `${prev ?? ""}\nConnection updated successfully`);

      // Show success message
      setTestSuccess(true);
    } catch (error) {
      console.error("Update connection error:", error);
      setTestError(
        error instanceof Error
          ? error.message
          : "Failed to update connection. Please try again.",
      );
      setDebugInfo(
        (prev) =>
          `${prev ?? ""}\nUpdate error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle delete connection
  const handleDeleteConnection = async () => {
    try {
      await removeConnection({ id: id as Id<"connections"> });
      setDebugInfo("Connection deleted");

      // Redirect to integrations page
      router.push("/integrations?tab=connections");
    } catch (error) {
      console.error("Delete connection error:", error);
      setTestError(
        error instanceof Error
          ? error.message
          : "Failed to delete connection. Please try again.",
      );
      setDebugInfo(
        (prev) =>
          `${prev ?? ""}\nDelete error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto flex items-center justify-center py-20">
        <Loader2 className="mr-2 h-6 w-6 animate-spin" />
        <span>Loading connection details...</span>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="container mx-auto py-10 text-center">
        <h2 className="text-2xl font-bold">Connection not found</h2>
        <p className="text-muted-foreground mt-2">
          The connection you are looking for doesn't exist or you don't have
          permission to view it.
        </p>
        <Button
          className="mt-4"
          onClick={() => router.push("/integrations?tab=connections")}
        >
          Back to Connections
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/integrations?tab=connections")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Connections
        </Button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">{connection.name}</h1>
            <p className="text-muted-foreground">
              {currentApp?.name || "WordPress"} Connection
            </p>
          </div>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Connection
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  connection and remove it from our servers.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConnection}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Connection Details</CardTitle>
          <CardDescription>
            Update your WordPress site connection details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleTestConnection)}
              className="space-y-6"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Connection Name</FormLabel>
                    <FormControl>
                      <Input placeholder="My WordPress Site" {...field} />
                    </FormControl>
                    <FormDescription>
                      A friendly name to identify this connection
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {currentApp?.name.toLowerCase() !== "vimeo" && (
                <FormField
                  control={form.control}
                  name="siteUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>WordPress Site URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://example.com"
                          type="url"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Full site URL including protocol (http/https)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {currentApp?.name.toLowerCase() !== "vimeo" && (
                  <FormField
                    control={form.control}
                    name="apiUsername"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Username</FormLabel>
                        <FormControl>
                          <Input placeholder="Username" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {currentApp?.name.toLowerCase() !== "vimeo" && (
                  <FormField
                    control={form.control}
                    name="apiKey"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="ck_xxxxxxxxxxxxxxxxxxxxxxxx"
                            type="password"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Vimeo connection now has no additional credential fields */}
              </div>

              {testSuccess && (
                <div className="flex items-center rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                  <Check className="mr-2 h-5 w-5" />
                  Connection successful!
                </div>
              )}

              {testError && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {testError}
                </div>
              )}

              {debugInfo && (
                <div className="rounded border border-blue-200 bg-blue-50 px-4 py-3 whitespace-pre-line text-blue-700">
                  <p className="font-bold">Debug Info:</p>
                  {debugInfo}
                </div>
              )}

              <div className="mt-4 flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/integrations?tab=connections")}
                >
                  Cancel
                </Button>

                <div className="space-x-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isTesting || isUpdating}
                  >
                    {isTesting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Testing...
                      </>
                    ) : (
                      "Test Connection"
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={form.handleSubmit(handleUpdateConnection)}
                    disabled={isTesting || isUpdating}
                  >
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Updating...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="bg-muted/50 border-t px-6 py-4">
          <div className="flex w-full justify-between text-sm">
            <div>
              <p className="font-medium">Connection Status</p>
              <div className="mt-1 flex items-center">
                <div
                  className={`mr-2 h-2 w-2 rounded-full ${
                    connection.status === "active"
                      ? "bg-green-500"
                      : connection.status === "error"
                        ? "bg-red-500"
                        : "bg-yellow-500"
                  }`}
                />
                <span className="capitalize">{connection.status}</span>
              </div>
            </div>
            <div>
              <p className="font-medium">Last Checked</p>
              <p className="text-muted-foreground mt-1">
                {connection.lastCheckedAt
                  ? new Date(connection.lastCheckedAt).toLocaleString()
                  : "Never"}
              </p>
            </div>
            <div>
              <p className="font-medium">Created</p>
              <p className="text-muted-foreground mt-1">
                {new Date(connection.createdAt).toLocaleString()}
              </p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
