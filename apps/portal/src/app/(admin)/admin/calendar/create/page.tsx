"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

import EventForm from "../_components/EventForm";
import { LoadingSpinner } from "../components/LoadingSpinner";

export default function CreateEventPage() {
  const router = useRouter();
  const { user } = useUser();

  // Get all user calendars
  const userId = user?.id;
  const calendars = useQuery(
    api.calendar.queries.getCalendars,
    userId ? { userId } : "skip",
  );

  // Filter and prepare calendars
  const filteredCalendars =
    calendars?.filter((calendar) => calendar !== null) ?? [];

  if (!userId) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold">Sign in to create an event</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be signed in to create and manage calendar events
          </p>
        </div>
      </div>
    );
  }

  const isLoading = calendars === undefined;

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

      {isLoading ? (
        <div className="flex h-[400px] items-center justify-center">
          <LoadingSpinner />
        </div>
      ) : filteredCalendars.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No Calendars Available</CardTitle>
            <CardDescription>
              You need to create a calendar before adding events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="mb-4">
              You don't have any calendars yet. Create a calendar first to add
              events to it.
            </p>
            <Button asChild>
              <Link href="/admin/calendar/new">Create Calendar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Fill in the details for your new event
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EventForm
              calendars={filteredCalendars}
              userId={userId}
              defaultDate={new Date()}
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
