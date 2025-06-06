"use client";

import Link from "next/link";
import { ChevronLeft, Save } from "lucide-react";
import { useForm } from "react-hook-form";

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
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";

interface AdvancedSettingsFormValues {
  debugMode: boolean;
  cacheLifetime: string;
  maxUploadSize: string;
  sessionTimeout: string;
  apiRequestLimit: string;
  securityLevel: string;
  allowCors: boolean;
  corsOrigins: string;
  jsDebug: boolean;
  logLevel: string;
  enableWebhooks: boolean;
  webhookEndpoint: string;
}

export default function AdvancedSettingsPage() {
  const form = useForm<AdvancedSettingsFormValues>({
    defaultValues: {
      debugMode: false,
      cacheLifetime: "3600",
      maxUploadSize: "10",
      sessionTimeout: "120",
      apiRequestLimit: "100",
      securityLevel: "medium",
      allowCors: false,
      corsOrigins: "",
      jsDebug: false,
      logLevel: "error",
      enableWebhooks: false,
      webhookEndpoint: "",
    },
  });

  const onSubmit = (data: AdvancedSettingsFormValues) => {
    console.log("Submitting advanced settings:", data);
  };

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Advanced Settings</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Configure advanced system settings and optimizations
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>System Configuration</CardTitle>
          <CardDescription>
            These settings affect the core system behavior and performance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="debugMode"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Debug Mode</FormLabel>
                        <FormDescription>
                          Enable detailed error reporting and system logs
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jsDebug"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>JavaScript Debug</FormLabel>
                        <FormDescription>
                          Enable unminified JavaScript for debugging
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FormField
                  control={form.control}
                  name="cacheLifetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cache Lifetime (seconds)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="0" />
                      </FormControl>
                      <FormDescription>
                        How long items remain in cache
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxUploadSize"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Upload Size (MB)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" max="100" />
                      </FormControl>
                      <FormDescription>
                        Maximum file upload size
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="sessionTimeout"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session Timeout (minutes)</FormLabel>
                      <FormControl>
                        <Input {...field} type="number" min="1" />
                      </FormControl>
                      <FormDescription>
                        User session expiration time
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="logLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Log Level</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select log level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="error">Error Only</SelectItem>
                        <SelectItem value="warn">Warning & Error</SelectItem>
                        <SelectItem value="info">Info & Above</SelectItem>
                        <SelectItem value="debug">Debug (Verbose)</SelectItem>
                        <SelectItem value="trace">Trace (All Logs)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Controls the level of detail in system logs
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">API & Security Settings</h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="apiRequestLimit"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Request Limit (per minute)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" min="10" />
                        </FormControl>
                        <FormDescription>
                          Maximum API requests per client
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="securityLevel"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Security Level</FormLabel>
                        <Select
                          defaultValue={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select security level" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="low">Basic</SelectItem>
                            <SelectItem value="medium">Standard</SelectItem>
                            <SelectItem value="high">Enhanced</SelectItem>
                            <SelectItem value="maximum">Maximum</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormDescription>
                          Controls security measures strength
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="allowCors"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Allow CORS</FormLabel>
                        <FormDescription>
                          Enable Cross-Origin Resource Sharing
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("allowCors") && (
                  <FormField
                    control={form.control}
                    name="corsOrigins"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Allowed Origins</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="https://example.com,https://app.example.com"
                            rows={3}
                          />
                        </FormControl>
                        <FormDescription>
                          Comma-separated list of allowed origins
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-medium">Integrations</h3>

                <FormField
                  control={form.control}
                  name="enableWebhooks"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Enable Webhooks</FormLabel>
                        <FormDescription>
                          Allow system events to trigger external webhooks
                        </FormDescription>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("enableWebhooks") && (
                  <FormField
                    control={form.control}
                    name="webhookEndpoint"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Webhook Endpoint URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://your-service.com/webhook"
                          />
                        </FormControl>
                        <FormDescription>
                          URL where webhook events will be sent
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            className="ml-auto"
            type="submit"
          >
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
