import { z } from "zod";

import type {
  ConnectionDefinition,
  IntegrationNodeDefinition,
  NodeExecutionContext,
  NodeExecutionResult,
} from "@acme/integration-sdk";

// ==================== SCHEMAS ====================

export const MondayInputSchema = z.object({
  action: z.enum([
    "create_item",
    "update_item",
    "get_items",
    "create_update",
    "get_boards",
    "get_board",
    "update_column_value",
  ]),
  // Board operations
  boardId: z.string().optional(),
  // Item operations
  itemData: z
    .object({
      name: z.string().min(1, "Item name is required"),
      columnValues: z.record(z.string(), z.any()).optional(),
      groupId: z.string().optional(),
    })
    .optional(),
  itemId: z.string().optional(),
  // Update operations
  updateData: z
    .object({
      body: z.string().min(1, "Update body is required"),
    })
    .optional(),
  // Column value operations
  columnId: z.string().optional(),
  columnValue: z.any().optional(),
  // Query options
  query: z
    .object({
      limit: z.number().max(500).default(25),
      page: z.number().default(1),
      ids: z.array(z.string()).optional(),
    })
    .optional(),
});

export const MondayOutputSchema = z.object({
  success: z.boolean(),
  data: z
    .object({
      item: z
        .object({
          id: z.string(),
          name: z.string(),
          board: z.object({
            id: z.string(),
            name: z.string(),
          }),
          group: z
            .object({
              id: z.string(),
              title: z.string(),
            })
            .optional(),
          column_values: z
            .array(
              z.object({
                id: z.string(),
                title: z.string(),
                text: z.string(),
                value: z.any(),
              }),
            )
            .optional(),
          created_at: z.string(),
          updated_at: z.string(),
        })
        .optional(),
      items: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            board: z.object({
              id: z.string(),
              name: z.string(),
            }),
            created_at: z.string(),
            updated_at: z.string(),
          }),
        )
        .optional(),
      update: z
        .object({
          id: z.string(),
          body: z.string(),
          created_at: z.string(),
          creator: z.object({
            id: z.string(),
            name: z.string(),
          }),
        })
        .optional(),
      board: z
        .object({
          id: z.string(),
          name: z.string(),
          description: z.string().optional(),
          items_count: z.number().optional(),
          groups: z
            .array(
              z.object({
                id: z.string(),
                title: z.string(),
                color: z.string(),
              }),
            )
            .optional(),
          columns: z
            .array(
              z.object({
                id: z.string(),
                title: z.string(),
                type: z.string(),
              }),
            )
            .optional(),
        })
        .optional(),
      boards: z
        .array(
          z.object({
            id: z.string(),
            name: z.string(),
            description: z.string().optional(),
            items_count: z.number().optional(),
          }),
        )
        .optional(),
    })
    .optional(),
  error: z.string().optional(),
});

// ==================== CONNECTION DEFINITION ====================

export const MondayConnectionDefinition: ConnectionDefinition = {
  id: "monday",
  name: "Monday.com",
  type: "api_key",
  authSchema: z.object({
    apiToken: z.string().min(1, "API token is required"),
  }),

  async testConnection(auth) {
    try {
      const authData = auth as { apiToken: string };

      const response = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authData.apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: "query { me { id name email } }",
        }),
      });

      if (!response.ok) {
        return false;
      }

      const result = await response.json();
      return !result.errors && result.data?.me;
    } catch {
      return false;
    }
  },
};

// ==================== MONDAY.COM NODE FUNCTIONS ====================

async function makeMondayRequest(
  auth: { apiToken: string },
  query: string,
  variables?: Record<string, any>,
): Promise<any> {
  const response = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${auth.apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Monday.com API error (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(
      `Monday.com GraphQL error: ${result.errors.map((e: any) => e.message).join(", ")}`,
    );
  }

  return result.data;
}

async function createItem(
  auth: { apiToken: string },
  boardId: string,
  itemData: any,
): Promise<NodeExecutionResult> {
  const query = `
    mutation ($boardId: ID!, $itemName: String!, $columnValues: JSON, $groupId: String) {
      create_item (
        board_id: $boardId,
        item_name: $itemName,
        column_values: $columnValues,
        group_id: $groupId
      ) {
        id
        name
        board {
          id
          name
        }
        group {
          id
          title
        }
        column_values {
          id
          title
          text
          value
        }
        created_at
        updated_at
      }
    }
  `;

  const variables = {
    boardId,
    itemName: itemData.name,
    columnValues: itemData.columnValues
      ? JSON.stringify(itemData.columnValues)
      : undefined,
    groupId: itemData.groupId,
  };

  const data = await makeMondayRequest(auth, query, variables);

  return {
    success: true,
    data: {
      item: data.create_item,
    },
    logs: [
      `Created Monday.com item: ${data.create_item.name}`,
      `Item ID: ${data.create_item.id}`,
      `Board: ${data.create_item.board.name}`,
    ],
  };
}

async function updateItem(
  auth: { apiToken: string },
  itemId: string,
  itemData: any,
): Promise<NodeExecutionResult> {
  const query = `
    mutation ($itemId: ID!, $columnValues: JSON) {
      change_multiple_column_values (
        item_id: $itemId,
        board_id: null,
        column_values: $columnValues
      ) {
        id
        name
        board {
          id
          name
        }
        column_values {
          id
          title
          text
          value
        }
        updated_at
      }
    }
  `;

  const variables = {
    itemId,
    columnValues: JSON.stringify(itemData.columnValues || {}),
  };

  const data = await makeMondayRequest(auth, query, variables);

  return {
    success: true,
    data: {
      item: data.change_multiple_column_values,
    },
    logs: [
      `Updated Monday.com item: ${data.change_multiple_column_values.name}`,
      `Item ID: ${data.change_multiple_column_values.id}`,
    ],
  };
}

async function getItems(
  auth: { apiToken: string },
  boardId?: string,
  queryParams?: any,
): Promise<NodeExecutionResult> {
  let query: string;
  let variables: Record<string, any> = {};

  if (boardId) {
    query = `
      query ($boardId: [ID!], $limit: Int, $page: Int) {
        boards (ids: $boardId, limit: $limit, page: $page) {
          items_page (limit: $limit) {
            cursor
            items {
              id
              name
              board {
                id
                name
              }
              created_at
              updated_at
            }
          }
        }
      }
    `;
    variables = {
      boardId: [boardId],
      limit: queryParams?.limit || 25,
      page: queryParams?.page || 1,
    };
  } else {
    query = `
      query ($itemIds: [ID!]) {
        items (ids: $itemIds) {
          id
          name
          board {
            id
            name
          }
          created_at
          updated_at
        }
      }
    `;
    variables = {
      itemIds: queryParams?.ids || [],
    };
  }

  const data = await makeMondayRequest(auth, query, variables);

  let items: any[] = [];
  if (data.boards && data.boards[0]) {
    items = data.boards[0].items_page.items;
  } else if (data.items) {
    items = data.items;
  }

  return {
    success: true,
    data: {
      items,
    },
    logs: [
      `Retrieved ${items.length} Monday.com items`,
      boardId
        ? `From board: ${boardId}`
        : `From item IDs: ${queryParams?.ids?.join(", ") || "none"}`,
    ].filter(Boolean),
  };
}

async function createUpdate(
  auth: { apiToken: string },
  itemId: string,
  updateData: any,
): Promise<NodeExecutionResult> {
  const query = `
    mutation ($itemId: ID!, $body: String!) {
      create_update (
        item_id: $itemId,
        body: $body
      ) {
        id
        body
        created_at
        creator {
          id
          name
        }
      }
    }
  `;

  const variables = {
    itemId,
    body: updateData.body,
  };

  const data = await makeMondayRequest(auth, query, variables);

  return {
    success: true,
    data: {
      update: data.create_update,
    },
    logs: [
      `Created Monday.com update for item: ${itemId}`,
      `Update ID: ${data.create_update.id}`,
    ],
  };
}

async function getBoards(
  auth: { apiToken: string },
  queryParams?: any,
): Promise<NodeExecutionResult> {
  const query = `
    query ($limit: Int) {
      boards (limit: $limit, order_by: created_at) {
        id
        name
        description
        items_count
      }
    }
  `;

  const variables = {
    limit: queryParams?.limit || 50,
  };

  const data = await makeMondayRequest(auth, query, variables);

  return {
    success: true,
    data: {
      boards: data.boards,
    },
    logs: [`Retrieved ${data.boards.length} Monday.com boards`],
  };
}

async function getBoard(
  auth: { apiToken: string },
  boardId: string,
): Promise<NodeExecutionResult> {
  const query = `
    query ($boardId: [ID!]) {
      boards (ids: $boardId) {
        id
        name
        description
        items_count
        groups {
          id
          title
          color
        }
        columns {
          id
          title
          type
        }
      }
    }
  `;

  const variables = {
    boardId: [boardId],
  };

  const data = await makeMondayRequest(auth, query, variables);

  return {
    success: true,
    data: {
      board: data.boards[0],
    },
    logs: [
      `Retrieved Monday.com board: ${data.boards[0]?.name || boardId}`,
      `Board ID: ${boardId}`,
    ],
  };
}

async function updateColumnValue(
  auth: { apiToken: string },
  itemId: string,
  columnId: string,
  columnValue: any,
): Promise<NodeExecutionResult> {
  const query = `
    mutation ($itemId: ID!, $columnId: String!, $value: JSON!) {
      change_column_value (
        item_id: $itemId,
        column_id: $columnId,
        value: $value
      ) {
        id
        name
        column_values {
          id
          title
          text
          value
        }
      }
    }
  `;

  const variables = {
    itemId,
    columnId,
    value: JSON.stringify(columnValue),
  };

  const data = await makeMondayRequest(auth, query, variables);

  return {
    success: true,
    data: {
      item: data.change_column_value,
    },
    logs: [
      `Updated Monday.com column value for item: ${data.change_column_value.name}`,
      `Column ID: ${columnId}`,
      `Item ID: ${itemId}`,
    ],
  };
}

// ==================== NODE DEFINITION ====================

export const MondayNodeDefinition: IntegrationNodeDefinition = {
  metadata: {
    id: "external.monday",
    name: "Monday.com",
    description:
      "Interact with Monday.com workspace - manage boards, items, updates, and column values",
    type: "external",
    category: "project-management",
    version: "1.0.0",
    icon: "Calendar",
    color: "#FF3D57",
  },

  configSchema: {
    input: z.object({
      action: z.enum([
        "create_item",
        "update_item",
        "get_items",
        "create_update",
        "get_boards",
        "get_board",
        "update_column_value",
      ]),
      boardId: z.string().optional(),
      itemData: z
        .object({
          name: z.string().min(1, "Item name is required"),
          columnValues: z.record(z.string(), z.any()).optional(),
          groupId: z.string().optional(),
        })
        .optional(),
      itemId: z.string().optional(),
      updateData: z
        .object({
          body: z.string().min(1, "Update body is required"),
        })
        .optional(),
      columnId: z.string().optional(),
      columnValue: z.any().optional(),
      query: z
        .object({
          limit: z.number().max(500).default(25),
          page: z.number().default(1),
          ids: z.array(z.string()).optional(),
        })
        .optional(),
    }),
    output: z.object({
      success: z.boolean(),
      data: z
        .object({
          item: z.any().optional(),
          items: z.array(z.any()).optional(),
          update: z.any().optional(),
          board: z.any().optional(),
          boards: z.array(z.any()).optional(),
        })
        .optional(),
      error: z.string().optional(),
    }),
    settings: z.object({
      defaultBoardId: z.string().optional(),
      defaultGroupId: z.string().optional(),
      includeColumnValues: z.boolean().default(false),
    }),
  },

  connections: [MondayConnectionDefinition],

  execute: async (
    context: NodeExecutionContext,
  ): Promise<NodeExecutionResult> => {
    try {
      const input = MondayInputSchema.parse(context.inputData);
      const connection = MondayConnectionDefinition.authSchema.parse(
        context.connections.monday,
      );

      const {
        action,
        boardId,
        itemData,
        itemId,
        updateData,
        columnId,
        columnValue,
        query,
      } = input;
      const auth = { apiToken: connection.apiToken };

      switch (action) {
        case "create_item":
          if (!boardId || !itemData) {
            throw new Error(
              "Board ID and item data are required for creating an item",
            );
          }
          return await createItem(auth, boardId, itemData);

        case "update_item":
          if (!itemId || !itemData?.columnValues) {
            throw new Error(
              "Item ID and column values are required for updating an item",
            );
          }
          return await updateItem(auth, itemId, itemData);

        case "get_items":
          return await getItems(auth, boardId, query);

        case "create_update":
          if (!itemId || !updateData) {
            throw new Error(
              "Item ID and update data are required for creating an update",
            );
          }
          return await createUpdate(auth, itemId, updateData);

        case "get_boards":
          return await getBoards(auth, query);

        case "get_board":
          if (!boardId) {
            throw new Error("Board ID is required for getting a board");
          }
          return await getBoard(auth, boardId);

        case "update_column_value":
          if (!itemId || !columnId || columnValue === undefined) {
            throw new Error(
              "Item ID, column ID, and column value are required for updating a column value",
            );
          }
          return await updateColumnValue(auth, itemId, columnId, columnValue);

        default:
          throw new Error(`Unsupported action: ${action}`);
      }
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
        logs: [
          `Monday.com operation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        ],
      };
    }
  },

  async validate(settings: unknown): Promise<boolean> {
    try {
      MondayInputSchema.parse(settings);
      return true;
    } catch {
      return false;
    }
  },
};
