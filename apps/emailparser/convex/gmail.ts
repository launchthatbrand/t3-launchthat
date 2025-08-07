import { createClerkClient } from "@clerk/clerk-sdk-node";
import { ConvexError, v } from "convex/values";

import type { Id } from "./_generated/dataModel";
import type { ActionCtx, MutationCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import {
  action,
  internalAction,
  internalMutation,
  mutation,
  query,
} from "./_generated/server";

// Constants for Gmail API
const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1";

// Required scopes - either gmail.readonly OR gmail.metadata is needed
const REQUIRED_SCOPES = [
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.metadata",
  "https://www.googleapis.com/auth/gmail.labels",
];

// Alternative scopes that would work (just one of these is needed)
const ALTERNATIVE_SCOPES = {
  GMAIL_READ: "https://www.googleapis.com/auth/gmail.readonly",
  GMAIL_METADATA: "https://www.googleapis.com/auth/gmail.metadata",
};

// Query to get the list of required Gmail scopes
export const getRequiredGmailScopes = query({
  args: {},
  returns: v.array(v.string()),
  handler: () => {
    // No need for async here since we're just returning a constant
    return REQUIRED_SCOPES;
  },
});

interface ClerkIdentity {
  tokenIdentifier: string;
  issuer: string;
  subject: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
  [key: string]: unknown;
}

// Type for email part
interface EmailPart {
  mimeType: string;
  filename?: string;
  name?: string;
  headers?: {
    name: string;
    value: string;
  }[];
  body: {
    data?: string;
    size?: number;
    attachmentId?: string;
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
  sizeEstimate?: number;
  payload: {
    mimeType: string;
    headers: {
      name: string;
      value: string;
    }[];
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
  stats?: {
    totalEmailsProcessed: number;
    processedLabels: string[];
    timeElapsed: number;
    successfullyStored?: number;
    errors?: string[];
  };
}

// Placeholder for GmailSyncPreferences document type
const gmailSyncPreferencesValidator = v.object({
  _id: v.id("gmailSyncPreferences"),
  _creationTime: v.number(),
  userId: v.string(),
  selectedLabelIds: v.array(v.string()),
  createdAt: v.number(),
  updatedAt: v.number(),
  // Add other fields from your schema if necessary
});

// Query to get Gmail sync preferences for a user
export const getGmailSyncPreferences = query({
  args: { userId: v.string() },
  returns: v.union(gmailSyncPreferencesValidator, v.null()),
  handler: async (ctx, args) => {
    const prefs = await ctx.db
      .query("gmailSyncPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .unique();
    return prefs;
  },
});

// This internal action fetches the token using Clerk's Backend SDK.
// CLERK_SECRET_KEY must be set as an environment variable in the Convex Dashboard.
export const getGoogleOAuthTokenViaSDK_internal = internalAction({
  args: { userId: v.string() },
  handler: async (
    _ctx: ActionCtx,
    { userId },
  ): Promise<{ accessToken: string; scopes: string[] }> => {
    console.log("getGoogleOAuthTokenViaSDK_internal");
    // We need to access this at runtime - Convex handles environment variables differently than Next.js
    // eslint-disable-next-line turbo/no-undeclared-env-vars
    const clerkSecretKey = process.env.CLERK_SECRET_KEY;
    console.log("clerkSecretKey", clerkSecretKey);
    if (!clerkSecretKey) {
      throw new ConvexError(
        "x environment variable not set in Convex backend!",
      );
    }

    try {
      console.log("clerkSecretKey2", clerkSecretKey);
      // Create a Clerk client for this request
      const clerk = createClerkClient({
        secretKey: clerkSecretKey,
      });

      // Get the user's OAuth tokens
      const user = await clerk.users.getUser(userId);

      // Find the Google OAuth provider
      const googleAccount = user.externalAccounts.find(
        (account) => account.provider === "oauth_google",
      );

      if (!googleAccount) {
        throw new ConvexError("No Google account connected for this user");
      }

      // Get the OAuth access token
      const tokens = await clerk.users.getUserOauthAccessToken(
        userId,
        "oauth_google", // This is the provider ID expected by Clerk
      );

      if (!tokens.data || tokens.data.length === 0) {
        throw new ConvexError("No OAuth tokens found for Google provider");
      }

      const tokenData = tokens.data[0];

      if (!tokenData) {
        throw new ConvexError("Failed to retrieve token data");
      }

      // Return the access token and scopes
      return {
        accessToken: tokenData.token,
        scopes: tokenData.scopes ?? [],
      };
    } catch (error: unknown) {
      console.error(
        `Clerk SDK Error: Failed to fetch Google OAuth token for user ${userId}:`,
        error instanceof Error ? error.message : String(error),
        error instanceof Error ? error.stack : undefined,
      );

      // Handle Clerk-specific error format if available
      const clerkError = error as Record<string, unknown>;
      if (
        error &&
        typeof error === "object" &&
        "errors" in clerkError &&
        Array.isArray(clerkError.errors) &&
        clerkError.errors.length > 0
      ) {
        const clerkErrorMessages = clerkError.errors
          .map((e: { message: string }) => e.message)
          .join("; ");
        throw new ConvexError(`Clerk SDK error: ${clerkErrorMessages}`);
      }

      throw new ConvexError(
        "Failed to fetch Google OAuth token using Clerk SDK: " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  },
});

// Helper for Actions to get and verify Google OAuth Token
async function getActionOAuthToken(ctx: ActionCtx): Promise<string> {
  const identity = (await ctx.auth.getUserIdentity()) as ClerkIdentity | null;
  if (!identity?.subject) {
    throw new ConvexError(
      "User not authenticated (Action) or subject missing.",
    );
  }

  console.log(
    "Full identity object (backend Action - will not contain externalAccounts):",
    JSON.stringify(identity, null, 2),
  );

  const tokenResult = await ctx.runAction(
    internal.gmail.getGoogleOAuthTokenViaSDK_internal,
    {
      userId: identity.subject,
    },
  );

  // Type assertions to make TypeScript happy - we know the shape of this result
  const tokenData = tokenResult as { accessToken: string; scopes: string[] };

  if (!tokenData.accessToken) {
    throw new ConvexError(
      "Retrieved token data is invalid (missing accessToken from internal action).",
    );
  }

  const grantedScopes = tokenData.scopes;
  const missingScopes = REQUIRED_SCOPES.filter(
    (scope) => !grantedScopes.includes(scope),
  );

  // Instead of failing on missing scopes, just log a warning if some are missing
  if (missingScopes.length > 0) {
    console.warn(
      `Warning: Missing some Gmail scopes: ${missingScopes.join(", ")}. Granted: ${grantedScopes.join(", ")}. Some functionality may be limited.`,
    );

    // Check if we have at least one of the Gmail read access scopes
    const hasReadAccess = grantedScopes.includes(ALTERNATIVE_SCOPES.GMAIL_READ);
    const hasMetadataAccess = grantedScopes.includes(
      ALTERNATIVE_SCOPES.GMAIL_METADATA,
    );

    if (!hasReadAccess && !hasMetadataAccess) {
      throw new ConvexError(
        `Missing required Gmail access scopes. You need at least gmail.readonly or gmail.metadata permission. Granted: ${grantedScopes.join(", ")}`,
      );
    }
  }

  console.log(
    "Successfully retrieved and verified Google OAuth access token via internal action for an Action.",
  );

  return tokenData.accessToken;
}

// This query checks if a user has gmail sync preferences, which
// indicates they've previously gone through the Gmail integration setup
export const hasGmailIntegration = query({
  args: {},
  returns: v.boolean(),
  handler: async (ctx): Promise<boolean> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      return false;
    }

    // Check if there are any stored preferences for Gmail sync
    // which indicates the user has set up Gmail integration
    const prefs = await ctx.db
      .query("gmailSyncPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", identity.subject))
      .first();

    return prefs !== null;
  },
});

interface GmailProfileData {
  emailAddress: string;
  messagesTotal: number;
  threadsTotal: number;
  historyId: string;
  [key: string]: unknown;
}

export const getGmailProfile = action({
  args: {},
  returns: v.object({
    emailAddress: v.string(),
    messagesTotal: v.number(),
    threadsTotal: v.number(),
    historyId: v.string(),
  }),
  handler: async (ctx): Promise<GmailProfileData> => {
    try {
      const accessToken = await getActionOAuthToken(ctx);
      const response = await fetch(`${GMAIL_API_BASE_URL}/users/me/profile`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = (await response.json()) as {
          error?: { message?: string };
        };
        throw new ConvexError(
          `Gmail API error (getGmailProfile): ${errorData.error?.message ?? response.statusText}`,
        );
      }

      const profileData = (await response.json()) as GmailProfileData;
      return {
        emailAddress: profileData.emailAddress,
        messagesTotal: profileData.messagesTotal,
        threadsTotal: profileData.threadsTotal,
        historyId: profileData.historyId,
      };
    } catch (error) {
      console.error("Error getting Gmail profile:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConvexError(error.message);
      }
      throw new ConvexError("Unknown error getting Gmail profile");
    }
  },
});

interface GmailLabel {
  id: string;
  name: string;
  type: string;
  messageListVisibility?: string;
  labelListVisibility?: string;
  color?: {
    textColor: string;
    backgroundColor: string;
  };
  [key: string]: unknown;
}

interface ListLabelsResponse {
  labels: GmailLabel[];
}

interface LabelResult {
  id: string;
  name: string;
  type: string;
  selected: boolean;
}

export const fetchGmailLabels = action({
  args: {},
  returns: v.array(
    v.object({
      id: v.string(),
      name: v.string(),
      type: v.string(),
      selected: v.boolean(),
    }),
  ),
  handler: async (ctx): Promise<LabelResult[]> => {
    try {
      const accessToken = await getActionOAuthToken(ctx);

      console.log(
        "fetchGmailLabels (action): Successfully retrieved OAuth token via Clerk SDK internal action.",
      );

      const userIdentity =
        (await ctx.auth.getUserIdentity()) as ClerkIdentity | null;
      if (!userIdentity?.subject) {
        throw new ConvexError(
          "fetchGmailLabels (action): User not authenticated or subject missing.",
        );
      }

      const userId = userIdentity.subject;
      console.log("fetchGmailLabels (action): Processing for user", userId);

      // Fetch user's selected labels directly using the mutation
      let selectedLabelIds: string[] = [];

      try {
        // Get the user's selected labels directly
        // Since we're in an action, we use runMutation to access the database
        const result = await ctx.runMutation(
          internal.gmail.getSelectedLabelsFromDb,
          { userId },
        );
        const prefsResult = result as { selectedLabelIds: string[] };
        selectedLabelIds = prefsResult.selectedLabelIds;
        console.log(
          "fetchGmailLabels (action): Retrieved selected label IDs:",
          selectedLabelIds,
        );
      } catch (error) {
        console.warn(
          "Failed to fetch user's selected label preferences:",
          error,
        );
        // Continue with empty selection if preferences can't be fetched
      }

      console.log(
        "fetchGmailLabels (action): Calling Gmail API to fetch labels",
      );

      const response = await fetch(`${GMAIL_API_BASE_URL}/users/me/labels`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(
          `fetchGmailLabels (action): Failed to fetch Gmail labels. Status: ${response.status} ${response.statusText}. Details:`,
          errorText,
        );
        throw new ConvexError(
          `Failed to fetch Gmail labels: ${response.statusText}`,
        );
      }

      const data = (await response.json()) as ListLabelsResponse;

      console.log("fetchGmailLabels (action): Received labels data", {
        labelCount: data.labels ? data.labels.length : 0,
      });

      if (!Array.isArray(data.labels)) {
        console.error(
          "fetchGmailLabels (action): Invalid labels data from API",
          data,
        );
        throw new ConvexError("Invalid labels data from Gmail API");
      }

      return data.labels.map(
        (label: GmailLabel): LabelResult => ({
          id: label.id,
          name: label.name,
          type: label.type,
          selected: selectedLabelIds.includes(label.id),
        }),
      );
    } catch (error) {
      console.error("fetchGmailLabels (action): Outer error:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConvexError(error.message);
      }
      throw new ConvexError("Unknown error fetching Gmail labels");
    }
  },
});

// This is a helper mutation that just queries the DB and returns the result
// It doesn't actually mutate anything, but we need a mutation to query the DB
// from within an action via ctx.runMutation
export const getSelectedLabelsFromDb = internalMutation({
  args: { userId: v.string() },
  returns: v.object({ selectedLabelIds: v.array(v.string()) }),
  handler: async (
    ctx: MutationCtx,
    { userId }: { userId: string },
  ): Promise<{ selectedLabelIds: string[] }> => {
    const prefs = await ctx.db
      .query("gmailSyncPreferences")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .first();

    return {
      selectedLabelIds: prefs?.selectedLabelIds ?? [],
    };
  },
});

interface FetchedEmailsResponse {
  messages: any[]; // Use any[] instead of GmailMessageData[] to avoid validation issues
  nextPageToken?: string;
  resultSizeEstimate?: number;
}

// Create a flexible validator for Gmail messages to handle any fields
const gmailMessageValidator = v.any(); // Accept any structure from Gmail API

// Function to retrieve email message with appropriate format
const fetchGmailMessage = async (messageId: string, accessToken: string) => {
  // Remove Promise<any> and use arrow function
  // Try formats in order of richness until one works
  const formats = ["full", "metadata", "minimal"];

  for (const format of formats) {
    try {
      console.log(`Trying to fetch message ${messageId} with format=${format}`);
      const response = await fetch(
        `${GMAIL_API_BASE_URL}/users/me/messages/${messageId}?format=${format}`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          `Successfully retrieved message ${messageId} with format=${format}`,
        );
        return data; // Return the raw data without type casting
      }

      // Log the error before trying next format
      if (response.status === 403) {
        console.log(
          `Permission error for format=${format} on message ${messageId}`,
        );
      } else {
        console.error(
          `Error ${response.status} fetching message ${messageId} with format=${format}`,
        );
      }
    } catch (error) {
      console.error(
        `Exception fetching message ${messageId} with format=${format}:`,
        error,
      );
    }
  }

  // If we get here, all formats failed
  console.error(`Failed to fetch message ${messageId} with any format`);
  return null;
};

export const fetchEmails = action({
  args: {
    userId: v.string(),
    maxResults: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
    query: v.optional(v.string()),
    pageToken: v.optional(v.string()),
  },
  returns: v.object({
    messages: v.array(v.any()), // Use v.any() to accept any message structure
    nextPageToken: v.optional(v.string()),
    resultSizeEstimate: v.optional(v.number()),
    stats: v.optional(
      v.object({
        totalProcessed: v.number(),
        successfullyStored: v.number(),
        labelIds: v.array(v.string()),
        timeElapsed: v.number(),
        errors: v.optional(v.array(v.string())),
      }),
    ),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    messages: any[]; // Change this to use any[] instead of GmailMessageData[]
    nextPageToken?: string;
    resultSizeEstimate?: number;
    stats?: {
      totalProcessed: number;
      successfullyStored: number;
      labelIds: string[];
      timeElapsed: number;
      errors?: string[];
    };
  }> => {
    try {
      const startTime = Date.now();
      // Use the explicitly passed userId instead of trying to get it from auth
      const userId = args.userId;

      // Get token using the provided userId
      const tokenResult = await ctx.runAction(
        internal.gmail.getGoogleOAuthTokenViaSDK_internal,
        { userId },
      );

      // Extract the access token from the result
      const tokenData = tokenResult as {
        accessToken: string;
        scopes: string[];
      };
      const accessToken = tokenData.accessToken;

      if (!accessToken) {
        throw new ConvexError("Failed to retrieve access token");
      }

      console.log("Successfully retrieved access token for Gmail API");

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
        args.labelIds.forEach((labelId: string) => {
          queryParams.append("labelIds", labelId);
        });
      }

      console.log(`Fetching emails with params: ${queryParams.toString()}`);
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
        const errorText = await response.text();
        let errorMessage = `Gmail API error (fetchEmails): ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText) as {
            error?: { message?: string };
          };
          if (errorData.error?.message) {
            errorMessage = `Gmail API error (fetchEmails): ${errorData.error.message}`;
          }
        } catch (parseError) {
          // Use raw error text if JSON parsing fails
          console.warn("Could not parse error response as JSON:", errorText);
        }

        throw new ConvexError(errorMessage);
      }

      const messageList = (await response.json()) as {
        messages?: { id: string }[];
        nextPageToken?: string;
        resultSizeEstimate?: number;
      };
      const messages: any[] = []; // Use any[] to accept any structure from Gmail API

      // Stats tracking
      let successfullyStored = 0;
      const totalToProcess = messageList.messages?.length ?? 0;
      const errors: string[] = [];

      console.log(`Found ${totalToProcess} messages to process`);

      if (messageList.messages && messageList.messages.length > 0) {
        for (const message of messageList.messages) {
          console.log(`Processing message ID: ${message.id}`);

          try {
            // Use the helper function to fetch the message with appropriate format
            const messageResponse = await fetchGmailMessage(
              message.id,
              accessToken,
            );

            if (messageResponse) {
              messages.push(messageResponse);

              try {
                await ctx.runMutation(api.gmail.storeEmail, {
                  userId,
                  emailData: messageResponse,
                });
                successfullyStored++;
                console.log(`Successfully stored email ${message.id}`);
              } catch (err) {
                const errorMessage =
                  err instanceof Error ? err.message : String(err);
                console.error(
                  `Failed to store email ${message.id}:`,
                  errorMessage,
                );
                errors.push(`Store error (${message.id}): ${errorMessage}`);
              }
            } else {
              console.error(`Failed to fetch message ${message.id}`);
              errors.push(
                `Fetch error (${message.id}): Failed to fetch message`,
              );
            }
          } catch (fetchError) {
            const errorMessage =
              fetchError instanceof Error
                ? fetchError.message
                : String(fetchError);
            console.error(
              `Error processing message ${message.id}:`,
              errorMessage,
            );
            errors.push(`Process error (${message.id}): ${errorMessage}`);
          }
        }
      } else {
        console.log("No messages found matching the criteria");
      }

      const timeElapsed = Date.now() - startTime;
      console.log(
        `Email sync completed in ${timeElapsed}ms. Processed ${totalToProcess} emails, stored ${successfullyStored}.`,
      );

      return {
        messages,
        nextPageToken: messageList.nextPageToken,
        resultSizeEstimate: messageList.resultSizeEstimate,
        stats: {
          totalProcessed: totalToProcess,
          successfullyStored,
          labelIds: args.labelIds ?? [],
          timeElapsed,
          errors: errors.length > 0 ? errors : undefined,
        },
      };
    } catch (error) {
      console.error("Error fetching emails:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConvexError(error.message);
      }
      throw new ConvexError("Unknown error fetching emails");
    }
  },
});

const storeEmailArgs = {
  userId: v.string(),
  emailData: v.any(),
};

export const storeEmail = mutation({
  args: storeEmailArgs,
  returns: v.id("emails"),
  handler: async (ctx, args): Promise<Id<"emails">> => {
    try {
      const { userId, emailData } = args;

      // Ensure required fields are present
      if (!emailData.id || !emailData.threadId || !emailData.internalDate) {
        throw new ConvexError("Missing required fields in email data");
      }

      // Debug log to see what data we're getting
      console.log(
        "Storing email data. Fields available:",
        Object.keys(emailData),
      );

      // Initialize with fallback values
      let subject = "[No Subject]";
      let from = "[Unknown Sender]";
      const receivedAt = parseInt(emailData.internalDate, 10) || Date.now();
      let content = emailData.snippet
        ? `[Preview] ${emailData.snippet}`
        : "[No content available]";

      // Extract headers data if available
      if (emailData.payload?.headers) {
        for (const header of emailData.payload.headers) {
          const name = header.name.toLowerCase();
          if (name === "subject") subject = header.value;
          if (name === "from") from = header.value;
        }
      }

      // Try to extract content if available (will usually not be present with metadata format)
      try {
        if (emailData.payload?.body?.data) {
          const decoded = Buffer.from(
            emailData.payload.body.data,
            "base64",
          ).toString("utf-8");
          if (decoded) content = decoded;
        } else if (emailData.payload?.parts) {
          for (const part of emailData.payload.parts) {
            if (part.mimeType === "text/plain" && part.body?.data) {
              const decoded = Buffer.from(part.body.data, "base64").toString(
                "utf-8",
              );
              if (decoded) {
                content = decoded;
                break;
              }
            }
          }
        }
      } catch (decodeError) {
        console.warn("Could not decode email content:", decodeError);
        // Continue with the fallback content from snippet
      }

      // Store the email with whatever data we have
      console.log(`Storing email: "${subject}" from "${from}"`);

      const emailId = await ctx.db.insert("emails", {
        subject,
        sender: from,
        receivedAt: isNaN(receivedAt) ? Date.now() : receivedAt,
        content,
        userId,
        labels: emailData.labelIds ?? [],
        gmailId: emailData.id,
        threadId: emailData.threadId,
        lastSynced: Date.now(),
      });

      console.log(`Successfully stored email with ID: ${emailId}`);
      return emailId;
    } catch (error) {
      console.error("Error storing email:", error);
      throw new ConvexError(
        `Failed to store email: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
});

export const updateSyncPreferences = mutation({
  args: {
    selectedLabelIds: v.array(v.string()),
  },
  returns: v.id("gmailSyncPreferences"),
  handler: async (ctx, args): Promise<Id<"gmailSyncPreferences">> => {
    try {
      const userIdentity =
        (await ctx.auth.getUserIdentity()) as ClerkIdentity | null;
      if (!userIdentity?.subject) {
        throw new ConvexError(
          "User not authenticated or subject missing for updateSyncPreferences.",
        );
      }
      const userId = userIdentity.subject;
      const { selectedLabelIds } = args;

      const existingPrefs = await ctx.db
        .query("gmailSyncPreferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .unique();

      let preferencesId: Id<"gmailSyncPreferences">;
      if (existingPrefs) {
        preferencesId = existingPrefs._id;
        await ctx.db.patch(preferencesId, {
          selectedLabelIds,
          updatedAt: Date.now(),
        });
      } else {
        preferencesId = await ctx.db.insert("gmailSyncPreferences", {
          userId,
          selectedLabelIds,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }
      return preferencesId;
    } catch (error) {
      console.error("Error updating Gmail sync preferences:", error);
      if (error instanceof ConvexError) {
        throw error;
      }
      if (error instanceof Error) {
        throw new ConvexError(error.message);
      }
      throw new ConvexError("Unknown error updating sync preferences");
    }
  },
});

export const syncEmails = mutation({
  args: {
    maxResults: v.optional(v.number()),
    labelIds: v.optional(v.array(v.string())),
  },
  returns: v.object({
    jobId: v.id("_scheduled_functions"),
    message: v.string(),
    requestedLabels: v.array(v.string()),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    jobId: Id<"_scheduled_functions">;
    message: string;
    requestedLabels: string[];
  }> => {
    const userIdentity =
      (await ctx.auth.getUserIdentity()) as ClerkIdentity | null;
    if (!userIdentity?.subject) {
      throw new ConvexError(
        "User not authenticated or subject missing for syncEmails.",
      );
    }
    const userId = userIdentity.subject;

    let labelIdsToSync = args.labelIds ?? [];
    if (labelIdsToSync.length === 0) {
      // Get user preferences to determine which labels to sync
      const userPreferences = await ctx.db
        .query("gmailSyncPreferences")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .first();

      if (
        userPreferences &&
        userPreferences.selectedLabelIds &&
        userPreferences.selectedLabelIds.length > 0
      ) {
        labelIdsToSync = userPreferences.selectedLabelIds;
      }
    }

    const jobId = await ctx.scheduler.runAfter(
      0,
      internal.gmail.backgroundSync,
      {
        userId,
        maxResults: args.maxResults ?? 100,
        labelIds: labelIdsToSync,
      },
    );

    return {
      jobId,
      message: `Sync job started. Processing up to ${args.maxResults ?? 100} emails from ${labelIdsToSync.length} labels.`,
      requestedLabels: labelIdsToSync,
    };
  },
});

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
    stats: v.optional(
      v.object({
        totalEmailsProcessed: v.number(),
        processedLabels: v.array(v.string()),
        timeElapsed: v.number(),
        successfullyStored: v.optional(v.number()),
        errors: v.optional(v.array(v.string())),
      }),
    ),
  }),
  handler: async (ctx, args): Promise<SyncJobResult> => {
    try {
      const startTime = Date.now();
      const { userId, maxResults, labelIds, pageToken } = args;
      console.log(
        `Starting background sync for user ${userId} with labels:`,
        labelIds,
      );

      // Call fetchEmails action with the userId explicitly passed
      const result = await ctx.runAction(api.gmail.fetchEmails, {
        userId,
        maxResults,
        labelIds,
        pageToken,
      });

      // Extract stats from the result
      const timeElapsed = Date.now() - startTime;

      // Check if there were any errors during fetching
      const hasErrors = result.stats?.errors && result.stats.errors.length > 0;

      // We consider it a success if at least some emails were processed, even if there were errors
      const isPartialSuccess =
        hasErrors && result.stats && result.stats.successfullyStored > 0;

      // Log the full stats to console
      console.log("Background sync completed with stats:", {
        timeElapsed,
        processedLabels: labelIds,
        ...result.stats,
        status: isPartialSuccess
          ? "PARTIAL_SUCCESS"
          : hasErrors
            ? "FAILURE"
            : "SUCCESS",
      });

      if (hasErrors && !isPartialSuccess) {
        // All operations failed
        return {
          success: false,
          error: `Failed to process emails: ${result.stats?.errors?.join("; ")}`,
          stats: {
            totalEmailsProcessed: result.stats?.totalProcessed ?? 0,
            processedLabels: labelIds,
            timeElapsed,
            successfullyStored: result.stats?.successfullyStored,
            errors: result.stats?.errors,
          },
        };
      }

      return {
        success: true,
        stats: {
          totalEmailsProcessed: result.stats?.totalProcessed ?? 0,
          processedLabels: labelIds,
          timeElapsed,
          successfullyStored: result.stats?.successfullyStored,
          errors: result.stats?.errors, // Include any errors, even for partial success
        },
      };
    } catch (error) {
      console.error("Error in background sync:", error);

      let errorMessage = "Unknown error during background sync";

      if (error instanceof ConvexError) {
        errorMessage =
          typeof error.data === "string"
            ? error.data
            : JSON.stringify(error.data);
      } else if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      } else {
        errorMessage = JSON.stringify(error);
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },
});

// Add a query to get email count and sync status
export const getEmailStats = query({
  args: {
    userId: v.optional(v.string()),
    labelIds: v.optional(v.array(v.string())),
  },
  returns: v.object({
    totalEmails: v.number(),
    latestSync: v.optional(v.number()),
    emailsByLabel: v.optional(v.record(v.string(), v.number())),
  }),
  handler: async (
    ctx,
    args,
  ): Promise<{
    totalEmails: number;
    latestSync?: number;
    emailsByLabel?: Record<string, number>;
  }> => {
    try {
      // Get userId from auth if not provided
      let userId = args.userId;
      if (!userId) {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity?.subject) {
          return { totalEmails: 0 };
        }
        userId = identity.subject;
      }

      // Query emails for this user
      const emails = await ctx.db
        .query("emails")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect();

      // Get the most recent sync time
      const latestSync =
        emails.length > 0
          ? Math.max(...emails.map((email) => email.lastSynced || 0))
          : undefined;

      // Count emails by label if requested
      let emailsByLabel: Record<string, number> | undefined;
      if (args.labelIds && args.labelIds.length > 0) {
        emailsByLabel = {};
        for (const labelId of args.labelIds) {
          // Count emails with this label
          const count = emails.filter(
            (email) => email.labels?.includes(labelId),
          ).length;
          emailsByLabel[labelId] = count;
        }
      }

      return {
        totalEmails: emails.length,
        latestSync,
        emailsByLabel,
      };
    } catch (error) {
      console.error("Error fetching email stats:", error);
      // Return empty stats on error
      return { totalEmails: 0 };
    }
  },
});

// Function to retrieve thread messages with appropriate format
const fetchGmailThread = async (
  threadId: string,
  accessToken: string,
  senderFilter?: string,
) => {
  try {
    console.log(`Fetching thread ${threadId}`);
    const response = await fetch(
      `${GMAIL_API_BASE_URL}/users/me/threads/${threadId}?format=full`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    if (!response.ok) {
      console.error(`Error ${response.status} fetching thread ${threadId}`);
      return null;
    }

    const data = await response.json();
    console.log(
      `Successfully retrieved thread ${threadId} with ${data.messages?.length || 0} messages`,
    );

    if (senderFilter && data.messages && data.messages.length > 0) {
      console.log(`Filtering thread for messages from: ${senderFilter}`);
      // Filter messages by sender
      const filteredMessages = data.messages.filter((message) => {
        if (message.payload?.headers) {
          // Look for 'From' header that contains the senderFilter
          return message.payload.headers.some(
            (header) =>
              header.name.toLowerCase() === "from" &&
              header.value.toLowerCase().includes(senderFilter.toLowerCase()),
          );
        }
        return false;
      });

      console.log(
        `Found ${filteredMessages.length} messages matching sender filter`,
      );
      if (filteredMessages.length > 0) {
        return filteredMessages[0]; // Return the first matching message
      }
    }

    // If no filter or no matches, return the whole thread data
    return data;
  } catch (error) {
    console.error(`Exception fetching thread ${threadId}:`, error);
    return null;
  }
};

// New mutation to find and store a specific email from a thread
export const findAndStoreEmailFromSender = mutation({
  args: {
    userId: v.string(),
    threadId: v.string(),
    senderFilter: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.id("emails")),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const { userId, threadId, senderFilter } = args;

      // Get token using the userId
      const tokenResult = await ctx.scheduler.runAfter(
        0, // run immediately
        internal.gmail.getGoogleOAuthTokenViaSDK_internal,
        { userId },
      );

      const accessToken = tokenResult.accessToken;

      if (!accessToken) {
        return {
          success: false,
          message: "Failed to retrieve access token",
        };
      }

      // Scheduler to run action asynchronously (actions can access external APIs)
      const jobId = await ctx.scheduler.runAfter(
        0, // run immediately
        internal.gmail.fetchAndProcessThreadEmail,
        {
          userId,
          threadId,
          senderFilter,
          accessToken,
        },
      );

      return {
        success: true,
        message: `Started processing thread ${threadId} to find emails from ${senderFilter} (job: ${jobId})`,
      };
    } catch (error) {
      console.error("Error in findAndStoreEmailFromSender:", error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

// Internal action to fetch and process thread email
export const fetchAndProcessThreadEmail = internalAction({
  args: {
    userId: v.string(),
    threadId: v.string(),
    senderFilter: v.string(),
    accessToken: v.string(),
  },
  returns: v.object({
    success: v.boolean(),
    emailId: v.optional(v.string()),
    message: v.string(),
  }),
  handler: async (ctx, args) => {
    try {
      const { userId, threadId, senderFilter, accessToken } = args;

      // Fetch the thread and find the specific message from the sender
      const messageData = await fetchGmailThread(
        threadId,
        accessToken,
        senderFilter,
      );

      if (!messageData) {
        return {
          success: false,
          message: `Could not find thread ${threadId} or messages from ${senderFilter}`,
        };
      }

      // Store the email
      const emailId = await ctx.runMutation(api.gmail.storeEmail, {
        userId,
        emailData: messageData,
      });

      return {
        success: true,
        emailId: emailId.toString(),
        message: `Successfully found and stored email from ${senderFilter} in thread ${threadId}`,
      };
    } catch (error) {
      console.error("Error in fetchAndProcessThreadEmail:", error);
      return {
        success: false,
        message: `Error: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});

declare namespace Convex {
   
  export interface Validator<T, O extends boolean, F extends boolean> {
    __type: T;
    __optional: O;
    __fieldPaths: F;
  }
}
