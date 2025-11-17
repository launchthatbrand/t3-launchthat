import { cookies } from "next/headers";
import { api } from "@/convex/_generated/api";
import { ConvexHttpClient } from "convex/browser";

// Create a Convex client for server-side use
const convex = new ConvexHttpClient(
  process.env.NEXT_PUBLIC_CONVEX_URL as string,
);

export async function checkAuth() {
  try {
    // Get auth token from cookies
    const cookieStore = cookies();
    const authToken = cookieStore.get("authToken")?.value;

    if (!authToken) {
      return { userId: null, isAdmin: false };
    }

    // Verify the token with Convex
    const user = await convex.query(api.auth.getUserFromToken, {
      token: authToken,
    });

    // Check if user is admin - you'll need to implement this endpoint
    // const isAdmin = await convex.query(api.accessControl.checkIsAdmin);

    return {
      userId: user?.id || null,
      isAdmin: false, // Implement this when you have the admin check
    };
  } catch (error) {
    console.error("Auth check error:", error);
    return { userId: null, isAdmin: false };
  }
}
