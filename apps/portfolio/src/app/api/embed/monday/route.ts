import { NextRequest, NextResponse } from "next/server";

import { generateMondayEmbedCode } from "~/utils/embed";

/**
 * Handler for generating Monday.com specific embed code
 */
export function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const boardId = searchParams.get("boardId") ?? "";
    const workspaceId = searchParams.get("workspaceId") ?? "";
    const width = searchParams.get("width") ?? "100%";
    const height = searchParams.get("height") ?? "600px";

    // Generate embed code
    const origin = new URL(request.url).origin;
    const { url, html } = generateMondayEmbedCode({
      boardId,
      workspaceId,
      width,
      height,
      baseUrl: origin,
    });

    // Installation instructions
    const installationSteps = [
      "1. In Monday.com, go to your workspace settings",
      "2. Navigate to 'Apps' → 'Custom Apps'",
      "3. Click 'Add Custom App'",
      "4. Enter a name for your app (e.g., 'Portal Integration')",
      "5. Paste the HTML code below in the 'iFrame' section",
      "6. Set permissions to access boards and users",
      "7. Save and publish your app",
    ];

    // Return the embed information
    return NextResponse.json({
      url,
      html,
      width,
      height,
      monday: {
        installationSteps,
        boardId,
        workspaceId,
      },
    });
  } catch (error) {
    console.error("Error generating Monday embed code:", error);
    return NextResponse.json(
      { error: "Failed to generate Monday embed code" },
      { status: 500 },
    );
  }
}

/**
 * POST handler for more advanced configuration
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const requestText = await request.text();
    const data = JSON.parse(requestText) as {
      boardId?: string;
      workspaceId?: string;
      itemId?: string;
      width?: string;
      height?: string;
      customization?: Record<string, unknown>;
    };

    // Extract parameters with defaults
    const {
      boardId = "",
      workspaceId = "",
      width = "100%",
      height = "600px",
      customization = {},
    } = data;

    // Generate embed code
    const origin = new URL(request.url).origin;
    const { url, html } = generateMondayEmbedCode({
      boardId,
      workspaceId,
      width,
      height,
      baseUrl: origin,
    });

    // Return the embed information with any customization options
    return NextResponse.json({
      url,
      html,
      width,
      height,
      monday: {
        boardId,
        workspaceId,
        customization,
      },
    });
  } catch (error) {
    console.error("Error generating Monday embed code:", error);
    return NextResponse.json(
      { error: "Failed to generate Monday embed code" },
      { status: 500 },
    );
  }
}
