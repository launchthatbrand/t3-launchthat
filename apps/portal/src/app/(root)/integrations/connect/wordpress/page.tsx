"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
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

// Use absolute paths for Convex imports
import { api } from "../../../../../../convex/_generated/api";
import { Doc, Id } from "../../../../../../convex/_generated/dataModel";

// Connection form validation schema
const formSchema = z.object({
  name: z.string().min(2, {
    message: "Connection name must be at least 2 characters.",
  }),
  siteUrl: z.string().url({
    message: "Please enter a valid URL including http:// or https://",
  }),
  apiUsername: z.string().min(1, {
    message: "API username is required.",
  }),
  apiKey: z.string().min(1, {
    message: "API key is required.",
  }),
});

type FormValues = z.infer<typeof formSchema>;

// Default WordPress app config
const DEFAULT_WP_APP = {
  name: "WordPress",
  description: "Connect to WordPress sites to import posts, users, and more.",
  authType: "apiKey",
  configTemplate: JSON.stringify({
    siteUrl: { type: "string", label: "Site URL", required: true },
    apiUsername: { type: "string", label: "API Username", required: true },
    apiKey: { type: "string", label: "API Key", required: true, secret: true },
  }),
  isEnabled: true,
};

export default function WordPressConnectionPage() {
  const router = useRouter();
  const [isConnecting, setIsConnecting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string | null>(null);
  const [isCreatingApp, setIsCreatingApp] = useState(false);

  // Get WordPress app ID from the available apps
  const apps =
    useQuery(api.integrations.apps.queries.list, { showDisabled: false }) ?? [];

  // Create app mutation
  const createApp = useMutation(api.integrations.apps.mutations.create);

  // Find WordPress app from the list
  const wordpressApp = apps.find(
    (app: Doc<"apps">) => app.name.toLowerCase() === "wordpress",
  );

  // Log information about the WordPress app for debugging
  useEffect(() => {
    if (apps.length > 0) {
      if (wordpressApp) {
        console.log("Found WordPress app:", wordpressApp);
        setDebugInfo(`Found WordPress app: ${wordpressApp._id}`);
      } else {
        console.log(
          "WordPress app not found in available apps, will create one when needed.",
        );
        setDebugInfo(
          "WordPress app not found in available apps, will create one when needed.",
        );
      }
    }
  }, [apps, wordpressApp]);

  // Get current user ID (you would typically get this from your auth provider)
  // This is a placeholder - replace with your actual user ID logic
  const currentUserId = "system"; // In production, get from auth context

  // Create connection mutation
  const createConnection = useMutation(
    api.integrations.connections.mutations.create,
  );

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      siteUrl: "",
      apiUsername: "",
      apiKey: "",
    },
  });

  const handleTestConnection = async (values: FormValues) => {
    setIsConnecting(true);
    setTestSuccess(null);
    setTestError(null);
    setDebugInfo(`Testing connection...`);

    try {
      // Simulate API connection test with a delay
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setTestSuccess(true);
      setDebugInfo((prev) => `${prev ?? ""}\nConnection test successful`);
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
      setIsConnecting(false);
    }
  };

  const createWordPressApp = async () => {
    setIsCreatingApp(true);
    setDebugInfo((prev) => `${prev ?? ""}\nCreating WordPress app...`);

    try {
      const appId = await createApp({
        ...DEFAULT_WP_APP,
      });

      setDebugInfo(
        (prev) =>
          `${prev ?? ""}\nSuccessfully created WordPress app with ID: ${appId}`,
      );
      return appId;
    } catch (error) {
      console.error("Error creating WordPress app:", error);
      setDebugInfo(
        (prev) =>
          `${prev ?? ""}\nError creating WordPress app: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw error;
    } finally {
      setIsCreatingApp(false);
    }
  };

  const handleSaveConnection = async (values: FormValues) => {
    setIsConnecting(true);
    setDebugInfo((prev) => `${prev ?? ""}\nSaving connection...`);

    try {
      // Get or create WordPress app
      let appId;

      if (wordpressApp) {
        appId = wordpressApp._id;
        setDebugInfo(
          (prev) => `${prev ?? ""}\nUsing existing WordPress app ID: ${appId}`,
        );
      } else {
        setDebugInfo(
          (prev) => `${prev ?? ""}\nNo WordPress app found, creating one...`,
        );
        appId = await createWordPressApp();
      }

      if (!appId) {
        throw new Error("Failed to get or create WordPress app");
      }

      // Prepare credentials as JSON string
      const credentials = JSON.stringify({
        siteUrl: values.siteUrl,
        apiUsername: values.apiUsername,
        apiKey: values.apiKey,
      });

      // Create the connection in Convex
      setDebugInfo(
        (prev) => `${prev ?? ""}\nCreating connection with appId: ${appId}`,
      );
      const connectionId = await createConnection({
        appId,
        name: values.name,
        credentials,
        ownerId: currentUserId,
      });

      setDebugInfo(
        (prev) => `${prev ?? ""}\nConnection created with ID: ${connectionId}`,
      );

      // Redirect to integrations page
      router.push("/integrations?tab=connections");
    } catch (error) {
      console.error("Save connection error:", error);
      setTestError(
        error instanceof Error
          ? error.message
          : "Failed to save connection. Please try again.",
      );
      setDebugInfo(
        (prev) =>
          `${prev ?? ""}\nSave error: ${error instanceof Error ? error.message : String(error)}`,
      );
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => router.push("/integrations")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Integrations
        </Button>

        <h1 className="text-3xl font-bold">Connect WordPress</h1>
        <p className="text-muted-foreground">
          Connect to your WordPress site via the REST API
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>WordPress Connection</CardTitle>
          <CardDescription>
            Enter your WordPress site details and API credentials
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
                      The URL of your WordPress site
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
              </div>

              {testSuccess && (
                <div className="flex items-center rounded border border-green-200 bg-green-50 px-4 py-3 text-green-700">
                  <Check className="mr-2 h-5 w-5" />
                  Connection successful! You can now save the connection.
                </div>
              )}

              {testError && (
                <div className="rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
                  {testError}
                </div>
              )}

              {debugInfo && (
                <div className="whitespace-pre-line rounded border border-blue-200 bg-blue-50 px-4 py-3 text-blue-700">
                  <p className="font-bold">Debug Info:</p>
                  {debugInfo}
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/integrations")}
                >
                  Cancel
                </Button>

                <div className="space-x-2">
                  <Button
                    type="submit"
                    variant="outline"
                    disabled={isConnecting}
                  >
                    {isConnecting && testSuccess === null ? (
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
                    onClick={form.handleSubmit(handleSaveConnection)}
                    disabled={
                      isConnecting || testSuccess !== true || isCreatingApp
                    }
                  >
                    {isConnecting && testSuccess !== null ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Connection"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
