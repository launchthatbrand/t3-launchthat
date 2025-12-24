"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, Info, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";

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
import { Label } from "@acme/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Switch } from "@acme/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";
import { Textarea } from "@acme/ui/textarea";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@acme/ui/tooltip";

import { api } from "@/convex/_generated/api";
import { SEO_OPTION_KEYS } from "~/lib/seo/constants";
import { useTenant } from "~/context/TenantContext";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";

export default function SeoSettingsPage() {
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
          <h1 className="text-3xl font-bold">SEO Settings</h1>
        </div>
        <p className="mt-2 text-muted-foreground">
          Configure site-wide SEO settings, meta tags, and social sharing
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap & Robots</TabsTrigger>
          <TabsTrigger value="structured">Structured Data</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSeoSettings organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="social">
          <SocialSeoSettings organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="sitemap">
          <SitemapSettings organizationId={organizationId} />
        </TabsContent>

        <TabsContent value="structured">
          <StructuredDataSettings organizationId={organizationId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function GeneralSeoSettings({
  organizationId,
}: {
  organizationId: Id<"organizations"> | null;
}) {
  const form = useForm({
    defaultValues: {
      siteTitle: "LaunchThat Portal",
      siteDescription:
        "Your centralized platform for courses, events, and resources",
      separator: " | ",
      titleFormat: "page_first",
      noindex: false,
      canonicalUrl: "https://portal.launchthat.dev",
      favicon: "",
      defaultKeywords: "portal, courses, training, resources",
    },
  });

  const option = useQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.general,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  const setBatch = useMutation(api.core.options.setBatch);

  useEffect(() => {
    const raw = option?.metaValue;
    if (!raw || typeof raw !== "object") {
      return;
    }
    form.reset({
      ...form.getValues(),
      ...(raw as Record<string, unknown>),
    });
  }, [option?.metaValue]);

  const onSubmit = async (data: any) => {
    await setBatch({
      type: "site",
      ...(organizationId ? { orgId: organizationId } : {}),
      options: [{ metaKey: SEO_OPTION_KEYS.general, metaValue: data }],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>General SEO Settings</CardTitle>
        <CardDescription>
          Configure basic SEO settings for your site
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="siteTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Site Title
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Info className="ml-1.5 h-3.5 w-3.5 cursor-pointer text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent side="right">
                            <p className="max-w-xs">
                              This title will be used as the default for your
                              homepage and in search results.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="separator"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title Separator</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a separator" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=" | ">| (Vertical Bar)</SelectItem>
                        <SelectItem value=" - ">- (Hyphen)</SelectItem>
                        <SelectItem value=" · ">· (Middle Dot)</SelectItem>
                        <SelectItem value=" • ">• (Bullet)</SelectItem>
                        <SelectItem value=" » ">
                          » (Double Angle Quotation)
                        </SelectItem>
                        <SelectItem value=" : ">: (Colon)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Used between page titles and site name
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="siteDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Site Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Enter a description for your site"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    This description will be used as the default meta
                    description for your homepage and other pages.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="defaultKeywords"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Keywords</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="keyword1, keyword2, keyword3"
                    />
                  </FormControl>
                  <FormDescription>
                    Comma-separated keywords for your site (less important for
                    modern SEO)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="titleFormat"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title Format</FormLabel>
                  <Select
                    defaultValue={field.value}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select title format" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="page_first">
                        Page Title {form.watch("separator")} Site Title
                      </SelectItem>
                      <SelectItem value="site_first">
                        Site Title {form.watch("separator")} Page Title
                      </SelectItem>
                      <SelectItem value="page_only">Page Title Only</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Determines how page titles will be displayed
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canonicalUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Canonical URL</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="https://yourdomain.com" />
                  </FormControl>
                  <FormDescription>
                    Your site's primary URL for canonical tags
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noindex"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Discourage Search Engines</FormLabel>
                    <FormDescription>
                      Enable this to add a noindex meta tag to all pages
                    </FormDescription>
                  </div>
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

function SocialSeoSettings({
  organizationId,
}: {
  organizationId: Id<"organizations"> | null;
}) {
  const form = useForm({
    defaultValues: {
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      twitterUsername: "",
      twitterCardType: "summary_large_image",
      facebookAppId: "",
      enableSocialMeta: true,
    },
  });

  const option = useQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.social,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  const setBatch = useMutation(api.core.options.setBatch);

  useEffect(() => {
    const raw = option?.metaValue;
    if (!raw || typeof raw !== "object") {
      return;
    }
    form.reset({
      ...form.getValues(),
      ...(raw as Record<string, unknown>),
    });
  }, [option?.metaValue]);

  const onSubmit = async (data: any) => {
    await setBatch({
      type: "site",
      ...(organizationId ? { orgId: organizationId } : {}),
      options: [{ metaKey: SEO_OPTION_KEYS.social, metaValue: data }],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Social Media SEO</CardTitle>
        <CardDescription>
          Configure how your content appears when shared on social media
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enableSocialMeta"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Social Meta Tags</FormLabel>
                    <FormDescription>
                      Generate Open Graph and Twitter Card meta tags for your
                      pages
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="ogTitle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Open Graph Title</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Leave blank to use site title"
                      />
                    </FormControl>
                    <FormDescription>
                      Used when content is shared on Facebook, LinkedIn, etc.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="twitterCardType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter Card Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select card type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="summary">Summary</SelectItem>
                        <SelectItem value="summary_large_image">
                          Summary with Large Image
                        </SelectItem>
                        <SelectItem value="app">App</SelectItem>
                        <SelectItem value="player">Player</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      How your content should appear when shared on Twitter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="ogDescription"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Open Graph Description</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Leave blank to use site description"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    Used when content is shared on social media platforms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="ogImage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Default Social Image URL</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="https://yourdomain.com/default-social-image.jpg"
                    />
                  </FormControl>
                  <FormDescription>
                    1200x630 pixels recommended for best display on most
                    platforms
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="twitterUsername"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Twitter Username</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="@yourusername" />
                    </FormControl>
                    <FormDescription>
                      Used for the twitter:site meta tag
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebookAppId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Facebook App ID</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123456789012345" />
                    </FormControl>
                    <FormDescription>
                      Optional, used for Facebook Insights
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

function SitemapSettings({
  organizationId,
}: {
  organizationId: Id<"organizations"> | null;
}) {
  const form = useForm({
    defaultValues: {
      enableSitemap: true,
      sitemapIncludeImages: true,
      sitemapExcludePaths: "",
      robotsTxtContent: `User-agent: *\nDisallow: /admin/\nDisallow: /api/\nAllow: /\nSitemap: https://portal.launchthat.dev/sitemap.xml`,
    },
  });

  const option = useQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.sitemap,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  const setBatch = useMutation(api.core.options.setBatch);

  useEffect(() => {
    const raw = option?.metaValue;
    if (!raw || typeof raw !== "object") {
      return;
    }
    form.reset({
      ...form.getValues(),
      ...(raw as Record<string, unknown>),
    });
  }, [option?.metaValue]);

  const onSubmit = async (data: any) => {
    await setBatch({
      type: "site",
      ...(organizationId ? { orgId: organizationId } : {}),
      options: [{ metaKey: SEO_OPTION_KEYS.sitemap, metaValue: data }],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sitemap & Robots.txt</CardTitle>
        <CardDescription>
          Configure XML sitemap and robots.txt file settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="enableSitemap"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Generate XML Sitemap</FormLabel>
                      <FormDescription>
                        Automatically generate and update sitemap.xml
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sitemapIncludeImages"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Include Images</FormLabel>
                      <FormDescription>
                        Add image information to XML sitemap
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="sitemapExcludePaths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Excluded Paths</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="/path/to/exclude\n/another/path"
                      rows={3}
                    />
                  </FormControl>
                  <FormDescription>
                    List URL paths to exclude from the sitemap (one per line)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="robotsTxtContent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Robots.txt Content</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="font-mono text-sm"
                      rows={8}
                    />
                  </FormControl>
                  <FormDescription>
                    Content of your robots.txt file (instructions for search
                    engines)
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

function StructuredDataSettings({
  organizationId,
}: {
  organizationId: Id<"organizations"> | null;
}) {
  const form = useForm({
    defaultValues: {
      enableStructuredData: true,
      organizationType: "Organization",
      organizationName: "LaunchThat",
      organizationLogo: "https://portal.launchthat.dev/logo.png",
      organizationSameAs: [
        "https://twitter.com/launchthat",
        "https://facebook.com/launchthat",
      ],
      breadcrumbsEnabled: true,
      courseStructuredData: true,
      productStructuredData: true,
    },
  });

  const option = useQuery(api.core.options.get, {
    metaKey: SEO_OPTION_KEYS.structured,
    type: "site",
    ...(organizationId ? { orgId: organizationId } : {}),
  } as const);
  const setBatch = useMutation(api.core.options.setBatch);

  useEffect(() => {
    const raw = option?.metaValue;
    if (!raw || typeof raw !== "object") {
      return;
    }
    form.reset({
      ...form.getValues(),
      ...(raw as Record<string, unknown>),
    });
  }, [option?.metaValue]);

  const onSubmit = async (data: any) => {
    await setBatch({
      type: "site",
      ...(organizationId ? { orgId: organizationId } : {}),
      options: [{ metaKey: SEO_OPTION_KEYS.structured, metaValue: data }],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Structured Data</CardTitle>
        <CardDescription>
          Configure JSON-LD structured data for rich search results
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="enableStructuredData"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Enable Structured Data</FormLabel>
                    <FormDescription>
                      Generate JSON-LD structured data for your pages
                    </FormDescription>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="organizationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type</FormLabel>
                    <Select
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Organization">
                          Organization
                        </SelectItem>
                        <SelectItem value="LocalBusiness">
                          Local Business
                        </SelectItem>
                        <SelectItem value="Corporation">Corporation</SelectItem>
                        <SelectItem value="EducationalOrganization">
                          Educational Organization
                        </SelectItem>
                        <SelectItem value="Person">Person</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type of entity for Organization structured data
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="organizationName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>Name of your organization</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="organizationLogo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Organization Logo URL</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormDescription>
                    URL to your organization's logo (minimum 112x112px,
                    recommended 1:1 ratio)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="breadcrumbsEnabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Breadcrumb Data</FormLabel>
                      <FormDescription>
                        Enable breadcrumb structured data
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="courseStructuredData"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Course Data</FormLabel>
                      <FormDescription>
                        Enable course structured data
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="productStructuredData"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center gap-2 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Product Data</FormLabel>
                      <FormDescription>
                        Enable product structured data
                      </FormDescription>
                    </div>
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
