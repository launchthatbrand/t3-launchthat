import { z } from "zod";

import type { ConnectionDefinition } from "@acme/integration-sdk";

/**
 * WordPress Connection Definition
 *
 * WordPress supports several authentication methods. This implementation uses
 * the most common approach: basic authentication with username and application password.
 */

// Schema for WordPress basic authentication
const WordPressAuthSchema = z.object({
  baseUrl: z
    .string()
    .url("Must be a valid WordPress site URL (e.g., https://example.com)"),
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Application password is required"),
});

export const WordPressConnection: ConnectionDefinition = {
  id: "wordpress-basic-auth",
  name: "WordPress (Basic Auth)",
  type: "basic_auth",
  authSchema: WordPressAuthSchema,

  // Connection test function
  async testConnection(auth: unknown): Promise<boolean> {
    try {
      const parsed = WordPressAuthSchema.parse(auth);
      const { baseUrl, username, password } = parsed;

      // Test the connection by making a simple API call
      const response = await fetch(`${baseUrl}/wp-json/wp/v2/users/me`, {
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
          "Content-Type": "application/json",
        },
      });

      return response.ok;
    } catch (error) {
      console.error("WordPress connection test failed:", error);
      return false;
    }
  },
};
