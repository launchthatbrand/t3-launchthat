import type {
  PluginDefinition,
  PluginFrontendSingleRendererProps,
} from "launchthat-plugin-core";
import type { ComponentType, ReactNode } from "react";
import { createElement } from "react";

import { SocialHubDashboard } from "./components/SocialHubDashboard";
import { SocialFeedGroupSingle } from "./frontend/SocialFeedGroupSingle";

export const PLUGIN_ID = "socialfeed" as const;

export const SOCIAL_FEED_FRONTEND_PROVIDER_ID = "socialfeed-client";

type ProviderProps = { children: ReactNode };

// Keep a stable object reference so the plugin definition doesn't need to be replaced
// when portal configures provider implementations.
const socialFeedProviders: Record<string, ComponentType<ProviderProps>> = {};

export const createSocialFeedPluginDefinition = (): PluginDefinition => ({
  id: PLUGIN_ID,
  name: "Social Feed",
  description: "Activity feeds, reactions, and group conversations.",
  longDescription:
    "Enables rich social activity streams with feed items, reactions, comments, and lightweight social groups.",
  features: [
    "Universal + personalized feeds",
    "Reactions and comments",
    "Lightweight social groups",
    "Hashtags and mentions",
  ],
  postTypes: [
    {
      name: "Social Feed Items",
      slug: "social-feed-item",
      description: "Individual updates or shares inside the social feed.",
      isPublic: false,
      includeTimestamps: true,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        customFields: true,
        taxonomy: true,
        revisions: true,
        comments: true,
      },
      enableApi: true,
      adminMenu: {
        enabled: true,
        label: "Feed",
        slug: "social-feed-item",
        icon: "Newspaper",
        position: 35,
        parent: "social",
      },
      singleView: {
        defaultTab: "edit",
        tabs: [
          {
            id: "dashboard",
            slug: "dashboard",
            label: "Dashboard",
            description:
              "Monitor feed performance, publish announcements, and view recent engagement.",
            render: () => createElement(SocialHubDashboard),
          },
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Update feed content and metadata.",
            usesDefaultEditor: true,
          },
        ],
      },
      adminArchiveView: {
        defaultTab: "list",
        tabs: [
          {
            id: "dashboard",
            slug: "dashboard",
            label: "Dashboard",
            description:
              "Monitor feed performance, publish announcements, and view recent engagement.",
            render: () => createElement(SocialHubDashboard),
          },
          {
            id: "list",
            slug: "list",
            label: "Feed Items",
            description: "Classic WordPress-style archive management.",
            usesDefaultArchive: true,
          },
          {
            id: "groups",
            slug: "groups",
            label: "Groups",
            description: "Manage social groups and their members.",
            usesDefaultArchive: true,
            postTypeSlug: "social-feed-group",
          },
        ],
      },
    },
    {
      name: "Social Feed Groups",
      slug: "social-feed-group",
      description: "Collections of members that own a scoped activity feed.",
      isPublic: false,
      includeTimestamps: true,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        customFields: true,
        taxonomy: false,
        revisions: true,
        comments: true,
      },
      enableApi: true,
      adminMenu: {
        enabled: true,
        label: "Groups",
        slug: "social-feed-group",
        icon: "Users",
        position: 36,
        parent: "social",
      },
      frontend: {
        providers: [SOCIAL_FEED_FRONTEND_PROVIDER_ID],
        single: {
          render: ({ post }: PluginFrontendSingleRendererProps) => {
            const typedPost = post as any;
            return createElement(SocialFeedGroupSingle, {
              post: {
                _id: typedPost._id,
                title: typedPost.title,
                excerpt: typedPost.excerpt,
                content: typedPost.content,
                slug: typedPost.slug,
                organizationId: typedPost.organizationId,
              },
            });
          },
        },
      },
    },
  ],
  activation: {
    optionKey: `plugin_${PLUGIN_ID}_enabled`,
    optionType: "site",
    defaultEnabled: false,
  },
  providers: socialFeedProviders,
  adminMenus: [
    {
      label: "Social Hub",
      slug: "edit?post_type=social-feed-item&tab=dashboard",
      icon: "MessageCircle",
      position: 34,
      group: "social",
    },
    {
      label: "Social Feed Items",
      slug: "edit?post_type=social-feed-item",
      icon: "Newspaper",
      position: 35,
      group: "social",
    },
    {
      label: "Social Groups",
      slug: "edit?post_type=social-feed-item&tab=groups",
      icon: "Users",
      position: 36,
      group: "social",
    },
  ],
});

export const socialFeedPlugin: PluginDefinition =
  createSocialFeedPluginDefinition();

export const configureSocialFeedPlugin = (overrides: {
  providers?: Record<string, ComponentType<ProviderProps>>;
}) => {
  for (const key of Object.keys(socialFeedProviders)) {
    delete socialFeedProviders[key];
  }
  if (overrides.providers) {
    Object.assign(socialFeedProviders, overrides.providers);
  }
};
