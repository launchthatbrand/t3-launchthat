import type { PluginDefinition } from "launchthat-plugin-core";

export const socialFeedPlugin: PluginDefinition = {
  id: "socialfeed",
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
        slug: "social/feed",
        icon: "Newspaper",
        position: 35,
        parent: "social",
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
        slug: "social/groups",
        icon: "Users",
        position: 36,
        parent: "social",
      },
    },
  ],
  adminMenus: [
    {
      label: "Social Hub",
      slug: "social",
      icon: "MessageCircle",
      position: 34,
      group: "social",
    },
    {
      label: "Social Feed Items",
      slug: "social/feed",
      icon: "Newspaper",
      position: 35,
      group: "social",
    },
    {
      label: "Social Groups",
      slug: "social/groups",
      icon: "Users",
      position: 36,
      group: "social",
    },
  ],
};

export default socialFeedPlugin;
