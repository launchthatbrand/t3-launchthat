"use client";

import React from "react";
import Link from "next/link";
import { api } from "@/convex/_generated/api";
import { useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Skeleton } from "@acme/ui/skeleton";

export default function Dashboard() {
  const feedItems = useQuery(api.socialfeed.queries.getUniversalFeed, {
    paginationOpts: { numItems: 4, cursor: null },
  });

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
        {/* Main Content Area */}
        <div className="space-y-4 lg:col-span-3">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Course Progress
                </CardTitle>
                {/* Add Icon here */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">75% Completed</div>
                <p className="text-xs text-muted-foreground">
                  Across all enrolled courses
                </p>
                <Skeleton className="mt-2 h-4 w-[150px]" />
              </CardContent>
              <CardContent>
                <Link href="/courses">
                  <Button variant="link" className="px-0">
                    View all
                  </Button>
                </Link>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Social Feed Activity
                </CardTitle>
                {/* Add Icon here */}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {feedItems?.length ?? 0} Engagements
                </div>
                <p className="text-xs text-muted-foreground">
                  New comments & likes
                </p>
                <Skeleton className="mt-2 h-4 w-[180px]" />
              </CardContent>
              <CardContent>
                <Link href="/social/feed">
                  <Button variant="link" className="px-0">
                    View all
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
          {/* Placeholder for larger sections or charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Overview</CardTitle>
              </CardHeader>
              <CardContent className="pl-2">
                {/* Chart or more detailed overview here */}
                <Skeleton className="h-[200px] w-full" />
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {!feedItems ? (
                    <>
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                      <Skeleton className="h-6 w-full" />
                    </>
                  ) : feedItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No recent activity.
                    </p>
                  ) : (
                    feedItems.map((item) => (
                      <div key={item._id} className="text-sm">
                        <span className="font-medium">
                          {item.creator.name}:{" "}
                        </span>
                        {item.content.substring(0, 50)}...
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-4 lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Recent Downloads
              </CardTitle>
              {/* Add Icon here */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">5 New Files</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
              <Skeleton className="mt-2 h-4 w-[100px]" />
            </CardContent>
            <CardContent>
              <Link href="/downloads">
                <Button variant="link" className="px-0">
                  View all
                </Button>
              </Link>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Upcoming Events
              </CardTitle>
              {/* Add Icon here */}
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3 Events Next Week</div>
              <p className="text-xs text-muted-foreground">
                Webinars and Workshops
              </p>
              <Skeleton className="mt-2 h-4 w-[120px]" />
            </CardContent>
            <CardContent>
              <Link href="/events">
                <Button variant="link" className="px-0">
                  View all
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
