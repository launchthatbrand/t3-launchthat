import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

import { EventsContent } from "../components/EventsContent";

interface EventsPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: EventsPageProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;

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
  } catch {
    return {
      title: "Group Events | WSA App",
    };
  }
}

export default async function EventsPage({ params }: EventsPageProps) {
  // Await params before accessing its properties
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // Just do a basic check that the group exists
  const convex = getConvex();
  try {
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      notFound();
    }

    return <EventsContent groupId={id} />;
  } catch (error) {
    console.error("Error fetching group:", error);
    return (
      <div className="py-8 text-center text-muted-foreground">
        Unable to load events calendar
      </div>
    );
  }
}
