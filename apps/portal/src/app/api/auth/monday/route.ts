import { NextRequest, NextResponse } from "next/server";

// Type definitions for Monday data
interface MondayUserContext {
  data: {
    user?: {
      id: string;
      email: string;
      name?: string;
    };
  };
}

interface MondayAuthBody {
  sessionToken: string;
  context: MondayUserContext;
  redirectUrl?: string;
}

// Monday.com authentication handler
export async function POST(request: NextRequest) {
  try {
    // Parse request body using JSON.parse to avoid direct assignment
    const requestText = await request.text();
    const parsed = JSON.parse(requestText);

    // Extract and validate required fields
    const sessionToken =
      typeof parsed.sessionToken === "string" ||
      typeof parsed.sessionToken === "boolean"
        ? parsed.sessionToken
        : "";

    const context: MondayUserContext = {
      data: {
        user: {
          id:
            typeof parsed.context?.data?.user?.id === "string"
              ? parsed.context.data.user.id
              : "",
          email:
            typeof parsed.context?.data?.user?.email === "string"
              ? parsed.context.data.user.email
              : "",
          name:
            typeof parsed.context?.data?.user?.name === "string"
              ? parsed.context.data.user.name
              : undefined,
        },
      },
    };

    const redirectUrl =
      typeof parsed.redirectUrl === "string" ? parsed.redirectUrl : undefined;

    if (!sessionToken) {
      return NextResponse.json(
        { error: "Missing Monday.com session token" },
        { status: 400 },
      );
    }

    // Verify Monday.com session token
    // In a production environment, you would verify this token with Monday.com's API
    // For this example, we'll assume it's valid if it exists

    // Extract user information from context
    const userId = context.data.user?.id;
    const userEmail = context.data.user?.email;
    const userName = context.data.user?.name;

    if (!userId || !userEmail) {
      return NextResponse.json(
        { error: "Incomplete user information from Monday.com" },
        { status: 400 },
      );
    }

    // Instead of directly creating users via API, redirect to sign-in with strategy
    // Create a special JWT token for Monday.com auth
    const token = Buffer.from(
      JSON.stringify({
        mondayUserId: userId,
        email: userEmail,
        name: userName ?? "Monday User",
        timestamp: Date.now(),
      }),
    ).toString("base64");

    // Create a redirect URL with the token
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.append("monday_token", token);

    if (redirectUrl) {
      signInUrl.searchParams.append("redirect_url", redirectUrl);
    }

    // Return the sign-in URL
    return NextResponse.json({
      success: true,
      signInUrl: signInUrl.toString(),
    });
  } catch (error) {
    console.error("Error processing Monday.com authentication:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
