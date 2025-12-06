import type { PluginDefinition } from "launchthat-plugin-core";

export const tasksPlugin: PluginDefinition = {
  id: "tasks",
  name: "Tasks",
  description: "Kanban boards, calendars, and table views for internal tasks.",
  longDescription:
    "Adds lightweight task management surfaces including a sortable table, kanban board, and calendar views powered by Convex.",
  features: [
    "Task table with drag-and-drop ordering",
    "Board-specific kanban and calendar screens",
    "Dialog and drawer-based task authoring flows",
  ],
  activation: {
    optionKey: "plugin_tasks_enabled",
    optionType: "site",
    defaultEnabled: false,
  },
  postTypes: [],
  adminMenus: [
    {
      label: "Tasks",
      slug: "tasks",
      icon: "ListTodo",
      group: "tasks",
      position: 60,
    },
    {
      label: "Task Boards",
      slug: "tasks/kaban",
      icon: "Kanban",
      group: "tasks",
      position: 61,
    },
    {
      label: "Task Calendar",
      slug: "tasks/calendar",
      icon: "Calendar",
      group: "tasks",
      position: 62,
    },
  ],
};

export default tasksPlugin;

export * from "./components";
export * from "./screens";
export * from "./api/tasks";
export * from "./context/TasksClientProvider";
