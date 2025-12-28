"use client";

import type { Id } from "@/convex/_generated/dataModel";
import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import {
  Form,
  FormControl,
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
import { Separator } from "@acme/ui/separator";
import { Switch } from "@acme/ui/switch";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import { useTenant } from "~/context/TenantContext";
import {
  DEFAULT_PAGE_TEMPLATE_SLUG,
  listPageTemplates,
} from "~/lib/pageTemplates/registry";
import { getTenantOrganizationId } from "~/lib/tenant-fetcher";
import { usePostType, useUpdatePostType } from "../_api/postTypes";

const supportsOptions = [
  { key: "title", label: "Title" },
  { key: "editor", label: "Editor" },
  { key: "excerpt", label: "Excerpt" },
  { key: "attachments", label: "Attachments" },
  { key: "customFields", label: "Custom Fields" },
  { key: "postMeta", label: "Post Meta" },
  { key: "comments", label: "Comments" },
  { key: "revisions", label: "Revisions" },
  { key: "taxonomy", label: "Categories / Tags" },
] as const;

const rewriteSchema = z.object({
  hasArchive: z.boolean(),
  archiveSlug: z.string().optional(),
  singleSlug: z.string().optional(),
  withFront: z.boolean(),
  feeds: z.boolean(),
  pages: z.boolean(),
});

const adminMenuSchema = z.object({
  enabled: z.boolean(),
  label: z.string().optional(),
  slug: z.string().optional(),
  icon: z.string().optional(),
  menuId: z.string().optional(),
  parent: z.string().optional(),
  position: z
    .string()
    .optional()
    .transform((value) => (value?.length ? value : undefined)),
});

const frontendVisibilitySchema = z.object({
  showCustomFields: z.boolean(),
  showComments: z.boolean(),
  disabledSingleSlotIds: z.array(z.string()),
});

const contentTypeFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  isPublic: z.boolean(),
  enableApi: z.boolean(),
  includeTimestamps: z.boolean(),
  enableVersioning: z.boolean(),
  pageTemplateSlug: z.string().min(1),
  supports: z.object(
    supportsOptions.reduce(
      (acc, option) => ({ ...acc, [option.key]: z.boolean() }),
      {} as Record<(typeof supportsOptions)[number]["key"], z.ZodBoolean>,
    ),
  ),
  rewrite: rewriteSchema,
  adminMenu: adminMenuSchema,
  frontendVisibility: frontendVisibilitySchema,
});

type ContentTypeFormValues = z.infer<typeof contentTypeFormSchema>;

const defaultSupports: ContentTypeFormValues["supports"] =
  supportsOptions.reduce(
    (acc, option) => ({ ...acc, [option.key]: true }),
    {} as ContentTypeFormValues["supports"],
  );

const normalizeSupports = (
  supports?:
    | ContentTypeFormValues["supports"]
    | (ContentTypeFormValues["supports"] & { featuredImage?: boolean }),
) => {
  const next = { ...defaultSupports };
  if (!supports) {
    return next;
  }
  supportsOptions.forEach((option) => {
    const value = supports[option.key];
    if (typeof value === "boolean") {
      next[option.key] = value;
    }
  });
  if (
    supports.attachments === undefined &&
    typeof supports.featuredImage === "boolean"
  ) {
    next.attachments = supports.featuredImage;
  }
  return next;
};

const defaultRewrite: ContentTypeFormValues["rewrite"] = {
  hasArchive: true,
  archiveSlug: "",
  singleSlug: "",
  withFront: true,
  feeds: false,
  pages: true,
};

const defaultAdminMenu: ContentTypeFormValues["adminMenu"] = {
  enabled: false,
  label: "",
  slug: "",
  icon: "",
  menuId: "",
  parent: "",
  position: undefined,
};

const defaultFrontendVisibility: ContentTypeFormValues["frontendVisibility"] = {
  showCustomFields: true,
  showComments: true,
  disabledSingleSlotIds: [],
};

export default function ContentTypeDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentTypeId = params?.id as Id<"postTypes"> | undefined;

  const tenant = useTenant();
  const tenantOrgId = getTenantOrganizationId(tenant) as string | undefined;
  const availablePageTemplates = useMemo(
    () => listPageTemplates(tenantOrgId),
    [tenantOrgId],
  );

  const contentType = usePostType(contentTypeId);
  const updateContentType = useUpdatePostType();

  const form = useForm<ContentTypeFormValues>({
    resolver: zodResolver(contentTypeFormSchema),
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      isPublic: true,
      enableApi: true,
      includeTimestamps: true,
      enableVersioning: false,
      pageTemplateSlug: DEFAULT_PAGE_TEMPLATE_SLUG,
      supports: defaultSupports,
      rewrite: defaultRewrite,
      adminMenu: defaultAdminMenu,
      frontendVisibility: defaultFrontendVisibility,
    },
  });

  useEffect(() => {
    if (contentType) {
      form.reset({
        name: contentType.name,
        slug: contentType.slug,
        description: contentType.description ?? "",
        isPublic: contentType.isPublic,
        enableApi: contentType.enableApi ?? true,
        includeTimestamps: contentType.includeTimestamps ?? true,
        enableVersioning: contentType.enableVersioning ?? false,
        pageTemplateSlug: contentType.pageTemplateSlug ?? DEFAULT_PAGE_TEMPLATE_SLUG,
        supports: normalizeSupports(contentType.supports ?? undefined),
          frontendVisibility: {
            ...defaultFrontendVisibility,
            ...(contentType.frontendVisibility ?? {}),
            disabledSingleSlotIds: Array.isArray(
              (contentType.frontendVisibility as { disabledSingleSlotIds?: unknown })
                ?.disabledSingleSlotIds,
            )
              ? ((contentType.frontendVisibility as { disabledSingleSlotIds: string[] })
                  .disabledSingleSlotIds ?? [])
              : [],
          },
        rewrite: {
          ...defaultRewrite,
          ...(contentType.rewrite ?? {}),
          archiveSlug:
            contentType.rewrite?.archiveSlug ?? contentType.slug ?? "",
          singleSlug:
            contentType.rewrite?.singleSlug ??
            contentType.slug.replace(/s$/, ""),
        },
        adminMenu: {
          ...defaultAdminMenu,
          ...(contentType.adminMenu ?? {}),
          label: contentType.adminMenu?.label ?? contentType.name,
          slug: contentType.adminMenu?.slug ?? contentType.slug,
          position: contentType.adminMenu?.position
            ? String(contentType.adminMenu.position)
            : undefined,
        },
      });
    }
  }, [contentType, form]);

  const isSaving = form.formState.isSubmitting;
  const adminMenuEnabled = form.watch("adminMenu.enabled");
  const supportsComments = form.watch("supports.comments");
  const rewriteValues = form.watch(
    "rewrite",
  ) as ContentTypeFormValues["rewrite"];

  const previewPaths = useMemo(() => {
    const archiveSlug = rewriteValues.archiveSlug?.length
      ? rewriteValues.archiveSlug
      : (contentType?.slug ?? "");
    const singleSlug = rewriteValues.singleSlug?.length
      ? rewriteValues.singleSlug
      : (contentType?.slug.replace(/s$/, "") ?? "");

    return {
      archive: rewriteValues.hasArchive ? `/${archiveSlug}` : "Disabled",
      single: `/${singleSlug}/sample-entry`,
    };
  }, [rewriteValues, contentType?.slug]);

  if (!contentTypeId) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="text-muted-foreground py-12 text-center">
            Invalid post type ID.
          </CardContent>
        </Card>
      </div>
    );
  }

  if (contentType === undefined) {
    return (
      <div className="container flex min-h-[60vh] items-center justify-center">
        <div className="text-muted-foreground flex flex-col items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading post type…</span>
        </div>
      </div>
    );
  }

  if (contentType === null) {
    return (
      <div className="container py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              Content type not found or no longer exists.
            </p>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/settings/post-types")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Post Types
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async (values: ContentTypeFormValues) => {
    const menuPosition =
      values.adminMenu.position !== undefined
        ? Number(values.adminMenu.position)
        : undefined;
    const normalizedArchiveSlug = values.rewrite.archiveSlug?.trim();
    const resolvedArchiveSlug =
      normalizedArchiveSlug && normalizedArchiveSlug.length > 0
        ? normalizedArchiveSlug
        : undefined;
    const normalizedSingleSlug = values.rewrite.singleSlug?.trim();
    const resolvedSingleSlug =
      normalizedSingleSlug && normalizedSingleSlug.length > 0
        ? normalizedSingleSlug
        : "";
    const adminMenuSlug = values.adminMenu.slug?.trim();
    const resolvedAdminMenuSlug =
      adminMenuSlug && adminMenuSlug.length > 0 ? adminMenuSlug : values.slug;
    const adminMenuLabel = values.adminMenu.label?.trim();
    const resolvedAdminMenuLabel =
      adminMenuLabel && adminMenuLabel.length > 0
        ? adminMenuLabel
        : values.name;

    const supportsPayload: ContentTypeFormValues["supports"] & {
      featuredImage?: boolean;
    } = {
      ...values.supports,
      featuredImage: values.supports.attachments,
    };

    await updateContentType({
      id: contentType._id,
      data: {
        name: values.name,
        slug: values.slug,
        description: values.description,
        isPublic: values.isPublic,
        enableApi: values.enableApi,
        includeTimestamps: values.includeTimestamps,
        enableVersioning: values.enableVersioning,
        pageTemplateSlug: values.pageTemplateSlug,
        supports: supportsPayload,
        frontendVisibility: {
          showCustomFields: values.frontendVisibility.showCustomFields,
          showComments: supportsPayload.comments
            ? values.frontendVisibility.showComments
            : false,
          disabledSingleSlotIds: values.frontendVisibility.disabledSingleSlotIds,
        },
        rewrite: {
          ...values.rewrite,
          archiveSlug: resolvedArchiveSlug,
          singleSlug: resolvedSingleSlug,
        },
        adminMenu: {
          ...values.adminMenu,
          slug: resolvedAdminMenuSlug,
          label: resolvedAdminMenuLabel,
          position: Number.isNaN(menuPosition) ? undefined : menuPosition,
        },
      },
    });

    toast.success("Content type updated");
  };

  return (
    <div className="container space-y-6 py-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href="/admin/settings/post-types">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{contentType.name}</h1>
            <p className="text-muted-foreground">
              Configure this post type like a WordPress post type.
            </p>
          </div>
        </div>
        <Button
          type="button"
          variant="outline"
          onClick={() => form.handleSubmit(handleSubmit)()}
          disabled={isSaving}
        >
          {isSaving ? (
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

      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Core information and publish settings for this post type.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Podcast Episode" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="podcast-episodes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={3}
                        placeholder="Describe the purpose of this post type."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex flex-col gap-4 md:col-span-2 md:flex-row">
                <FormField
                  control={form.control}
                  name="isPublic"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 items-center justify-between rounded-md border p-4">
                      <div>
                        <FormLabel>Publicly Queryable</FormLabel>
                        <CardDescription className="text-xs">
                          Expose entries to the public API.
                        </CardDescription>
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
                  name="enableApi"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 items-center justify-between rounded-md border p-4">
                      <div>
                        <FormLabel>Enable API Routes</FormLabel>
                        <CardDescription className="text-xs">
                          Generate CRUD routes for this type.
                        </CardDescription>
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
                  name="includeTimestamps"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 items-center justify-between rounded-md border p-4">
                      <div>
                        <FormLabel>Include Timestamps</FormLabel>
                        <CardDescription className="text-xs">
                          Automatically manage created/updated fields.
                        </CardDescription>
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
                  name="enableVersioning"
                  render={({ field }) => (
                    <FormItem className="flex flex-1 items-center justify-between rounded-md border p-4">
                      <div>
                        <FormLabel>Enable Revisions</FormLabel>
                        <CardDescription className="text-xs">
                          Track revisions for this post type.
                        </CardDescription>
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
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supports</CardTitle>
              <CardDescription>
                Enable WordPress-style features for this post type.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-3">
              {supportsOptions.map((option) => (
                <FormField
                  key={option.key}
                  control={form.control}
                  name={`supports.${option.key}`}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel className="text-sm">{option.label}</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Frontend</CardTitle>
              <CardDescription>
                Control which built-in sections appear on the public single page
                for this post type.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="pageTemplateSlug"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Page Template</FormLabel>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className="max-w-[360px]">
                          <SelectValue placeholder="Select a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {availablePageTemplates.map((template) => (
                            <SelectItem key={template.slug} value={template.slug}>
                              {template.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="text-muted-foreground text-sm">
                      Applies to all frontend single pages for this post type.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="frontendVisibility.showCustomFields"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel className="text-sm">
                        Show Custom Fields section
                      </FormLabel>
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
                  name="frontendVisibility.showComments"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel className="text-sm">Show Comments</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={!supportsComments}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <FormField
                control={form.control}
                name="frontendVisibility.disabledSingleSlotIds"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel>Disable plugin slot IDs (one per line)</FormLabel>
                    <FormControl>
                      <Textarea
                        value={field.value.join("\n")}
                        onChange={(e) => {
                          const ids = e.target.value
                            .split("\n")
                            .map((v) => v.trim())
                            .filter((v) => v.length > 0);
                          field.onChange(ids);
                        }}
                        rows={4}
                        placeholder={[
                          "Example (LMS):",
                          "lms-frontend-lessons-progress-slot",
                          "lms-frontend-lessons-completion-slot",
                        ].join("\n")}
                      />
                    </FormControl>
                    <p className="text-muted-foreground text-sm">
                      Use this to hide plugin-injected panels like LMS course
                      progress/completion for this post type.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Rewrite & Archive</CardTitle>
              <CardDescription>
                Configure pretty permalinks similar to WordPress rewrite rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rewrite.hasArchive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel>Has Archive</FormLabel>
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
                  name="rewrite.withFront"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel>Respect Front Base</FormLabel>
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
                  name="rewrite.feeds"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel>Generate Feeds</FormLabel>
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
                  name="rewrite.pages"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-md border p-3">
                      <FormLabel>Paginated Archives</FormLabel>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="rewrite.archiveSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Archive Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., news" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="rewrite.singleSlug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Single Slug</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., article" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="bg-muted text-muted-foreground rounded-md p-3 text-xs">
                <p>
                  Archive URL: <strong>{previewPaths.archive}</strong>
                </p>
                <p>
                  Single URL: <strong>{previewPaths.single}</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Admin Menu</CardTitle>
              <CardDescription>
                Automatically add this post type to the admin sidebar.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="adminMenu.enabled"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-md border p-3">
                    <div>
                      <FormLabel>Enable Admin Menu</FormLabel>
                      <CardDescription className="text-xs">
                        Show this post type in the admin sidebar.
                      </CardDescription>
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
              <div className="grid gap-4 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="adminMenu.label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Title</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!adminMenuEnabled}
                          placeholder="Menu label"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminMenu.slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin Route Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!adminMenuEnabled}
                          placeholder="e.g., content/articles"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminMenu.icon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lucide Icon</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!adminMenuEnabled}
                          placeholder="e.g., Newspaper"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminMenu.position"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu Position</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!adminMenuEnabled}
                          placeholder="20"
                          type="number"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminMenu.menuId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Menu ID</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!adminMenuEnabled}
                          placeholder="Unique identifier"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="adminMenu.parent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Menu Slug</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={!adminMenuEnabled}
                          placeholder="Optional parent slug"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              {!adminMenuEnabled && (
                <p className="text-muted-foreground text-sm">
                  Enable the admin menu to inject this post type into the
                  sidebar automatically.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? (
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
      <Separator />
    </div>
  );
}
