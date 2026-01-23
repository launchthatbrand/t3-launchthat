import { NextResponse } from "next/server";

export const runtime = "nodejs";

export const GET = async () => {
  return NextResponse.json(
    {
      error:
        "Not implemented in TraderLaunchpad. Portal uses better-auth at /api/auth/[...all].",
    },
    { status: 404 },
  );
};

export const POST = GET;

