/**
 * Monday.com API Utilities
 *
 * This module contains helpers for interacting with the Monday.com API.
 */

import { MondayApiResponse, MondayWorkspace } from "./types";

/**
 * Make a GraphQL request to the Monday.com API
 */
export async function mondayRequest<T>(
  apiKey: string,
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
  }

  const responseData = (await response.json()) as MondayApiResponse<T>;

  if (responseData.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(responseData.errors)}`);
  }

  return responseData.data;
}

/**
 * Test the Monday.com API connection
 */
export async function testApiConnection(apiKey: string) {
  try {
    const data = await mondayRequest<{ workspaces: MondayWorkspace[] }>(
      apiKey,
      `query { workspaces { id, name } }`,
    );
    const workspaces = data.workspaces;

    return {
      success: true,
      message: `Connected successfully. Found ${workspaces.length} workspaces.`,
      workspaces: workspaces.map((ws) => ({
        id: ws.id,
        name: ws.name,
      })),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch workspaces from Monday.com
 */
export async function getWorkspaces(apiKey: string) {
  const data = await mondayRequest<{ workspaces: MondayWorkspace[] }>(
    apiKey,
    `
    query {
      workspaces {
        id
        name
      }
    }
  `,
  );
  return data.workspaces;
}

/**
 * Fetch boards from a workspace
 */
export async function getBoards(apiKey: string, workspaceId: string) {
  const data = await mondayRequest<{
    boards: {
      id: string;
      name: string;
      description?: string;
    }[];
  }>(
    apiKey,
    `
    query GetBoards($workspaceId: ID!) {
      boards(workspace_ids: [$workspaceId], state: active) {
        id
        name
        description
      }
    }
  `,
    { workspaceId },
  );
  return data.boards;
}

/**
 * Fetch columns from a board
 */
export async function getBoardColumns(apiKey: string, boardId: string) {
  const data = await mondayRequest<{
    boards: {
      columns: {
        id: string;
        title: string;
        type: string;
        settings_str?: string;
      }[];
    }[];
  }>(
    apiKey,
    `
    query GetBoardColumns($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns {
          id
          title
          type
          settings_str
        }
      }
    }
  `,
    { boardId },
  );
  return data.boards[0]?.columns ?? [];
}

/**
 * Get the number of items in a board
 */
export async function getBoardItemCount(apiKey: string, boardId: string) {
  try {
    const data = await mondayRequest<{
      boards: {
        items_count: number;
      }[];
    }>(
      apiKey,
      `
      query GetBoardItemCount($boardId: ID!) {
        boards(ids: [$boardId]) {
          items_count
        }
      }
    `,
      { boardId },
    );

    const itemsCount = data.boards[0]?.items_count ?? 0;

    return {
      success: true,
      count: itemsCount,
      message: `Retrieved ${itemsCount} items from board ${boardId}`,
    };
  } catch (error) {
    console.error("Error getting board item count:", error);
    return {
      success: false,
      count: 0,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch items from a board with pagination
 */
export async function getBoardItems(
  apiKey: string,
  boardId: string,
  options?: {
    limit?: number;
    page?: number;
    cursor?: string;
    includeColumnValues?: boolean;
  },
) {
  const limit = options?.limit ?? 100;
  const page = options?.page ?? 1;
  const includeColumnValues = options?.includeColumnValues ?? true;

  try {
    const data = await mondayRequest<{
      boards: {
        items: {
          id: string;
          name: string;
          column_values: {
            id: string;
            text: string;
            value: string;
            type: string;
          }[];
        }[];
      }[];
    }>(
      apiKey,
      `
      query GetBoardItems($boardId: ID!, $limit: Int, $page: Int) {
        boards(ids: [$boardId]) {
          items(limit: $limit, page: $page) {
            id
            name
            ${
              includeColumnValues
                ? `column_values {
              id
              text
              value
              type
            }`
                : ""
            }
          }
        }
      }
    `,
      {
        boardId,
        limit,
        page,
      },
    );

    const items = data.boards[0]?.items ?? [];

    return {
      success: true,
      items,
      page,
      has_more: items.length === limit, // Simple heuristic, if we got limit items, there might be more
      message: `Retrieved ${items.length} items from board ${boardId}`,
    };
  } catch (error) {
    console.error("Error getting board items:", error);
    return {
      success: false,
      items: [],
      page,
      has_more: false,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch an item by ID
 */
export async function getItem(
  apiKey: string,
  itemId: string,
  includeColumnValues = true,
) {
  try {
    const data = await mondayRequest<{
      items: {
        id: string;
        name: string;
        column_values: {
          id: string;
          text: string;
          value: string;
          type: string;
        }[];
      }[];
    }>(
      apiKey,
      `
      query GetItem($itemId: ID!) {
        items(ids: [$itemId]) {
          id
          name
          ${
            includeColumnValues
              ? `column_values {
            id
            text
            value
            type
          }`
              : ""
          }
        }
      }
    `,
      { itemId },
    );

    const item = data.items[0];

    if (!item) {
      return {
        success: false,
        item: null,
        message: `Item ${itemId} not found`,
      };
    }

    return {
      success: true,
      item,
      message: `Retrieved item ${itemId}`,
    };
  } catch (error) {
    console.error("Error getting item:", error);
    return {
      success: false,
      item: null,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Fetch subitems for a parent item
 */
export async function getSubitems(
  apiKey: string,
  parentItemId: string,
  includeColumnValues = true,
) {
  try {
    const data = await mondayRequest<{
      items: {
        id: string;
        subitems: {
          id: string;
          name: string;
          column_values: {
            id: string;
            text: string;
            value: string;
            type: string;
          }[];
        }[];
      }[];
    }>(
      apiKey,
      `
      query GetSubitems($parentItemId: ID!) {
        items(ids: [$parentItemId]) {
          id
          subitems {
            id
            name
            ${
              includeColumnValues
                ? `column_values {
              id
              text
              value
              type
            }`
                : ""
            }
          }
        }
      }
    `,
      { parentItemId },
    );

    const subitems = data.items[0]?.subitems ?? [];

    return {
      success: true,
      subitems,
      message: `Retrieved ${subitems.length} subitems for item ${parentItemId}`,
    };
  } catch (error) {
    console.error("Error getting subitems:", error);
    return {
      success: false,
      subitems: [],
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a new item in a Monday.com board
 */
export async function createItem(
  apiKey: string,
  boardId: string,
  itemName: string,
  columnValues?: Record<string, unknown>,
) {
  try {
    // Format column values for Monday.com API
    const formattedColumnValues = columnValues
      ? JSON.stringify(columnValues)
      : undefined;

    const data = await mondayRequest<{
      create_item: {
        id: string;
        name: string;
      };
    }>(
      apiKey,
      `
      mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON) {
        create_item(
          board_id: $boardId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
        }
      }
    `,
      {
        boardId,
        itemName,
        columnValues: formattedColumnValues,
      },
    );

    return {
      success: true,
      item: data.create_item,
      message: `Created item ${data.create_item.id} in board ${boardId}`,
    };
  } catch (error) {
    console.error("Error creating Monday.com item:", error);
    return {
      success: false,
      item: null,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create a subitem in Monday.com
 */
export async function createSubitem(
  apiKey: string,
  parentItemId: string,
  itemName: string,
  columnValues?: Record<string, unknown>,
) {
  try {
    // Format column values for Monday.com API
    const formattedColumnValues = columnValues
      ? JSON.stringify(columnValues)
      : undefined;

    const data = await mondayRequest<{
      create_subitem: {
        id: string;
        name: string;
      };
    }>(
      apiKey,
      `
      mutation CreateSubitem($parentItemId: ID!, $itemName: String!, $columnValues: JSON) {
        create_subitem(
          parent_item_id: $parentItemId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
        }
      }
    `,
      {
        parentItemId,
        itemName,
        columnValues: formattedColumnValues,
      },
    );

    return {
      success: true,
      item: data.create_subitem,
      message: `Created subitem ${data.create_subitem.id} under parent ${parentItemId}`,
    };
  } catch (error) {
    console.error("Error creating Monday.com subitem:", error);
    return {
      success: false,
      item: null,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Update an existing item in Monday.com
 */
export async function updateItem(
  apiKey: string,
  itemId: string,
  boardId: string,
  columnValues: Record<string, unknown>,
) {
  try {
    // Format column values for Monday.com API
    const formattedColumnValues = JSON.stringify(columnValues);

    const data = await mondayRequest<{
      change_multiple_column_values: {
        id: string;
        name: string;
      };
    }>(
      apiKey,
      `
      mutation UpdateItem($itemId: ID!, $boardId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(
          item_id: $itemId,
          board_id: $boardId,
          column_values: $columnValues
        ) {
          id
          name
        }
      }
    `,
      {
        itemId,
        boardId,
        columnValues: formattedColumnValues,
      },
    );

    return {
      success: true,
      item: data.change_multiple_column_values,
      message: `Updated item ${data.change_multiple_column_values.id}`,
    };
  } catch (error) {
    console.error("Error updating Monday.com item:", error);
    return {
      success: false,
      item: null,
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Format Convex data for Monday.com API
 * This converts Convex data types to Monday.com column value formats
 */
export function formatConvexValueForMonday(
  value: unknown,
  columnType: string,
): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  switch (columnType) {
    case "text":
    case "long_text":
      return typeof value === "object" ? JSON.stringify(value) : String(value);

    case "number":
      return Number(value);

    case "date":
      if (typeof value === "number") {
        // Convert timestamp to ISO string date
        const date = new Date(value).toISOString().split("T")[0];
        return { date };
      }
      if (typeof value === "object") {
        return { date: JSON.stringify(value) };
      }
      return { date: String(value) };

    case "checkbox":
      return { checked: Boolean(value) };

    case "status":
    case "dropdown":
      if (typeof value === "object") {
        return { label: JSON.stringify(value) };
      }
      return { label: String(value) };

    case "people":
      // Expects an array of user IDs
      if (Array.isArray(value)) {
        return { personsAndTeams: value.map(String) };
      }
      if (typeof value === "object") {
        return { personsAndTeams: [JSON.stringify(value)] };
      }
      return { personsAndTeams: [String(value)] };

    default:
      // For unknown types, return as string
      return typeof value === "object" ? JSON.stringify(value) : String(value);
  }
}
