"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { ChevronLeft, Save } from "lucide-react";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@acme/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { Button } from "@acme/ui/button";
import { Input } from "@acme/ui/input";
import Link from "next/link";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { useForm } from "react-hook-form";
import { useState } from "react";
import type { Id } from "@/convex/_generated/dataModel";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { OrganizationDomainsCard } from "../organizations/_components/OrganizationDomainsCard";

type FormData = {
  siteName: string;
  siteUrl: string;
  adminEmail: string;
  logoUrl: string;
  faviconUrl: string;
  footerText: string;
  dateFormat: string;
  timeFormat: string;
  timezone: string;
  defaultLanguage: string;
  maintenanceMode: boolean;
  maintenanceMessage: string;
  enableRegistration: boolean;
  defaultUserRole: string;
  googleAnalyticsId: string;
  enableCaching: boolean;
  cacheTtl: string;
};

export default function SiteSettingsPage() {
  const [activeTab, setActiveTab] = useState("general");
  const tenant = useTenant();
  const organizationId = getTenantOrganizationId(tenant) ?? null;

  return (
    <div className="container py-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold">Site Configuration</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Manage global site settings, branding, and appearance
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="branding">Branding</TabsTrigger>
          <TabsTrigger value="localization">Localization</TabsTrigger>
          <TabsTrigger value="domains">Domains</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="branding">
          <BrandingSettings />
        </TabsContent>

        <TabsContent value="localization">
          <LocalizationSettings />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedSettings />
        </TabsContent>

        <TabsContent value="domains">
          {organizationId ? (
            <OrganizationDomainsCard
              organizationId={organizationId as Id<"organizations">}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Domains</CardTitle>
                <CardDescription>
                  Domains are scoped to the current organization.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm">
                  No organization is currently selected.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralSettings() {
  const form = useForm<FormData>({
    defaultValues: {
      siteName: "LaunchThat Portal",
      siteUrl: "https://portal.launchthat.dev",
      adminEmail: "admin@launchthat.dev",
      enableRegistration: true,
      defaultUserRole: "member",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Submitting general settings:", data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>Basic configuration for your site</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="siteName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Site Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      The name displayed throughout your site
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
                    <FormLabel>Site URL</FormLabel>
                    <FormControl>
                      <Input {...field} type="url" />
                    </FormControl>
                    <FormDescription>
                      The primary URL of your site
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="adminEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Admin Email</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" />
                  </FormControl>
                  <FormDescription>
                    Main administrative contact email
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="enableRegistration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>User Registration</FormLabel>
                      <FormDescription>
                        Allow users to register accounts on your site
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultUserRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default User Role</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="member">Member</SelectItem>
                        <SelectItem value="subscriber">Subscriber</SelectItem>
                        <SelectItem value="contributor">Contributor</SelectItem>
                        <SelectItem value="editor">Editor</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Role assigned to new user registrations
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
  );
}

function BrandingSettings() {
  const form = useForm<FormData>({
    defaultValues: {
      logoUrl: "/logo.png",
      faviconUrl: "/favicon.ico",
      footerText: "© 2023 LaunchThat. All rights reserved.",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Submitting branding settings:", data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Branding Settings</CardTitle>
        <CardDescription>Customize your site's visual identity</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="logoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Logo URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to your site logo (recommended size: 200x50px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faviconUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Favicon URL</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      URL to your site favicon (recommended size: 32x32px)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="footerText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Footer Text</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormDescription>
                    Text displayed in the site footer (supports HTML)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
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
  );
}

function LocalizationSettings() {
  const form = useForm<FormData>({
    defaultValues: {
      dateFormat: "MM/DD/YYYY",
      timeFormat: "12h",
      timezone: "America/New_York",
      defaultLanguage: "en-US",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Submitting localization settings:", data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Localization Settings</CardTitle>
        <CardDescription>
          Configure date, time, and language preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="dateFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date Format</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                        <SelectItem value="MMM D, YYYY">MMM D, YYYY</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Format for displaying dates throughout the site
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="timeFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time Format</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="12h">12-hour (1:30 PM)</SelectItem>
                        <SelectItem value="24h">24-hour (13:30)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Format for displaying times
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="timezone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Timezone</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select timezone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="America/New_York">
                          Eastern Time (ET)
                        </SelectItem>
                        <SelectItem value="America/Chicago">
                          Central Time (CT)
                        </SelectItem>
                        <SelectItem value="America/Denver">
                          Mountain Time (MT)
                        </SelectItem>
                        <SelectItem value="America/Los_Angeles">
                          Pacific Time (PT)
                        </SelectItem>
                        <SelectItem value="Europe/London">
                          London (GMT)
                        </SelectItem>
                        <SelectItem value="Europe/Paris">
                          Paris (CET)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Default timezone for date and time display
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="defaultLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Language</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="en-US">English (US)</SelectItem>
                        <SelectItem value="es-ES">Spanish</SelectItem>
                        <SelectItem value="fr-FR">French</SelectItem>
                        <SelectItem value="de-DE">German</SelectItem>
                        <SelectItem value="pt-BR">
                          Portuguese (Brazil)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Default language for the site interface
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
  );
}

function AdvancedSettings() {
  const form = useForm<FormData>({
    defaultValues: {
      maintenanceMode: false,
      maintenanceMessage:
        "We're currently performing maintenance. Please check back soon.",
      googleAnalyticsId: "",
      enableCaching: true,
      cacheTtl: "3600",
    },
  });

  const onSubmit = (data: FormData) => {
    console.log("Submitting advanced settings:", data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Advanced Settings</CardTitle>
        <CardDescription>
          Configure system-level settings and integrations
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="maintenanceMode"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Maintenance Mode</FormLabel>
                    <FormDescription>
                      Enable to temporarily make the site inaccessible to
                      visitors
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maintenanceMessage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maintenance Message</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormDescription>
                    Message displayed during maintenance mode
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="googleAnalyticsId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Google Analytics ID</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="G-XXXXXXXXXX or UA-XXXXXXXX-X"
                    />
                  </FormControl>
                  <FormDescription>
                    Your Google Analytics tracking ID
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="enableCaching"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Enable Caching</FormLabel>
                      <FormDescription>
                        Improve performance by caching API responses and pages
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="cacheTtl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cache TTL (seconds)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" min="0" />
                    </FormControl>
                    <FormDescription>
                      Time-to-live for cached items in seconds
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
  );
}
