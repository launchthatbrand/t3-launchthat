/**
 * Monday.com API Client
 *
 * A client for interacting with Monday.com's GraphQL API, handling authentication,
 * rate limiting, pagination, and common operations.
 */

// Define types for Monday.com API responses
export interface MondayWorkspace {
  id: string;
  name: string;
}

export interface MondayBoard {
  id: string;
  name: string;
  description?: string;
}

export interface MondayColumn {
  id: string;
  title: string;
  type: string;
  settings_str?: string;
}

export interface MondayItem {
  id: string;
  name: string;
  [key: string]: unknown; // For column values
}

export interface MondayUser {
  id: string;
  name: string;
  email: string;
}

// Rate limit configuration
const RATE_LIMIT = {
  MAX_REQUESTS_PER_SECOND: 10,
  BACKOFF_FACTOR: 1.5,
  INITIAL_BACKOFF_MS: 1000,
  MAX_BACKOFF_MS: 60000,
};

/**
 * Monday.com API Client
 */
export class MondayClient {
  private apiKey: string;
  private baseUrl = "https://api.monday.com/v2";
  private lastRequestTime = 0;
  private requestQueue: (() => Promise<unknown>)[] = [];
  private processingQueue = false;
  private retryCount: Record<string, number> = {};

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Send a GraphQL query to the Monday.com API
   */
  private async sendGraphQLRequest<T>(
    query: string,
    variables: Record<string, unknown> = {},
    operationName?: string,
  ): Promise<T> {
    // Create a unique ID for this request for retry tracking
    const requestId = `${operationName ?? "query"}-${Date.now()}`;

    // Queue the request
    return new Promise((resolve, reject) => {
      this.requestQueue.push(async () => {
        try {
          // Calculate time to wait for rate limiting
          const now = Date.now();
          const timeToWait = Math.max(
            0,
            1000 / RATE_LIMIT.MAX_REQUESTS_PER_SECOND -
              (now - this.lastRequestTime),
          );

          if (timeToWait > 0) {
            await new Promise((resolveTimeout) =>
              setTimeout(resolveTimeout, timeToWait),
            );
          }

          this.lastRequestTime = Date.now();

          const response = await fetch(this.baseUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: this.apiKey,
            },
            body: JSON.stringify({
              query,
              variables,
              operationName,
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`HTTP error ${response.status}: ${errorText}`);
          }

          const data = (await response.json()) as {
            data: T;
            errors?: { message: string }[];
          };

          // Check for GraphQL errors
          if (data.errors) {
            // Check if it's a rate limit error
            const isRateLimitError = data.errors.some(
              (error) =>
                error.message.includes("rate limit") || response.status === 429,
            );

            if (isRateLimitError) {
              this.retryCount[requestId] =
                (this.retryCount[requestId] ?? 0) + 1;
              const backoffTime = Math.min(
                RATE_LIMIT.INITIAL_BACKOFF_MS *
                  Math.pow(
                    RATE_LIMIT.BACKOFF_FACTOR,
                    this.retryCount[requestId],
                  ),
                RATE_LIMIT.MAX_BACKOFF_MS,
              );

              console.warn(`Rate limit exceeded. Retrying in ${backoffTime}ms`);
              await new Promise((resolveBackoff) =>
                setTimeout(resolveBackoff, backoffTime),
              );

              // Requeue the request
              this.requestQueue.unshift(async () => {
                try {
                  const result = await this.sendGraphQLRequest<T>(
                    query,
                    variables,
                    operationName,
                  );
                  resolve(result);
                } catch (error) {
                  reject(error);
                }
              });
              return;
            }

            throw new Error(`GraphQL errors: ${JSON.stringify(data.errors)}`);
          }

          // Reset retry count on success
          delete this.retryCount[requestId];

          resolve(data.data as T);
        } catch (error) {
          reject(error);
        }
      });

      // Start processing the queue if it's not already running
      if (!this.processingQueue) {
        void this.processQueue();
      }
    });
  }

  /**
   * Process the request queue sequentially
   */
  private async processQueue(): Promise<void> {
    if (this.processingQueue) return;

    this.processingQueue = true;

    while (this.requestQueue.length > 0) {
      const request = this.requestQueue.shift();
      if (request) {
        try {
          await request();
        } catch (error) {
          console.error("Error processing queued request:", error);
        }
      }
    }

    this.processingQueue = false;
  }

  /**
   * Validate the API key
   */
  async validateApiKey(): Promise<boolean> {
    try {
      const query = `
        query {
          me {
            id
            name
          }
        }
      `;

      const response = await this.sendGraphQLRequest<{ me: MondayUser }>(query);
      return !!response?.me?.id;
    } catch (error) {
      console.error("API key validation failed:", error);
      return false;
    }
  }

  /**
   * Get the current user information
   */
  async getCurrentUser(): Promise<MondayUser> {
    const query = `
      query {
        me {
          id
          name
          email
        }
      }
    `;

    const response = await this.sendGraphQLRequest<{ me: MondayUser }>(query);
    return response.me;
  }

  /**
   * Get available workspaces
   */
  async getWorkspaces(): Promise<MondayWorkspace[]> {
    const query = `
      query {
        workspaces {
          id
          name
        }
      }
    `;

    const response = await this.sendGraphQLRequest<{
      workspaces: MondayWorkspace[];
    }>(query);
    return response.workspaces;
  }

  /**
   * Get boards in a workspace
   */
  async getBoards(workspaceId: string): Promise<MondayBoard[]> {
    const query = `
      query GetBoards($workspaceId: ID!) {
        boards(workspace_ids: [$workspaceId], state: active) {
          id
          name
          description
        }
      }
    `;

    const variables = { workspaceId };

    const response = await this.sendGraphQLRequest<{ boards: MondayBoard[] }>(
      query,
      variables,
      "GetBoards",
    );

    return response.boards;
  }

  /**
   * Get columns for a board
   */
  async getBoardColumns(boardId: string): Promise<MondayColumn[]> {
    const query = `
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
    `;

    const variables = { boardId };

    const response = await this.sendGraphQLRequest<{
      boards: Array<{ columns: MondayColumn[] }>;
    }>(query, variables, "GetBoardColumns");

    return response.boards[0]?.columns || [];
  }

  /**
   * Get items from a board with pagination
   */
  async getItems(
    boardId: string,
    options: {
      limit?: number;
      page?: number;
      columns?: string[];
      ids?: string[];
    } = {},
  ): Promise<{ items: MondayItem[]; hasMore: boolean; totalItems: number }> {
    const { limit = 25, page = 1, columns = [], ids = [] } = options;

    // Calculate pagination
    const first = limit;
    const page_id = page;

    // Build columns string for the query
    const columnsString =
      columns.length > 0
        ? `, columns: [${columns.map((c) => `"${c}"`).join(", ")}]`
        : "";

    // Build item IDs filter if provided
    const idsFilter = ids.length > 0 ? `, ids: [${ids.join(", ")}]` : "";

    const query = `
      query GetItems($boardId: ID!, $first: Int!, $page: Int) {
        items_page_by_column_values(
          board_id: $boardId,
          limit: $first,
          page: $page
          ${columnsString}
          ${idsFilter}
        ) {
          items {
            id
            name
            column_values {
              id
              text
              value
            }
          }
          cursor {
            has_more
            total_items
          }
        }
      }
    `;

    const variables = { boardId, first, page: page_id };

    const response = await this.sendGraphQLRequest<{
      items_page_by_column_values: {
        items: Array<{
          id: string;
          name: string;
          column_values: Array<{
            id: string;
            text: string;
            value: string;
          }>;
        }>;
        cursor: {
          has_more: boolean;
          total_items: number;
        };
      };
    }>(query, variables, "GetItems");

    // Transform response to a more usable format
    const formattedItems = response.items_page_by_column_values.items.map(
      (item) => {
        const formattedItem: MondayItem = {
          id: item.id,
          name: item.name,
        };

        // Add column values as properties
        item.column_values.forEach((column) => {
          formattedItem[column.id] = {
            text: column.text,
            value: column.value ? JSON.parse(column.value) : null,
          };
        });

        return formattedItem;
      },
    );

    return {
      items: formattedItems,
      hasMore: response.items_page_by_column_values.cursor.has_more,
      totalItems: response.items_page_by_column_values.cursor.total_items,
    };
  }

  /**
   * Create a new item in a board
   */
  async createItem(
    boardId: string,
    itemData: {
      name: string;
      columnValues?: Record<string, unknown>;
    },
  ): Promise<MondayItem> {
    const { name, columnValues = {} } = itemData;

    // Convert column values to the format expected by Monday.com
    const columnValuesJson = JSON.stringify(columnValues);

    const query = `
      mutation CreateItem($boardId: ID!, $itemName: String!, $columnValues: JSON) {
        create_item(
          board_id: $boardId,
          item_name: $itemName,
          column_values: $columnValues
        ) {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    `;

    const variables = {
      boardId,
      itemName: name,
      columnValues: columnValuesJson,
    };

    const response = await this.sendGraphQLRequest<{
      create_item: {
        id: string;
        name: string;
        column_values: Array<{
          id: string;
          text: string;
          value: string;
        }>;
      };
    }>(query, variables, "CreateItem");

    // Transform response to a more usable format
    const item = response.create_item;
    const formattedItem: MondayItem = {
      id: item.id,
      name: item.name,
    };

    // Add column values as properties
    item.column_values.forEach((column) => {
      formattedItem[column.id] = {
        text: column.text,
        value: column.value ? JSON.parse(column.value) : null,
      };
    });

    return formattedItem;
  }

  /**
   * Update an existing item
   */
  async updateItem(
    itemId: string,
    boardId: string,
    columnValues: Record<string, unknown>,
  ): Promise<MondayItem> {
    // Convert column values to the format expected by Monday.com
    const columnValuesJson = JSON.stringify(columnValues);

    const query = `
      mutation UpdateItem($itemId: ID!, $boardId: ID!, $columnValues: JSON!) {
        change_multiple_column_values(
          item_id: $itemId,
          board_id: $boardId,
          column_values: $columnValues
        ) {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    `;

    const variables = {
      itemId,
      boardId,
      columnValues: columnValuesJson,
    };

    const response = await this.sendGraphQLRequest<{
      change_multiple_column_values: {
        id: string;
        name: string;
        column_values: Array<{
          id: string;
          text: string;
          value: string;
        }>;
      };
    }>(query, variables, "UpdateItem");

    // Transform response to a more usable format
    const item = response.change_multiple_column_values;
    const formattedItem: MondayItem = {
      id: item.id,
      name: item.name,
    };

    // Add column values as properties
    item.column_values.forEach((column) => {
      formattedItem[column.id] = {
        text: column.text,
        value: column.value ? JSON.parse(column.value) : null,
      };
    });

    return formattedItem;
  }

  /**
   * Create a subitem under a parent item
   */
  async createSubitem(
    parentItemId: string,
    boardId: string,
    itemData: {
      name: string;
      columnValues?: Record<string, unknown>;
    },
  ): Promise<MondayItem> {
    const { name, columnValues = {} } = itemData;

    // Convert column values to the format expected by Monday.com
    const columnValuesJson = JSON.stringify(columnValues);

    const query = `
      mutation CreateSubitem($parentItemId: ID!, $itemName: String!, $columnValues: JSON, $boardId: ID!) {
        create_subitem(
          parent_item_id: $parentItemId,
          item_name: $itemName,
          column_values: $columnValues,
          board_id: $boardId
        ) {
          id
          name
          column_values {
            id
            text
            value
          }
        }
      }
    `;

    const variables = {
      parentItemId,
      itemName: name,
      columnValues: columnValuesJson,
      boardId,
    };

    const response = await this.sendGraphQLRequest<{
      create_subitem: {
        id: string;
        name: string;
        column_values: Array<{
          id: string;
          text: string;
          value: string;
        }>;
      };
    }>(query, variables, "CreateSubitem");

    // Transform response to a more usable format
    const item = response.create_subitem;
    const formattedItem: MondayItem = {
      id: item.id,
      name: item.name,
    };

    // Add column values as properties
    item.column_values.forEach((column) => {
      formattedItem[column.id] = {
        text: column.text,
        value: column.value ? JSON.parse(column.value) : null,
      };
    });

    return formattedItem;
  }

  /**
   * Delete an item
   */
  async deleteItem(itemId: string): Promise<boolean> {
    const query = `
      mutation DeleteItem($itemId: ID!) {
        delete_item(item_id: $itemId) {
          id
        }
      }
    `;

    const variables = { itemId };

    try {
      await this.sendGraphQLRequest<{
        delete_item: { id: string };
      }>(query, variables, "DeleteItem");
      return true;
    } catch (error) {
      console.error("Error deleting item:", error);
      return false;
    }
  }

  /**
   * Get subitems of a parent item
   */
  async getSubitems(parentItemId: string): Promise<MondayItem[]> {
    const query = `
      query GetSubitems($parentItemId: ID!) {
        items(ids: [$parentItemId]) {
          subitems {
            id
            name
            column_values {
              id
              text
              value
            }
          }
        }
      }
    `;

    const variables = { parentItemId };

    const response = await this.sendGraphQLRequest<{
      items: Array<{
        subitems: Array<{
          id: string;
          name: string;
          column_values: Array<{
            id: string;
            text: string;
            value: string;
          }>;
        }>;
      }>;
    }>(query, variables, "GetSubitems");

    // Transform response to a more usable format
    const subitems = response.items[0]?.subitems || [];

    return subitems.map((item) => {
      const formattedItem: MondayItem = {
        id: item.id,
        name: item.name,
      };

      // Add column values as properties
      item.column_values.forEach((column) => {
        formattedItem[column.id] = {
          text: column.text,
          value: column.value ? JSON.parse(column.value) : null,
        };
      });

      return formattedItem;
    });
  }
}

// Export a factory function to create the client
export function createMondayClient(apiKey: string): MondayClient {
  return new MondayClient(apiKey);
}

export default createMondayClient;
