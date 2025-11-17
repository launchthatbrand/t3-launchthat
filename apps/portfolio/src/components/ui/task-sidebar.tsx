import * as React from "react";

import {
  TasksSidebar,
  TasksSidebarContent,
  TasksSidebarGroup,
  TasksSidebarGroupContent,
  TasksSidebarGroupLabel,
  TasksSidebarHeader,
  TasksSidebarMenu,
  TasksSidebarMenuButton,
  TasksSidebarMenuItem,
  TasksSidebarRail,
} from "./tasksSidebar";

// This is sample data.
const data = {
  versions: ["1.0.1", "1.1.0-alpha", "2.0.0-beta1"],
  navMain: [
    {
      title: "Getting Started",
      url: "#",
      items: [
        {
          title: "Installation",
          url: "#",
        },
        {
          title: "Project Structure",
          url: "#",
        },
      ],
    },
    {
      title: "Building Your Application",
      url: "#",
      items: [
        {
          title: "Routing",
          url: "#",
        },
        {
          title: "Data Fetching",
          url: "#",
          isActive: true,
        },
        {
          title: "Rendering",
          url: "#",
        },
        {
          title: "Caching",
          url: "#",
        },
        {
          title: "Styling",
          url: "#",
        },
        {
          title: "Optimizing",
          url: "#",
        },
        {
          title: "Configuring",
          url: "#",
        },
        {
          title: "Testing",
          url: "#",
        },
        {
          title: "Authentication",
          url: "#",
        },
        {
          title: "Deploying",
          url: "#",
        },
        {
          title: "Upgrading",
          url: "#",
        },
        {
          title: "Examples",
          url: "#",
        },
      ],
    },
    {
      title: "API Reference",
      url: "#",
      items: [
        {
          title: "Components",
          url: "#",
        },
        {
          title: "File Conventions",
          url: "#",
        },
        {
          title: "Functions",
          url: "#",
        },
        {
          title: "next.config.js Options",
          url: "#",
        },
        {
          title: "CLI",
          url: "#",
        },
        {
          title: "Edge Runtime",
          url: "#",
        },
      ],
    },
    {
      title: "Architecture",
      url: "#",
      items: [
        {
          title: "Accessibility",
          url: "#",
        },
        {
          title: "Fast Refresh",
          url: "#",
        },
        {
          title: "Next.js Compiler",
          url: "#",
        },
        {
          title: "Supported Browsers",
          url: "#",
        },
        {
          title: "Turbopack",
          url: "#",
        },
      ],
    },
  ],
};

export function TaskSidebar({
  ...props
}: React.ComponentProps<typeof TasksSidebar>) {
  return (
    <TasksSidebar {...props}>
      <TasksSidebarHeader></TasksSidebarHeader>
      <TasksSidebarContent>
        {/* We create a SidebarGroup for each parent. */}
        {data.navMain.map((item) => (
          <TasksSidebarGroup key={item.title}>
            <TasksSidebarGroupLabel>{item.title}</TasksSidebarGroupLabel>
            <TasksSidebarGroupContent>
              <TasksSidebarMenu>
                {item.items.map((item) => (
                  <TasksSidebarMenuItem key={item.title}>
                    <TasksSidebarMenuButton asChild isActive={item.isActive}>
                      <a href={item.url}>{item.title}</a>
                    </TasksSidebarMenuButton>
                  </TasksSidebarMenuItem>
                ))}
              </TasksSidebarMenu>
            </TasksSidebarGroupContent>
          </TasksSidebarGroup>
        ))}
      </TasksSidebarContent>
      <TasksSidebarRail />
    </TasksSidebar>
  );
}
