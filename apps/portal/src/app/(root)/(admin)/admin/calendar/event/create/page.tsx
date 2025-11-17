"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { ArrowLeft, CalendarDays } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { toast } from "@acme/ui/toast";

import EventForm from "../../_components/EventForm";
import { LoadingSpinner } from "../../_components/LoadingSpinner";

export default function EventCreatePage() {
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const ensureUser = useMutation(api.core.users.createOrGetUser);
  const { user } = useUser();

  // Early return if auth is loading or user is not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      toast.error("You must be logged in to access this page.");
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  if (authLoading) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-muted-foreground">Authenticating...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // This state should ideally be brief due to the useEffect redirect,
    // but it's a safeguard.
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">
          Redirecting to login...
        </p>
      </div>
    );
  }

  // At this point, isAuthenticated is true and authLoading is false.
  // We can now safely call hooks that depend on authentication.
  return (
    <AuthenticatedCreatePage
      ensureUser={ensureUser}
      router={router}
      userId={user?.id}
    />
  );
}

function AuthenticatedCreatePage({
  ensureUser,
  router,
  userId,
}: {
  ensureUser: ReturnType<
    typeof useMutation<typeof api.core.users.createOrGetUser>
  >;
  router: ReturnType<typeof useRouter>;
  userId?: string;
}) {
  const isAdminResult = useQuery(api.accessControl.checkIsAdmin);

  // Get all user calendars
  const calendars = useQuery(
    api.calendar.queries.getCalendars,
    userId ? { userId } : "skip",
  );

  useEffect(() => {
    void ensureUser().catch((error) => {
      console.error("Failed to ensure user exists:", error);
      toast.error("Error verifying user session. Please try logging in again.");
    });
  }, [ensureUser]);

  useEffect(() => {
    if (isAdminResult === false) {
      toast.error("You are not authorized to view this page.");
      router.push("/dashboard");
    }
  }, [isAdminResult, router]);

  if (isAdminResult === undefined || calendars === undefined) {
    return (
      <div className="container p-8">
        <div className="flex h-96 items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isAdminResult === false) {
    return (
      <div className="container p-8">
        <p className="text-center text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  // Filter and prepare calendars
  const filteredCalendars =
    calendars?.filter((calendar) => calendar !== null) ?? [];

  if (!userId) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to create event</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to create calendar events
          </p>
        </div>
      </div>
    );
  }

  // At this point, isAdminResult is true.
  return (
    <div className="container py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/calendar")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Calendar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Event</h1>
          <p className="text-muted-foreground">
            Add a new event to your calendar
          </p>
        </div>
      </div>

      {filteredCalendars.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Calendars Available</CardTitle>
            <CardDescription>
              You need a calendar to create an event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don't have any calendars. Create a calendar first to continue.
            </p>
            <Button onClick={() => router.push("/admin/calendar/create")}>
              Create Calendar
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              <span>Event Details</span>
            </CardTitle>
            <CardDescription>
              Enter the details for your new event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              calendars={filteredCalendars}
              userId={userId}
              submitButtonText="Create Event"
              onSubmitSuccess={(eventId) => {
                router.push(`/admin/calendar/events/${eventId}`);
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
