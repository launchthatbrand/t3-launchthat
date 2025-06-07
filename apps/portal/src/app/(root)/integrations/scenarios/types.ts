import { z } from "zod";

// Define a simplified Doc interface
export interface DocBase {
  _id: string;
  _creationTime: number;
  name?: string;
  [key: string]: unknown;
}

// Define specific document types with required properties
export interface App extends DocBase {
  name: string;
  type: string;
  description?: string;
  isDisabled?: boolean;
}

export interface Connection extends DocBase {
  name: string;
  appId: string;
  config?: Record<string, unknown>;
  userId?: string;
}

// Define supported app types
export type SupportedApp = "wordpress" | "monday" | "calendar" | "webhook";

// Define node types
export type NodeType = "trigger" | "action" | "transformation";

// Node configuration schema
export const nodeSchema = z.object({
  id: z.string(), // Client-side ID for form handling
  type: z.enum(["trigger", "action", "transformation"]),
  app: z.string().min(1, "Please select an app"),
  connectionId: z.string().optional(),
  action: z.string().optional(),
  config: z.record(z.string(), z.string()).optional(),
  isExpanded: z.boolean().optional(),
  // Add fields for sample data and schema
  sampleData: z.record(z.string(), z.unknown()).optional(),
  schema: z.array(z.string()).optional(),
});

// Main form schema
export const formSchema = z.object({
  name: z.string().min(3, {
    message: "Scenario name must be at least 3 characters.",
  }),
  nodes: z.array(nodeSchema),
});

export type FormValues = z.infer<typeof formSchema>;

// Sample data structure
export interface NodeSampleData {
  data: Record<string, unknown> | null;
  schema: string[];
}

// Action definition interface
export interface ActionDefinition {
  id: string;
  name: string;
  type: NodeType;
  description: string;
}

// A map of app types to their available actions
export const appActions: Record<SupportedApp, ActionDefinition[]> = {
  wordpress: [
    {
      id: "wp_get_posts",
      name: "Get Posts",
      type: "trigger",
      description: "Retrieve posts from WordPress",
    },
    {
      id: "wp_get_users",
      name: "Get Users",
      type: "trigger",
      description: "Retrieve users from WordPress",
    },
    {
      id: "wp_create_post",
      name: "Create Post",
      type: "action",
      description: "Create a new post in WordPress",
    },
    {
      id: "wp_update_post",
      name: "Update Post",
      type: "action",
      description: "Update an existing post in WordPress",
    },
  ],
  monday: [
    {
      id: "monday_get_boards",
      name: "Get Boards",
      type: "trigger",
      description: "Retrieve boards from Monday",
    },
    {
      id: "monday_get_items",
      name: "Get Items",
      type: "trigger",
      description: "Retrieve items from a Monday board",
    },
    {
      id: "monday_create_item",
      name: "Create Item",
      type: "action",
      description: "Create a new item in Monday",
    },
    {
      id: "monday_update_item",
      name: "Update Item",
      type: "action",
      description: "Update an existing item in Monday",
    },
  ],
  calendar: [
    {
      id: "calendar_event_created",
      name: "Event Created",
      type: "trigger",
      description: "Triggered when a new event is created",
    },
    {
      id: "calendar_event_updated",
      name: "Event Updated",
      type: "trigger",
      description: "Triggered when an event is updated",
    },
    {
      id: "calendar_create_event",
      name: "Create Event",
      type: "action",
      description: "Create a new calendar event",
    },
  ],
  webhook: [
    {
      id: "webhook_receive",
      name: "Receive Webhook",
      type: "trigger",
      description: "Receive data from an external webhook",
    },
    {
      id: "webhook_send",
      name: "Send Webhook",
      type: "action",
      description: "Send data to an external webhook",
    },
  ],
};

/**
 * Type definition for the result of a node test
 */
export interface NodeTestResult {
  data: Record<string, unknown> | null;
  schema: string[];
  requestInfo?: {
    endpoint: string;
    method: string;
    headers?: Record<string, string>;
  };
  responseInfo?: {
    statusCode: number;
    statusText: string;
    timing: number;
  };
  error?: string;
  isProxied: boolean;
}
