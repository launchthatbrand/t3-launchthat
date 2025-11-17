// This file is generated automatically. Do not edit.
/* eslint-disable */
import type { AdminConfig } from "@/convexadmin/types";

export const config: AdminConfig = {
  collections: {
    todos: {
      label: "Todos",
      pluralLabel: "Todos",
      fields: {
        text: {
          label: "Text",
          type: "string",
        },
        isCompleted: {
          label: "Is Completed",
          type: "boolean",
        },
        createdAt: {
          label: "Created At",
          type: "number",
        },
        updatedAt: {
          label: "Updated At",
          type: "number",
        },
      },
    },
    posts: {
      label: "Posts",
      pluralLabel: "Posts",
      fields: {
        title: {
          label: "Title",
          type: "string",
        },
        description: {
          label: "Description",
          type: "string",
        },
      },
    },
    plugins: {
      label: "Plugins",
      pluralLabel: "Plugins",
      fields: {
        title: {
          label: "Title",
          type: "string",
        },
        description: {
          label: "Description",
          type: "string",
        },
      },
    },
    puckPages: {
      label: "Puck Pages",
      pluralLabel: "Puck Pages",
      fields: {
        identifier: {
          label: "Identifier",
          type: "string",
        },
        puckData: {
          label: "Puck Data",
          type: "unknown",
        },
      },
    },
  },
};
