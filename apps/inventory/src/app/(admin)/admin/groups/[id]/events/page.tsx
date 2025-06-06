import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";
import { CalendarRange } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface EventsPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: EventsPageProps) {
  const id = params.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | Events",
      };
    }

    return {
      title: `${group.name} Events | WSA App`,
      description: `Calendar and events for the ${group.name} group`,
    };
  } catch (error) {
    return {
      title: "Group Events | WSA App",
    };
  }
}

export default async function EventsPage({ params }: EventsPageProps) {
  const id = params.id;

  const convex = getConvex();
  const group = await convex.query(api.groups.queries.getGroupById, {
    groupId: id as Id<"groups">,
  });

  if (!group) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Events Calendar</h2>
      </div>

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
  );
}
