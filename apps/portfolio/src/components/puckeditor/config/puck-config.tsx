import type { Id } from "@/convex/_generated/dataModel";
import type { Config } from "@measured/puck";
import React from "react";
import Image from "next/image";

import { GroupActivity } from "../groups/GroupActivity";
import { GroupDiscussions } from "../groups/GroupDiscussions";
import { GroupDownloads } from "../groups/GroupDownloads";
import { GroupEvents } from "../groups/GroupEvents";
import { GroupMembers } from "../groups/GroupMembers";

// Type for dropdown options
interface SelectOption {
  label: string;
  value: string;
}

// Type for dynamic configuration options
interface ConfigOptions {
  groupOptions?: SelectOption[];
  currentGroupId?: Id<"groups">;
}

/**
 * Function to create a configuration with dynamic options
 * This allows injecting options for selectors at runtime
 */
export function createConfig(options: ConfigOptions = {}): Config {
  // Default values
  const { groupOptions = [], currentGroupId } = options;

  /**
   * Application-wide Puck editor configuration
   * This defines all available components for the visual page builder
   */
  return {
    components: {
      HeadingBlock: {
        fields: {
          children: {
            type: "text",
            label: "Heading Text",
          },
          level: {
            type: "select",
            label: "Heading Level",
            options: [
              { label: "H1", value: "h1" },
              { label: "H2", value: "h2" },
              { label: "H3", value: "h3" },
            ],
          },
        },
        defaultProps: {
          children: "This is a heading",
          level: "h2",
        },
        render: (props) => {
          const { children, level = "h1" } = props;

          switch (level) {
            case "h1":
              return <h1 className="text-3xl font-bold">{children}</h1>;
            case "h2":
              return <h2 className="text-2xl font-bold">{children}</h2>;
            case "h3":
              return <h3 className="text-xl font-bold">{children}</h3>;
            default:
              return <h1 className="text-3xl font-bold">{children}</h1>;
          }
        },
      },

      TextBlock: {
        fields: {
          content: {
            type: "textarea",
            label: "Text Content",
          },
        },
        defaultProps: {
          content: "This is a paragraph of text. Click to edit this content.",
        },
        render: (props) => {
          const { content } = props;
          return <p className="text-base">{content}</p>;
        },
      },

      Button: {
        fields: {
          label: {
            type: "text",
            label: "Button Text",
          },
          variant: {
            type: "select",
            label: "Style Variant",
            options: [
              { label: "Primary", value: "primary" },
              { label: "Secondary", value: "secondary" },
              { label: "Outline", value: "outline" },
              { label: "Ghost", value: "ghost" },
            ],
          },
          href: {
            type: "text",
            label: "Link URL",
          },
        },
        defaultProps: {
          label: "Click Me",
          variant: "primary",
          href: "#",
        },
        render: (props) => {
          // Safely extract props using nullish coalescing
          const label = String(props.label ?? "");
          const href = String(props.href ?? "#");
          const variantValue = String(props.variant ?? "primary");

          const baseClasses = "px-4 py-2 rounded font-medium text-center";
          let variantClasses = "";

          switch (variantValue) {
            case "primary":
              variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
              break;
            case "secondary":
              variantClasses = "bg-gray-200 text-gray-800 hover:bg-gray-300";
              break;
            case "outline":
              variantClasses =
                "border border-blue-600 text-blue-600 hover:bg-blue-50";
              break;
            case "ghost":
              variantClasses = "text-blue-600 hover:bg-blue-50";
              break;
            default:
              variantClasses = "bg-blue-600 text-white hover:bg-blue-700";
          }

          return (
            <a href={href} className={`${baseClasses} ${variantClasses}`}>
              {label}
            </a>
          );
        },
      },

      Card: {
        fields: {
          title: {
            type: "text",
            label: "Card Title",
          },
          content: {
            type: "textarea",
            label: "Card Content",
          },
          imageUrl: {
            type: "text",
            label: "Image URL (optional)",
          },
        },
        defaultProps: {
          title: "Card Title",
          content: "This is the card content. Add details here.",
          imageUrl: "",
        },
        render: (props) => {
          // Safely extract props with nullish coalescing
          const title = String(props.title ?? "");
          const content = String(props.content ?? "");
          const imageUrl = String(props.imageUrl ?? "");

          return (
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              {imageUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={imageUrl}
                    alt={title}
                    fill
                    style={{ objectFit: "cover" }}
                    sizes="(max-width: 768px) 100vw, 600px"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="mb-2 text-xl font-semibold">{title}</h3>
                <p className="text-gray-700">{content}</p>
              </div>
            </div>
          );
        },
      },

      Spacer: {
        fields: {
          height: {
            type: "number",
            label: "Height (px)",
          },
        },
        defaultProps: {
          height: 40,
        },
        render: (props) => {
          // Handle height safely with nullish coalescing
          const heightValue =
            typeof props.height === "number" && !isNaN(props.height)
              ? props.height
              : 20;

          return <div style={{ height: `${heightValue}px` }} />;
        },
      },

      // Group Widgets
      GroupMembers: {
        fields: {
          title: {
            type: "text",
            label: "Widget Title",
          },
          groupId: {
            type: "select",
            label: "Group",
            options: groupOptions,
          },
          maxMembers: {
            type: "number",
            label: "Maximum Members to Show",
          },
          showRoles: {
            type: "select",
            label: "Show Member Roles",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          variant: {
            type: "select",
            label: "Display Variant",
            options: [
              { label: "Default", value: "default" },
              { label: "Compact", value: "compact" },
            ],
          },
        },
        defaultProps: {
          title: "Group Members",
          maxMembers: 5,
          showRoles: "yes",
          variant: "default",
          groupId: currentGroupId, // Dynamic default from options
        },
        render: (props) => {
          // Extract props from Puck props and convert to expected component props
          const { title, groupId, maxMembers, showRoles, variant } = props;

          return (
            <GroupMembers
              title={String(title ?? "")}
              groupId={
                groupId ? (groupId as string as Id<"groups">) : undefined
              }
              maxMembers={typeof maxMembers === "number" ? maxMembers : 5}
              showRoles={showRoles === "yes"}
              variant={variant as "default" | "compact"}
            />
          );
        },
      },

      GroupActivity: {
        fields: {
          title: {
            type: "text",
            label: "Widget Title",
          },
          groupId: {
            type: "select",
            label: "Group",
            options: groupOptions,
          },
          showStats: {
            type: "select",
            label: "Show Activity Statistics",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          showTrends: {
            type: "select",
            label: "Show Activity Trends",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
        },
        defaultProps: {
          title: "Group Activity",
          showStats: "yes",
          showTrends: "yes",
          groupId: currentGroupId, // Dynamic default from options
        },
        render: (props) => {
          // Extract props from Puck props and convert to expected component props
          const { title, groupId, showStats, showTrends } = props;

          return (
            <GroupActivity
              title={String(title ?? "")}
              groupId={
                groupId ? (groupId as string as Id<"groups">) : undefined
              }
              showStats={showStats === "yes"}
              showTrends={showTrends === "yes"}
            />
          );
        },
      },

      GroupDiscussions: {
        fields: {
          title: {
            type: "text",
            label: "Widget Title",
          },
          groupId: {
            type: "select",
            label: "Group",
            options: groupOptions,
          },
          maxPosts: {
            type: "number",
            label: "Maximum Posts to Show",
          },
          showAuthors: {
            type: "select",
            label: "Show Post Authors",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          showAddButton: {
            type: "select",
            label: "Show Add Discussion Button",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
        },
        defaultProps: {
          title: "Discussions",
          maxPosts: 5,
          showAuthors: "yes",
          showAddButton: "yes",
          groupId: currentGroupId, // Dynamic default from options
        },
        render: (props) => {
          // Extract props from Puck props and convert to expected component props
          const { title, groupId, maxPosts, showAuthors, showAddButton } =
            props;

          return (
            <GroupDiscussions
              title={String(title ?? "")}
              groupId={
                groupId ? (groupId as string as Id<"groups">) : undefined
              }
              maxPosts={typeof maxPosts === "number" ? maxPosts : 5}
              showAuthors={showAuthors === "yes"}
              showAddButton={showAddButton === "yes"}
            />
          );
        },
      },

      GroupEvents: {
        fields: {
          title: {
            type: "text",
            label: "Widget Title",
          },
          groupId: {
            type: "select",
            label: "Group",
            options: groupOptions,
          },
          maxEvents: {
            type: "number",
            label: "Maximum Events to Show",
          },
          showAttendees: {
            type: "select",
            label: "Show Attendee Information",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          showAddButton: {
            type: "select",
            label: "Show Add Event Button",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
        },
        defaultProps: {
          title: "Upcoming Events",
          maxEvents: 3,
          showAttendees: "yes",
          showAddButton: "yes",
          groupId: currentGroupId, // Dynamic default from options
        },
        render: (props) => {
          // Extract props from Puck props and convert to expected component props
          const { title, groupId, maxEvents, showAttendees, showAddButton } =
            props;

          return (
            <GroupEvents
              title={String(title ?? "")}
              groupId={
                groupId ? (groupId as string as Id<"groups">) : undefined
              }
              maxEvents={typeof maxEvents === "number" ? maxEvents : 3}
              showAttendees={showAttendees === "yes"}
              showAddButton={showAddButton === "yes"}
            />
          );
        },
      },

      GroupDownloads: {
        fields: {
          title: {
            type: "text",
            label: "Widget Title",
          },
          groupId: {
            type: "select",
            label: "Group",
            options: groupOptions,
          },
          maxDownloads: {
            type: "number",
            label: "Maximum Downloads to Show",
          },
          showUploaders: {
            type: "select",
            label: "Show File Uploaders",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
          showAddButton: {
            type: "select",
            label: "Show Upload Button",
            options: [
              { label: "Yes", value: "yes" },
              { label: "No", value: "no" },
            ],
          },
        },
        defaultProps: {
          title: "Downloads",
          maxDownloads: 5,
          showUploaders: "yes",
          showAddButton: "yes",
          groupId: currentGroupId, // Dynamic default from options
        },
        render: (props) => {
          // Extract props from Puck props and convert to expected component props
          const { title, groupId, maxDownloads, showUploaders, showAddButton } =
            props;

          return (
            <GroupDownloads
              title={String(title ?? "")}
              groupId={
                groupId ? (groupId as string as Id<"groups">) : undefined
              }
              maxDownloads={typeof maxDownloads === "number" ? maxDownloads : 5}
              showUploaders={showUploaders === "yes"}
              showAddButton={showAddButton === "yes"}
            />
          );
        },
      },
    },

    // Root component that wraps all content
    root: {
      render: ({ children }) => (
        <div className="mx-auto w-full max-w-6xl p-4">{children}</div>
      ),
    },

    // Define categories for the component picker
    categories: {
      "Basic Elements": {
        components: ["HeadingBlock", "TextBlock", "Button", "Card", "Spacer"],
      },
      "Group Widgets": {
        components: [
          "GroupMembers",
          "GroupActivity",
          "GroupDiscussions",
          "GroupEvents",
          "GroupDownloads",
        ],
      },
    },
  };
}

// Export a default empty configuration for static imports
export const config = createConfig();
