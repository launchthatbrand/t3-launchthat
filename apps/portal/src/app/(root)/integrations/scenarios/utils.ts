import { toast } from "sonner";

import { App, FormValues, SupportedApp } from "./types";

// Custom type for a scenario ID
export type ScenarioId = string;

/**
 * Parse the node type to extract the app name
 * @param nodeType - Node type string (e.g., "wordpress_trigger")
 * @returns The app name (e.g., "wordpress")
 */
export function parseAppNameFromNodeType(nodeType: string): string {
  const appMatch = /^([^_]+)_/.exec(nodeType);
  return appMatch?.[1] ?? "";
}

/**
 * Find the app ID from the app name
 * @param appName - The app name to search for
 * @param apps - The list of available apps
 * @returns The app ID if found, or an empty string
 */
export function findAppIdByName(appName: string, apps: App[]): string {
  const appInfo = apps.find(
    (a) => a.name.toLowerCase() === appName.toLowerCase(),
  );
  return appInfo?._id ?? "";
}

/**
 * Prepare scenario nodes for saving
 * @param values - Form values
 * @param apps - Available apps
 * @param scenarioId - ID of the scenario
 * @returns Prepared nodes for saving with detailed error handling
 */
export function prepareNodesForSaving(
  values: FormValues,
  apps: App[],
  scenarioId: ScenarioId,
) {
  console.log("Preparing nodes for saving...");

  const nodes = values.nodes
    .map((node, index) => {
      const order = index + 1;

      if (!node.app || !node.connectionId || !node.action) {
        console.warn("Skipping node with missing required fields:", node);
        return null;
      }

      // Find app using the ID directly
      const selectedApp = apps.find((a) => a._id === node.app);
      if (!selectedApp) {
        console.error(
          `App not found for ID: "${node.app}". Available apps: ${JSON.stringify(
            apps.map((a) => ({ id: a._id, name: a.name })),
          )}`,
        );
        toast.error(
          `App not found. Please select a valid app from the dropdown.`,
        );
        return null;
      }

      // Get app name for use in node configuration
      const appName = selectedApp.name;
      const appNameLower = selectedApp.name.toLowerCase() as SupportedApp;

      // Create node config
      const nodeConfig = {
        connectionId: node.connectionId ?? "",
        action: node.action ?? "",
        config: node.config ?? {},
      };

      // Determine node type
      const nodeType = `${appNameLower}_${node.type === "trigger" ? "trigger" : "action"}`;

      // Check if it's an existing node or a new one
      const isExistingNode = node.id.startsWith("nod_");

      try {
        const configString = JSON.stringify(nodeConfig);

        return {
          id: isExistingNode ? node.id : undefined,
          scenarioId,
          type: nodeType,
          label: `${appName}: ${node.action}`,
          config: configString,
          position: JSON.stringify({ x: 100, y: 100 * order }),
          order,
          isExistingNode,
        };
      } catch (error) {
        console.error("Error preparing node:", error);
        return null;
      }
    })
    .filter(Boolean);

  return nodes;
}

/**
 * Validates the form values before submission
 * @param values Form values to validate
 * @returns True if valid, false otherwise
 */
export function validateScenarioForm(values: FormValues): boolean {
  // Check if we have at least one valid node
  if (
    !values.nodes.length ||
    !values.nodes[0]?.app ||
    !values.nodes[0]?.connectionId ||
    !values.nodes[0]?.action
  ) {
    console.error("Missing required node configuration");
    toast.error("Please configure at least the trigger node properly");
    return false;
  }

  return true;
}

/**
 * Test a node and retrieve sample data
 * This function would typically call an API endpoint to execute the node against its connection
 * @param nodeId The ID of the node to test
 * @param connectionId The connection ID to use
 * @param action The action to perform
 * @param appName The name of the app
 * @returns Promise with the sample data from the first record
 */
export async function testNode(
  nodeId: string,
  connectionId: string,
  action: string,
  appName: string,
): Promise<{
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
}> {
  try {
    console.log(
      `Testing node ${nodeId} with action ${action} on app ${appName}`,
    );

    // Configure request parameters based on app type and action
    let endpoint = "";
    let method = "GET";
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    let body: string | undefined;

    // Set up endpoint and method based on app type
    const appType = appName.toLowerCase();

    if (appType === "wordpress") {
      // For WordPress, use the WordPress REST API
      if (action === "wp_get_users") {
        endpoint = "https://demo.wp-api.org/wp-json/wp/v2/users";
        method = "GET";
      } else if (action === "wp_get_posts") {
        endpoint =
          "https://demo.wp-api.org/wp-json/wp/v2/posts?_embed=true&per_page=1";
        method = "GET";
      }
    } else if (appType === "monday") {
      // For Monday.com, use their GraphQL API
      endpoint = "https://jsonplaceholder.typicode.com/users/1"; // Fallback for demo
      method = "GET";

      if (action === "monday_get_boards") {
        // In a real implementation, this would use the Monday API with proper auth
        endpoint = "https://jsonplaceholder.typicode.com/users/1";
        method = "GET";
      } else if (action === "monday_get_items") {
        endpoint = "https://jsonplaceholder.typicode.com/todos/1";
        method = "GET";
      }
    } else if (appType === "vimeo") {
      // For Vimeo, we will call our own Next.js API proxy that requires the connection id
      if (action === "vimeo_get_videos") {
        endpoint = `/api/integrations/vimeo/list-videos?connectionId=${connectionId}`;
        method = "GET";
      }
    } else if (appType === "calendar") {
      // For calendar endpoints
      if (action === "calendar_event_created") {
        endpoint = "https://jsonplaceholder.typicode.com/users/1";
        method = "GET";
      }
    } else if (appType === "webhook") {
      if (action === "webhook_receive") {
        endpoint = "https://jsonplaceholder.typicode.com/posts/1";
        method = "GET";
      }
    } else if (appType === "traderlaunchpad") {
      // Internal app – endpoints are within our own Next.js backend
      if (action === "tl_get_posts") {
        endpoint = "/api/traderlaunchpad/get-posts";
        method = "GET";
      } else if (action === "tl_create_media") {
        endpoint = "/api/traderlaunchpad/create-media";
        method = "POST";
        body = JSON.stringify({ demo: true });
        headers["Content-Type"] = "application/json";
      }
    }

    // If no specific endpoint is configured, use a placeholder
    if (!endpoint) {
      endpoint = "https://jsonplaceholder.typicode.com/users/1";
    }

    // Store request information
    const requestInfo = {
      endpoint,
      method,
      headers,
    };

    // Make the actual HTTP request
    console.log(`Making ${method} request to ${endpoint}`);
    const startTime = Date.now();

    const fetchOptions: RequestInit = {
      method,
      headers,
      ...(body
        ? { body: typeof body === "string" ? body : JSON.stringify(body) }
        : {}),
    };

    // Try to fetch the data, but handle CORS errors gracefully
    let response;
    let responseData;
    let responseInfo;

    try {
      response = await fetch(endpoint, fetchOptions);
      const endTime = Date.now();
      const requestDuration = endTime - startTime;

      // Process the response
      responseData = (await response.json()) as Record<string, unknown>;

      // Store response information
      responseInfo = {
        statusCode: response.status,
        statusText: response.statusText,
        timing: requestDuration,
      };
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);

      // Provide mock data when fetch fails (likely due to CORS)
      return provideMockData(appType, action, endpoint, method, headers);
    }

    // Extract schema from the response
    const schema = Object.keys(
      Array.isArray(responseData) && responseData.length > 0
        ? (responseData[0] as Record<string, unknown>)
        : responseData,
    );

    // Return the result
    return {
      data:
        Array.isArray(responseData) && responseData.length > 0
          ? (responseData[0] as Record<string, unknown>)
          : responseData,
      schema,
      requestInfo,
      responseInfo,
      error: response.ok
        ? undefined
        : `API returned error status: ${response.status} ${response.statusText}`,
    };
  } catch (error) {
    console.error("Error testing node:", error);

    // Final fallback - return error with mock data
    const appType = appName.toLowerCase();
    const mockResponse = getMockData(appType, action);

    return {
      data: mockResponse,
      schema: mockResponse ? Object.keys(mockResponse) : [],
      error:
        error instanceof Error
          ? `Connection failed: ${error.message}`
          : "Unknown error testing node",
    };
  }
}

/**
 * Helper function to provide mock data when fetch fails
 */
function provideMockData(
  appType: string,
  action: string,
  endpoint: string,
  method: string,
  headers: Record<string, string>,
): {
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
} {
  // Get mock data based on app type and action
  const mockData = getMockData(appType, action);

  // Return mock response with request info and error explanation
  return {
    data: mockData,
    schema: mockData ? Object.keys(mockData) : [],
    requestInfo: {
      endpoint,
      method,
      headers,
    },
    responseInfo: {
      statusCode: 200,
      statusText: "OK (Simulated)",
      timing: 123, // Fake timing
    },
    error:
      "CORS or network error - showing simulated data. In production, API calls should be proxied through your backend.",
  };
}

/**
 * Get mock data based on app type and action
 */
function getMockData(
  appType: string,
  action: string,
): Record<string, unknown> | null {
  if (appType === "wordpress") {
    if (action === "wp_get_users") {
      return {
        id: 1,
        name: "John Doe",
        email: "john@example.com",
        username: "johndoe",
        role: "administrator",
        registered_date: "2023-01-15T08:30:00",
        url: "https://example.com/author/johndoe",
        avatar_url: "https://secure.gravatar.com/avatar/...",
        posts_count: 24,
        meta: {
          last_login: "2023-06-10T14:22:00",
          location: "New York",
        },
      };
    } else if (action === "wp_get_posts") {
      return {
        id: 42,
        date: "2023-05-15T10:00:00",
        title: {
          rendered: "Sample Blog Post",
        },
        content: {
          rendered: "<p>This is a sample blog post content.</p>",
        },
        excerpt: {
          rendered: "<p>This is a sample excerpt...</p>",
        },
        author: 1,
        featured_media: 123,
        categories: [4, 7],
        tags: [12, 15, 18],
        status: "publish",
        comment_status: "open",
        meta: {
          views: 1542,
          reading_time: "5 min",
        },
      };
    }
  } else if (appType === "monday") {
    if (action === "monday_get_boards") {
      return {
        id: "123456789",
        name: "Marketing Projects",
        description: "All marketing team projects",
        columns: [
          { id: "status", title: "Status", type: "status" },
          { id: "date", title: "Due Date", type: "date" },
          { id: "owner", title: "Owner", type: "person" },
        ],
        groups: [
          { id: "group1", title: "In Progress" },
          { id: "group2", title: "Done" },
        ],
        board_kind: "public",
        created_at: "2023-01-10T08:30:00Z",
      };
    } else if (action === "monday_get_items") {
      return {
        id: "987654321",
        name: "Website Redesign",
        board_id: "123456789",
        group_id: "group1",
        created_at: "2023-02-15T09:45:00Z",
        updated_at: "2023-03-20T14:30:00Z",
        column_values: {
          status: { value: "Working on it", text: "Working on it" },
          date: { value: "2023-06-30", text: "30 Jun 2023" },
          owner: { value: { id: 12345, name: "Jane Smith" } },
        },
      };
    }
  } else if (appType === "vimeo") {
    if (action === "vimeo_get_videos") {
      return {
        id: "vimeo_12345",
        name: "Sample Videos",
        description: "A collection of sample videos",
        videos: [
          { id: "v_1", name: "Sample Video 1", url: "https://example.com/v_1" },
          { id: "v_2", name: "Sample Video 2", url: "https://example.com/v_2" },
        ],
      };
    }
  } else if (appType === "calendar") {
    if (action === "calendar_event_created") {
      return {
        id: "ev_123456789",
        title: "Team Meeting",
        description: "Weekly team sync meeting",
        start_time: "2023-06-20T10:00:00Z",
        end_time: "2023-06-20T11:00:00Z",
        location: "Conference Room A",
        attendees: [
          { id: "user_1", name: "John Doe", response: "accepted" },
          { id: "user_2", name: "Jane Smith", response: "tentative" },
        ],
        calendar_id: "cal_primary",
        recurrence: "weekly",
        created_by: "user_1",
        created_at: "2023-06-15T08:30:00Z",
      };
    }
  } else if (appType === "webhook") {
    if (action === "webhook_receive") {
      return {
        id: "wh_12345",
        event_type: "contact_form_submission",
        timestamp: "2023-06-20T15:42:00Z",
        data: {
          name: "Alice Johnson",
          email: "alice@example.com",
          message: "I'm interested in your services",
          page: "/contact",
          utm_source: "google",
          utm_medium: "cpc",
        },
        source_ip: "192.168.1.1",
        headers: {
          "user-agent": "Mozilla/5.0...",
          "content-type": "application/json",
        },
      };
    }
  } else if (appType === "traderlaunchpad") {
    if (action === "tl_get_posts") {
      return {
        id: "post_1",
        title: "Sample Trader Post",
        content: "This is a post from TraderLaunchpad",
      };
    } else if (action === "tl_create_media") {
      return {
        mediaId: "media_1",
        status: "created",
      };
    }
  }

  // Default mock data if no specific match
  return {
    id: 1,
    name: "Sample Data",
    type: "default",
    timestamp: new Date().toISOString(),
    note: "This is simulated data as no specific mock was found for this action",
  };
}

/**
 * Fallback function that returns mock data when the Convex action fails
 * This is a simplified version of the previous client-side function,
 * now used as a backup only
 */
export function getNodeMockData(
  nodeId: string,
  connectionId: string,
  action: string,
  appName: string,
): Promise<{
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
}> {
  return new Promise((resolve) => {
    try {
      console.log(
        `Generating mock data for node ${nodeId} with action ${action} on app ${appName}`,
      );

      // Set up mock endpoint info based on app type
      const appType = appName.toLowerCase();
      let endpoint = "";
      const method = "GET";

      if (appType === "wordpress") {
        // For WordPress, use the WordPress REST API
        if (action === "wp_get_users") {
          endpoint = "https://demo.wp-api.org/wp-json/wp/v2/users";
        } else if (action === "wp_get_posts") {
          endpoint =
            "https://demo.wp-api.org/wp-json/wp/v2/posts?_embed=true&per_page=1";
        }
      } else if (appType === "monday") {
        endpoint = "https://api.monday.com/v2";
      } else if (appType === "calendar") {
        endpoint = "https://api.calendar.example/v1/events";
      } else if (appType === "webhook") {
        endpoint = "https://api.webhook.example/receive";
      }

      // If no specific endpoint is configured, use a placeholder
      if (!endpoint) {
        endpoint = "https://api.example.com/endpoint";
      }

      // Get mock data
      const mockData = getMockData(appType, action);
      const schema = mockData ? Object.keys(mockData) : [];

      resolve({
        data: mockData,
        schema,
        requestInfo: {
          endpoint,
          method,
          headers: { "Content-Type": "application/json" },
        },
        responseInfo: {
          statusCode: 200,
          statusText: "OK (Simulated)",
          timing: 123, // Fake timing
        },
        error:
          "Fallback mock data is being shown because the backend API call failed.",
      });
    } catch (error) {
      console.error("Error generating mock data:", error);
      resolve({
        data: null,
        schema: [],
        error: "Failed to generate mock data",
      });
    }
  });
}
