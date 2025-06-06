import { NextResponse } from "next/server";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

export async function POST() {
  try {
    const convex = getConvex();
    // Initialize the transformation system with sample data
    const result = await convex.mutation(
      api.integrations.transformations.initialize,
      {
        seedSampleData: true,
      },
    );

    return NextResponse.json({ success: true, message: result });
  } catch (error) {
    console.error("Error initializing transformation system:", error);
    return NextResponse.json(
      { success: false, error: "Failed to initialize transformation system" },
      { status: 500 },
    );
  }
}

/**
 * GET handler - To check if the system is initialized
 */
export async function GET() {
  try {
    const convex = getConvex();
    // Try to list schemas as a way to check if the system is ready
    const schemas = await convex.query(
      api.integrations.transformations.listDataSchemas,
      {},
    );

    const isInitialized = Array.isArray(schemas) && schemas.length > 0;

    return NextResponse.json({
      success: true,
      initialized: isInitialized,
      schemasCount: schemas.length,
    });
  } catch (error) {
    console.error("Error checking transformation system:", error);
    return NextResponse.json({ success: false, initialized: false });
  }
}
