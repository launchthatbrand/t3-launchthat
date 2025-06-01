import { gmail_v1, google } from "googleapis";

import { OAuth2Client } from "google-auth-library";
import { parseEmailContent } from "./parser";
import { showToast } from "../../utils/notifications";

/**
 * Creates a Gmail API client
 */
export function getGmailClient(auth: OAuth2Client): gmail_v1.Gmail {
  return google.gmail({ version: "v1", auth });
}

/**
 * Fetches email list from Gmail API
 */
export async function listEmails(
  auth: OAuth2Client,
  maxResults = 20,
): Promise<gmail_v1.Schema$Message[]> {
  try {
    const gmail = getGmailClient(auth);
    const response = await gmail.users.messages.list({
      userId: "me",
      maxResults,
    });

    return response.data.messages || [];
  } catch (error) {
    console.error("Error fetching email list:", error);
    showToast("error", "Failed to fetch emails from Gmail");
    return [];
  }
}

/**
 * Fetches single email details from Gmail API
 */
export async function getEmail(
  auth: OAuth2Client,
  messageId: string,
): Promise<{
  id: string;
  subject: string;
  from: string;
  date: string;
  body: string;
} | null> {
  try {
    const gmail = getGmailClient(auth);
    const response = await gmail.users.messages.get({
      userId: "me",
      id: messageId,
      format: "full",
    });

    const message = response.data;
    if (!message || !message.payload) {
      return null;
    }

    // Extract email headers
    const headers = message.payload.headers || [];
    const subject =
      headers.find((h) => h.name?.toLowerCase() === "subject")?.value ||
      "No Subject";
    const from =
      headers.find((h) => h.name?.toLowerCase() === "from")?.value ||
      "Unknown Sender";
    const date =
      headers.find((h) => h.name?.toLowerCase() === "date")?.value ||
      new Date().toISOString();

    // Extract email body
    const body = parseEmailContent(message);

    return {
      id: message.id || messageId,
      subject,
      from,
      date,
      body,
    };
  } catch (error) {
    console.error("Error fetching email details:", error);
    showToast("error", "Failed to fetch email details");
    return null;
  }
}
