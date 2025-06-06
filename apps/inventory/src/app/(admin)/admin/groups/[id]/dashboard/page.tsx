import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

interface DashboardPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: DashboardPageProps) {
  const id = params.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | Dashboard",
      };
    }

    return {
      title: `${group.name} Dashboard | WSA App`,
    };
  } catch (error) {
    return {
      title: "Group Dashboard | WSA App",
    };
  }
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const id = params.id;

  const convex = getConvex();
  const group = await convex.query(api.groups.queries.getGroupById, {
    groupId: id as Id<"groups">,
  });

  if (!group) {
    notFound();
  }

  // Get group stats (could be expanded later)
  const memberCount = group.memberCount || 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Group Dashboard</h2>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Members</CardTitle>
            <CardDescription>Total group members</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Activity</CardTitle>
            <CardDescription>Recent engagement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">--</div>
            <p className="text-xs text-muted-foreground">Coming soon</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">No upcoming events</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="discussions">Discussions</TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No recent activity to display
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="tasks" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Task management coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="discussions" className="mt-4 space-y-4">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                No recent discussions
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
