import type { NextRequest} from "next/server";
import { NextResponse } from "next/server";

import { generateEmbedHtml, generateEmbedUrl } from "~/utils/embed";

// GET handler for generating general embed codes
export function GET(request: NextRequest) {
  try {
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = searchParams.get("page") ?? "";
    const width = searchParams.get("width") ?? "100%";
    const height = searchParams.get("height") ?? "600px";

    // Build parameter object for all additional parameters
    const params: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      if (!["page", "width", "height"].includes(key)) {
        params[key] = value;
      }
    });

    // Generate the embed URL and HTML
    const origin = new URL(request.url).origin;
    const embedUrl = generateEmbedUrl({
      page,
      params,
      baseUrl: origin,
    });

    const embedHtml = generateEmbedHtml({
      url: embedUrl,
      width,
      height,
    });

    // Return the embed information
    return NextResponse.json({
      url: embedUrl,
      html: embedHtml,
      width,
      height,
      params,
    });
  } catch (error) {
    console.error("Error generating embed code:", error);
    return NextResponse.json(
      { error: "Failed to generate embed code" },
      { status: 500 },
    );
  }
}

// Special POST handler for Monday.com embed code generation
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
    };

    // Extract parameters with defaults
    const {
      boardId = "",
      workspaceId = "",
      itemId = "",
      width = "100%",
      height = "600px",
    } = data as {
      boardId?: string;
      workspaceId?: string;
      itemId?: string;
      width?: string;
      height?: string;
    };

    // Build parameters for Monday-specific context
    const params: Record<string, string> = {};
    if (boardId) params.boardId = boardId;
    if (workspaceId) params.workspaceId = workspaceId;
    if (itemId) params.itemId = itemId;

    // Generate the embed URL and HTML for Monday-specific page
    const origin = new URL(request.url).origin;
    const embedUrl = generateEmbedUrl({
      page: "embed/monday",
      params,
      baseUrl: origin,
    });

    const embedHtml = generateEmbedHtml({
      url: embedUrl,
      width,
      height,
    });

    // Generate installation instructions
    const installationSteps = [
      "1. In Monday.com, go to your workspace settings",
      "2. Navigate to 'Apps' → 'Custom Apps'",
      "3. Click 'Add Custom App'",
      "4. Enter a name for your app (e.g., 'Portal Integration')",
      "5. Paste the HTML code below in the 'iFrame' section",
      "6. Set permissions to access boards and users",
      "7. Save and publish your app",
    ];

    // Return the Monday-specific embed information
    return NextResponse.json({
      url: embedUrl,
      html: embedHtml,
      width,
      height,
      params,
      monday: {
        installationSteps,
        boardId,
        workspaceId,
        itemId,
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
