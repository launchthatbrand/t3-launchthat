/**
 * Type definitions for monday-sdk-js
 * @see https://github.com/mondaycom/monday-sdk-js
 */

declare module "monday-sdk-js" {
  export interface MondaySDK {
    /**
     * Initialize the SDK with client credentials
     */
    init(options?: { clientId?: string }): MondaySDK;

    /**
     * Execute a GraphQL API query
     * @param query The GraphQL query string
     * @param options Additional options for the API call
     * @returns A promise resolving to the API response
     */
    api<T = any>(
      query: string,
      options?: { token?: string; variables?: Record<string, any> },
    ): Promise<T>;

    /**
     * Set up a listener for Monday.com events
     * @param type The event type to listen for
     * @param callback The callback function to call when the event is triggered
     */
    listen(type: string, callback: (res: any) => void): void;

    /**
     * Get the context of the current Monday.com instance
     * @param callback The callback function to call with the context
     */
    get(type: "context", callback: (res: any) => void): void;

    /**
     * Set the app's height in the Monday.com UI
     * @param height The height in pixels
     */
    setHeight(height: number): void;

    /**
     * Execute a method on the Monday.com platform
     * @param method The method name to execute
     * @param args Arguments for the method
     */
    execute(method: string, args: any): Promise<any>;

    /**
     * Open a URL in a new window/tab
     * @param url The URL to open
     */
    openItemCard(options: { itemId: number; boardId?: number }): void;
  }

  /**
   * Factory function to create a new Monday SDK instance
   */
  export default function mondaySdk(): MondaySDK;
}
