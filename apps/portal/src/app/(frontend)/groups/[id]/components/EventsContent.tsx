"use client";

import { notFound } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { TabsContent } from "@acme/ui/tabs";

export function EventsContent({ groupId }: { groupId: string }) {
  if (!groupId) {
    notFound();
  }

  return (
    <TabsContent value="events" className="outline-none">
      <h2 className="text-xl font-semibold">Events Calendar</h2>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
          </CardHeader>
          <CardContent className="flex min-h-[300px] flex-col items-center justify-center">
            <CalendarRange className="mb-4 h-16 w-16 text-muted-foreground" />
            <p className="text-lg font-medium">No upcoming events</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Group events will appear here when scheduled
            </p>
          </CardContent>
        </Card>
      </div>
    </TabsContent>
  );
}
