import { ConvexError, v } from "convex/values";

import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import {
  action,
  ActionCtx,
  internalAction,
  mutation,
  MutationCtx,
  query,
  QueryCtx,
} from "./_generated/server";
import { requireUser } from "./auth";

// Constants for Gmail API
const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1";
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.labels",
  "https://www.googleapis.com/auth/gmail.metadata",
];

// Types for OAuth tokens
interface GoogleCredentials {
  tokens: {
    accessToken: string;
    refreshToken?: string;
    scope?: string;
  };
}

interface ClerkIdentity {
  tokenIdentifier: string;
  oauth?: {
    googleCredentials?: GoogleCredentials;
  };
}

// Type for email part
interface EmailPart {
  mimeType: string;
  filename?: string;
  headers?: Array<{
    name: string;
    value: string;
  }>;
  body: {
    data?: string;
    size?: number;
  };
  parts?: EmailPart[];
}

// Type for Gmail message data
interface GmailMessageData {
  id: string;
  threadId: string;
  labelIds?: string[];
  snippet?: string;
  historyId?: string;
  internalDate: string;
  payload: {
    mimeType: string;
    headers: Array<{
      name: string;
      value: string;
    }>;
    body?: {
      data?: string;
      size?: number;
    };
    parts?: EmailPart[];
  };
}

// Type for sync job result
interface SyncJobResult {
  success: boolean;
  error?: string;
}

/**
 * Helper function to get user OAuth token from Clerk
 */
async function getUserGoogleOAuthToken(
  ctx: QueryCtx | MutationCtx,
): Promise<string> {
  const identity = (await ctx.auth.getUserIdentity()) as ClerkIdentity | null;

  if (!identity) {
    throw new ConvexError("User not authenticated");
  }

  // Extract OAuth token info from Clerk identity
  const oauthTokens = identity.tokenIdentifier.startsWith("oauth_google")
    ? identity.oauth?.googleCredentials?.tokens
    : null;

  if (!oauthTokens) {
    throw new ConvexError("User not authenticated with Google OAuth");
  }

  // Check for required scopes
  const grantedScopes = oauthTokens.scope?.split(" ") ?? [];
  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  if (missingScopes.length > 0) {
    throw new ConvexError(
      `Missing required Gmail scopes: ${missingScopes.join(", ")}`,
    );
  }

  // Return access token
  return oauthTokens.accessToken;
}

/**
 * Helper function for actions to get OAuth tokens
 * Actions have different context type, so we need a separate function
 */
async function getActionOAuthToken(ctx: ActionCtx): Promise<string> {
  const identity = (await ctx.auth.getUserIdentity()) as ClerkIdentity | null;

  if (!identity) {
    throw new ConvexError("User not authenticated");
  }

  // Extract OAuth token info from Clerk identity
  const oauthTokens = identity.tokenIdentifier.startsWith("oauth_google")
    ? identity.oauth?.googleCredentials?.tokens
    : null;

  if (!oauthTokens) {
    throw new ConvexError("User not authenticated with Google OAuth");
  }

  // Check for required scopes
  const grantedScopes = oauthTokens.scope?.split(" ") ?? [];
  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  if (missingScopes.length > 0) {
    throw new ConvexError(
      `Missing required Gmail scopes: ${missingScopes.join(", ")}`,
    );
  }

  // Return access token
  return oauthTokens.accessToken;
}

/**
 * Query to check if user has Gmail integration enabled
 */
export const hasGmailIntegration = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx) => {
    try {
      // Try to get the Google OAuth token
      await getUserGoogleOAuthToken(ctx);
      return true;
    } catch (_error) {
      // If any error occurs, user doesn't have proper Gmail integration
      return false;
    }
  },
});

/**
 * Get Gmail profile information
 */
export const getGmailProfile = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Get OAuth token
      const accessToken = await getActionOAuthToken(ctx);

      // Make API request to get user profile
      const response = await fetch(`${GMAIL_API_BASE_URL}/users/me/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ConvexError(
          `Gmail API error: ${errorData.error?.message || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error getting Gmail profile:", error);
      throw error;
    }
  },
});

/**
 * List Gmail labels
 */
export const listLabels = action({
  args: {},
  handler: async (ctx) => {
    try {
      // Get OAuth token
      const accessToken = await getActionOAuthToken(ctx);

      // Make API request to get labels
      const response = await fetch(`${GMAIL_API_BASE_URL}/users/me/labels`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new ConvexError(
          `Gmail API error: ${errorData.error?.message || response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      console.error("Error listing Gmail labels:", error);
      throw error;
    }
  },
});

/**
 * Fetch emails from Gmail
 */
export const fetchEmails = action({
  args: {
    maxResults: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
    query: v.optional(v.string()),
    pageToken: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    try {
      // Get the authenticated user's ID
      const userId = await requireUser(ctx);

      // Get OAuth token
      const accessToken = await getActionOAuthToken(ctx);

      // Build query parameters
      const queryParams = new URLSearchParams();

      if (args.maxResults) {
        queryParams.append("maxResults", args.maxResults.toString());
      }

      if (args.pageToken) {
        queryParams.append("pageToken", args.pageToken);
      }

      if (args.query) {
        queryParams.append("q", args.query);
      }

      if (args.labelIds && args.labelIds.length > 0) {
        args.labelIds.forEach((labelId) => {
          queryParams.append("labelIds", labelId);
        });
      }

      // Make API request to list messages
      const response = await fetch(
        `${GMAIL_API_BASE_URL}/users/me/messages?${queryParams.toString()}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new ConvexError(
          `Gmail API error: ${errorData.error?.message || response.statusText}`,
        );
      }

      const messageList = await response.json();

      // For each message ID, fetch the full message
      const messages: GmailMessageData[] = [];

      for (const message of messageList.messages || []) {
        const messageResponse = await fetch(
          `${GMAIL_API_BASE_URL}/users/me/messages/${message.id}?format=full`,
          {
            method: "GET",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
          },
        );

        if (messageResponse.ok) {
          const fullMessage =
            (await messageResponse.json()) as GmailMessageData;
          messages.push(fullMessage);

          // Store email in the database
          await ctx.runMutation(internal.gmail.storeEmail, {
            userId,
            emailData: fullMessage,
          });
        }
      }

      return {
        messages,
        nextPageToken: messageList.nextPageToken,
        resultSizeEstimate: messageList.resultSizeEstimate,
      };
    } catch (error) {
      console.error("Error fetching emails:", error);
      throw error;
    }
  },
});

/**
 * Store email in the database
 */
export const storeEmail = mutation({
  args: {
    userId: v.string(),
    emailData: v.object({
      id: v.string(),
      threadId: v.string(),
      labelIds: v.optional(v.array(v.string())),
      internalDate: v.string(),
      payload: v.object({
        mimeType: v.string(),
        headers: v.array(
          v.object({
            name: v.string(),
            value: v.string(),
          }),
        ),
        body: v.optional(
          v.object({
            data: v.optional(v.string()),
            size: v.optional(v.number()),
          }),
        ),
        parts: v.optional(v.any()),
      }),
    }),
  },
  handler: async (ctx, args) => {
    try {
      const { userId, emailData } = args;

      // Extract relevant email data
      const headers: Record<string, string> = {};
      let subject = "";
      let from = "";
      let receivedAt = 0;

      // Process headers
      emailData.payload.headers.forEach((header) => {
        headers[header.name.toLowerCase()] = header.value;

        if (header.name.toLowerCase() === "subject") {
          subject = header.value;
        }

        if (header.name.toLowerCase() === "from") {
          from = header.value;
        }
      });

      // Get received timestamp
      receivedAt = parseInt(emailData.internalDate, 10);

      // Extract email content
      let content = "";

      // Function to extract content recursively from parts
      const extractContent = (part: EmailPart) => {
        if (part.mimeType === "text/plain" && part.body?.data) {
          // Decode base64 content
          const decoded = Buffer.from(part.body.data, "base64").toString(
            "utf-8",
          );
          content += decoded + "\n";
        } else if (part.parts) {
          part.parts.forEach((subPart) => extractContent(subPart));
        }
      };

      // Start with the main payload
      if (
        emailData.payload.mimeType === "text/plain" &&
        emailData.payload.body?.data
      ) {
        const decoded = Buffer.from(
          emailData.payload.body.data,
          "base64",
        ).toString("utf-8");
        content += decoded;
      } else if (emailData.payload.parts) {
        emailData.payload.parts.forEach((part) => extractContent(part));
      }

      // Store in emails table
      const emailId = await ctx.db.insert("emails", {
        subject,
        sender: from,
        receivedAt,
        content,
        userId,
        labels: emailData.labelIds ?? [],
        gmailId: emailData.id,
        threadId: emailData.threadId,
        lastSynced: Date.now(),
      });

      return emailId;
    } catch (error) {
      console.error("Error storing email:", error);
      throw error;
    }
  },
});

/**
 * Start a background job to synchronize emails
 */
export const syncEmails = mutation({
  args: {
    maxResults: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const userId = await requireUser(ctx);

    // Schedule a background job to sync emails
    const jobId = await ctx.scheduler.runAfter(
      0,
      internal.gmail.backgroundSync,
      {
        userId,
        maxResults: args.maxResults ?? 100,
        labelIds: args.labelIds ?? [],
      },
    );

    return jobId;
  },
});

/**
 * Background job to sync emails
 */
export const backgroundSync = internalAction({
  args: {
    userId: v.string(),
    maxResults: v.number(),
    labelIds: v.array(v.string()),
    pageToken: v.optional(v.string()),
  },
  returns: v.object({
    success: v.boolean(),
    error: v.optional(v.string()),
  }),
  handler: async (ctx, args): Promise<SyncJobResult> => {
    try {
      const { userId, maxResults, labelIds, pageToken } = args;

      // For actions, we need to impersonate the user
      const identity = { type: "user" as const, subject: userId };

      // Fetch emails
      const result = await ctx.runAction(
        internal.gmail.fetchEmails,
        {
          maxResults,
          labelIds,
          pageToken,
        },
        { identity },
      );

      // If there's a next page, schedule another job
      if (result.nextPageToken) {
        await ctx.scheduler.runAfter(
          5, // 5 second delay to avoid rate limits
          internal.gmail.backgroundSync,
          {
            userId,
            maxResults,
            labelIds,
            pageToken: result.nextPageToken,
          },
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error in background sync:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  },
});
