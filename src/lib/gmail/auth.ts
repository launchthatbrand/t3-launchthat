import { OAuth2Client } from "google-auth-library";
import { google } from "googleapis";

// These would typically be stored in environment variables
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI =
  process.env.NEXT_PUBLIC_REDIRECT_URI ||
  "http://localhost:3001/api/auth/google/callback";

/**
 * Create an OAuth2 client with the given credentials
 */
export function getOAuthClient(): OAuth2Client {
  return new google.auth.OAuth2(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  );
}

/**
 * Generate a URL that asks for permissions to access email data
 */
export function getAuthUrl(oAuth2Client: OAuth2Client): string {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline", // Will return a refresh token
    scope: [
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
    prompt: "consent",
  });
  return authUrl;
}

/**
 * Get tokens from code received after OAuth flow
 */
export async function getTokens(
  oAuth2Client: OAuth2Client,
  code: string,
): Promise<{
  access_token: string;
  refresh_token?: string;
  expiry_date: number;
}> {
  const { tokens } = await oAuth2Client.getToken(code);

  if (!tokens.access_token) {
    throw new Error("Failed to get access token");
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expiry_date: tokens.expiry_date || 0,
  };
}

/**
 * Set credentials for the OAuth2 client
 */
export function setCredentials(
  oAuth2Client: OAuth2Client,
  credentials: {
    access_token: string;
    refresh_token?: string;
    expiry_date: number;
  },
): OAuth2Client {
  oAuth2Client.setCredentials(credentials);
  return oAuth2Client;
}
