"use client";

import type { Doc } from "@/convex/_generated/dataModel";
import { useMemo, useTransition } from "react";
import { toast } from "sonner";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Separator } from "@acme/ui/separator";

import {
  useCreatePostType,
  usePostTypes,
} from "../../settings/post-types/_api/postTypes";

interface PluginPostTypeSupports {
  title?: boolean;
  editor?: boolean;
  excerpt?: boolean;
  featuredImage?: boolean;
  customFields?: boolean;
  comments?: boolean;
  revisions?: boolean;
  postMeta?: boolean;
  taxonomy?: boolean;
}

interface PluginPostTypeRewrite {
  hasArchive?: boolean;
  archiveSlug?: string;
  singleSlug?: string;
  withFront?: boolean;
  feeds?: boolean;
  pages?: boolean;
}

interface PluginPostTypeAdminMenu {
  enabled: boolean;
  label?: string;
  slug?: string;
  menuId?: string;
  icon?: string;
  position?: number;
  parent?: string;
}

interface PluginPostTypeConfig {
  name: string;
  slug: string;
  description?: string;
  isPublic: boolean;
  isBuiltIn?: boolean;
  includeTimestamps?: boolean;
  enableApi?: boolean;
  enableVersioning?: boolean;
  supports?: PluginPostTypeSupports;
  rewrite?: PluginPostTypeRewrite;
  adminMenu: PluginPostTypeAdminMenu;
}

interface PluginDefinition {
  id: string;
  name: string;
  description: string;
  longDescription: string;
  features: string[];
  postTypes: PluginPostTypeConfig[];
}

export default function PluginsPage() {
  const { data: postTypes, isLoading } = usePostTypes(true);
  const createPostType = useCreatePostType();
  const [isPending, startTransition] = useTransition();

  const plugins = useMemo<PluginDefinition[]>(
    () => [
      {
        id: "lms",
        name: "Learning Management System",
        description:
          "Courses, lessons, topics and quizzes with learner tracking.",
        longDescription:
          "Perfect for education businesses. Enabling this plugin provisions all LMS post types with archive pages, admin menus and rich metadata.",
        features: [
          "Course + lesson builders",
          "Topic + quiz post types",
          "Access control hooks",
          "Completion tracking",
        ],
        postTypes: [
          {
            name: "Courses",
            slug: "courses",
            description: "Top-level LMS course container.",
            isPublic: true,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              editor: true,
              excerpt: true,
              featuredImage: true,
              customFields: true,
              revisions: true,
              taxonomy: true,
            },
            rewrite: {
              hasArchive: true,
              archiveSlug: "courses",
              singleSlug: "course",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Courses",
              slug: "lms/courses",
              icon: "GraduationCap",
              position: 30,
            },
          },
          {
            name: "Lessons",
            slug: "lessons",
            description: "Lessons nested under a course.",
            isPublic: true,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              editor: true,
              featuredImage: true,
              customFields: true,
              revisions: true,
            },
            rewrite: {
              hasArchive: false,
              singleSlug: "lesson",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Lessons",
              slug: "lms/lessons",
              icon: "BookOpenCheck",
              position: 31,
            },
          },
          {
            name: "Topics",
            slug: "topics",
            description: "Lesson topics / sub-lessons.",
            isPublic: false,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              editor: true,
              customFields: true,
            },
            rewrite: {
              hasArchive: false,
              singleSlug: "topic",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Topics",
              slug: "lms/topics",
              icon: "ListChecks",
              position: 32,
            },
          },
          {
            name: "Quizzes",
            slug: "quizzes",
            description: "Assessments that connect to lessons/topics.",
            isPublic: false,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              editor: true,
              postMeta: true,
            },
            rewrite: {
              hasArchive: false,
              singleSlug: "quiz",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Quizzes",
              slug: "lms/quizzes",
              icon: "ClipboardCheck",
              position: 33,
            },
          },
        ],
      },
      {
        id: "commerce",
        name: "Ecommerce",
        description: "Products, orders and catalog components.",
        longDescription:
          "Sell digital or physical products. Adds product + order post types with store specific settings.",
        features: [
          "Products, orders, coupons",
          "Inventory hooks",
          "Catalog API endpoints",
          "Admin store sidebar items",
        ],
        postTypes: [
          {
            name: "Products",
            slug: "products",
            description: "Shoppable catalog entries.",
            isPublic: true,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              editor: true,
              excerpt: true,
              featuredImage: true,
              customFields: true,
              postMeta: true,
              taxonomy: true,
            },
            rewrite: {
              hasArchive: true,
              archiveSlug: "store",
              singleSlug: "product",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Products",
              slug: "store/products",
              icon: "Package",
              position: 40,
            },
          },
          {
            name: "Orders",
            slug: "orders",
            description: "Order records stored as entries.",
            isPublic: false,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              customFields: true,
              postMeta: true,
            },
            rewrite: {
              hasArchive: false,
              singleSlug: "order",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Orders",
              slug: "store/orders",
              icon: "Receipt",
              position: 41,
            },
          },
        ],
      },
      {
        id: "helpdesk",
        name: "Helpdesk",
        description: "Tickets and threaded conversations.",
        longDescription:
          "Provide support for your customers. Adds ticket post types and sidebar entries.",
        features: [
          "Tickets + replies",
          "Priority + status fields",
          "Internal / external notes",
          "Admin navigation items",
        ],
        postTypes: [
          {
            name: "Tickets",
            slug: "tickets",
            description: "Primary helpdesk ticket entity.",
            isPublic: false,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              title: true,
              editor: true,
              customFields: true,
              postMeta: true,
            },
            rewrite: {
              hasArchive: false,
              singleSlug: "ticket",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: true,
              label: "Tickets",
              slug: "helpdesk/tickets",
              icon: "LifeBuoy",
              position: 50,
            },
          },
          {
            name: "Ticket Replies",
            slug: "ticket-replies",
            description: "Threaded responses linked to a ticket.",
            isPublic: false,
            includeTimestamps: true,
            enableApi: true,
            supports: {
              editor: true,
              customFields: true,
            },
            rewrite: {
              hasArchive: false,
              singleSlug: "ticket-reply",
              withFront: true,
              feeds: false,
              pages: true,
            },
            adminMenu: {
              enabled: false,
            },
          },
        ],
      },
    ],
    [],
  );

  const pluginStatus = useMemo(() => {
    const enabledSlugs = new Set(
      postTypes.map((postType: Doc<"postTypes">) => postType.slug),
    );
    return plugins.map((plugin) => {
      const missing = plugin.postTypes.filter(
        (type: PluginPostTypeConfig) => !enabledSlugs.has(type.slug),
      );
      return {
        pluginId: plugin.id,
        isEnabled: missing.length === 0,
        missingSlugs: missing.map((type) => type.slug),
      };
    });
  }, [postTypes, plugins]);

  const handleEnablePlugin = (plugin: PluginDefinition) => {
    startTransition(async () => {
      try {
        for (const type of plugin.postTypes) {
          const exists = postTypes.some(
            (existing: Doc<"postTypes">) => existing.slug === type.slug,
          );

          if (!exists) {
            await createPostType({
              ...type,
            });
          }
        }
        toast.success(`${plugin.name} plugin enabled`);
      } catch (cause) {
        console.error(cause);
        toast.error(`Failed to enable ${plugin.name}`, {
          description:
            cause instanceof Error ? cause.message : "Unknown error occurred",
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Portal Plugins</h1>
        <p className="text-muted-foreground">
          Enable suites of features for each organization. Plugins provision
          post types, menu entries and API endpoints—similar to WordPress post
          types.
        </p>
      </div>

      <Separator />

      <div className="grid gap-6 lg:grid-cols-2">
        {plugins.map((plugin) => {
          const status = pluginStatus.find(
            (state) => state.pluginId === plugin.id,
          );
          const isEnabled = status?.isEnabled;

          return (
            <Card key={plugin.id} className="flex flex-col">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between">
                  <CardTitle>{plugin.name}</CardTitle>
                  <Badge variant={isEnabled ? "default" : "secondary"}>
                    {isEnabled ? "Enabled" : "Disabled"}
                  </Badge>
                </div>
                <CardDescription>{plugin.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  {plugin.longDescription}
                </p>
                <div>
                  <p className="text-sm font-medium">Feature Highlights</p>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                    {plugin.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                </div>

                <div>
                  <p className="text-sm font-medium">Provisioned Post Types</p>
                  <div className="mt-2 grid gap-2">
                    {plugin.postTypes.map((type) => {
                      const exists = postTypes.some(
                        (existing: Doc<"postTypes">) =>
                          existing.slug === type.slug,
                      );
                      return (
                        <div
                          key={type.slug}
                          className="flex flex-wrap items-center justify-between rounded-md border px-3 py-2 text-sm"
                        >
                          <div>
                            <p className="font-medium">{type.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Slug: {type.slug}
                            </p>
                          </div>
                          <Badge
                            variant={exists ? "outline" : "secondary"}
                            className="mt-2 md:mt-0"
                          >
                            {exists ? "Exists" : "Will be created"}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
              <CardFooter className="mt-auto flex items-center gap-3">
                <Button
                  disabled={(isEnabled ?? false) || isPending || isLoading}
                  onClick={() => handleEnablePlugin(plugin)}
                >
                  {isPending ? "Provisioning…" : "Enable Plugin"}
                </Button>
                {!isEnabled && (
                  <p className="text-xs text-muted-foreground">
                    {status?.missingSlugs.length
                      ? `Needs ${status.missingSlugs.length} post type(s)`
                      : "Ready to enable"}
                  </p>
                )}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
