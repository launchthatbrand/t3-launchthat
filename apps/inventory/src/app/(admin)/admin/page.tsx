"use client";

import React from "react";
import Link from "next/link";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
      <p className="text-muted-foreground">
        Welcome to the portal admin dashboard. From here you can manage content,
        users, and settings.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Global Search</CardTitle>
            <CardDescription>
              Test the global search functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              The global search allows users to find content across the entire
              portal including posts, events, downloads, and products.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/search">View Search Test</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Users</CardTitle>
            <CardDescription>Manage user accounts</CardDescription>
          </CardHeader>
          <CardContent>
            <p>View, edit, and manage user accounts and permissions.</p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>Configure portal settings</CardDescription>
          </CardHeader>
          <CardContent>
            <p>
              Update site configuration, appearance, and integration settings.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild>
              <Link href="/admin/settings">Manage Settings</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
