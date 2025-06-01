import { NextRequest, NextResponse } from "next/server";
import { getOAuthClient, getTokens } from "../../../../../lib/gmail/auth";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Handle errors from OAuth process
  if (error) {
    console.error("Error during OAuth callback:", error);
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }

  // Validate code parameter
  if (!code) {
    console.error("No code parameter in callback");
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }

  try {
    // Exchange code for tokens
    const oAuth2Client = getOAuthClient();
    await getTokens(oAuth2Client, code);

    // Redirect to frontend with success
    return NextResponse.redirect(new URL("/?auth=success", request.url));
  } catch (error) {
    console.error("Error exchanging code for tokens:", error);
    return NextResponse.redirect(new URL("/?auth=failed", request.url));
  }
}
