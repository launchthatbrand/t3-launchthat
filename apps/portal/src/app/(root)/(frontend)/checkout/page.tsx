"use client";

import { CheckoutFlow } from "@/components/checkout/CheckoutFlow";
import { redirect } from "next/navigation";
import { useConvexAuth } from "convex/react";
import { useUser } from "@clerk/nextjs";

export default function CheckoutPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const { user } = useUser();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Loading...</p> {/* Or a spinner component */}
      </div>
    );
  }

  // For now, let's assume only authenticated users can checkout.
  // Guest checkout will be part of subtask 12.5.
  if (!isAuthenticated) {
    // You might want to store the intended destination to redirect back after login
    redirect("/login?redirectUrl=/checkout");
  }

  // If user is loaded but somehow null while authenticated (should not happen with Clerk)
  // At this point, isAuthenticated is true.
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Error loading user information. Please try again.</p>
      </div>
    );
  }

  return (
    <div>
      <CheckoutFlow />
    </div>
  );
}
