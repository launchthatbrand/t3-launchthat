import type { Id } from "@/convex/_generated/dataModel";
import { notFound } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { getConvex } from "@/lib/convex";
import { CalendarDays, Users } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@acme/ui/avatar";
import { Badge } from "@acme/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";

interface AboutPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: AboutPageProps) {
  const id = params.id;

  try {
    const convex = getConvex();
    const group = await convex.query(api.groups.queries.getGroupById, {
      groupId: id as Id<"groups">,
    });

    if (!group) {
      return {
        title: "Group Not Found | About",
      };
    }

    return {
      title: `About ${group.name} | WSA App`,
      description: group.description.substring(0, 160),
    };
  } catch (error) {
    return {
      title: "About Group | WSA App",
    };
  }
}

export default async function AboutPage({ params }: AboutPageProps) {
  const id = params.id;

  const convex = getConvex();
  const group = await convex.query(api.groups.queries.getGroupById, {
    groupId: id as Id<"groups">,
  });

  if (!group) {
    notFound();
  }

  // Format creation date
  const creationDate = new Date(group._creationTime);
  const formattedDate = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(creationDate);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">About {group.name}</h2>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent className="prose dark:prose-invert max-w-none">
              {group.description}
            </CardContent>
          </Card>

          {group.categoryTags && group.categoryTags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {group.categoryTags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Group Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span>
                  <strong>{group.memberCount}</strong>{" "}
                  {group.memberCount === 1 ? "member" : "members"}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-muted-foreground" />
                <span>Created on {formattedDate}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    group.privacy === "public"
                      ? "default"
                      : group.privacy === "restricted"
                        ? "secondary"
                        : "outline"
                  }
                >
                  {group.privacy.charAt(0).toUpperCase() +
                    group.privacy.slice(1)}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {group.privacy === "public"
                    ? "Anyone can join"
                    : group.privacy === "restricted"
                      ? "Requires approval to join"
                      : "Members must be invited"}
                </span>
              </div>
            </CardContent>
          </Card>

          {group.creator && (
            <Card>
              <CardHeader>
                <CardTitle>Created By</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage
                      src={group.creator.image}
                      alt={group.creator.name}
                    />
                    <AvatarFallback>
                      {group.creator.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{group.creator.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Group Admin
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

