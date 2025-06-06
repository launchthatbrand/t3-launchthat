"use client";

import Link from "next/link";
import {
  ArrowRight,
  ArrowUpDown,
  Calendar,
  Globe,
  Link as LinkIcon,
  List,
} from "lucide-react";

import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";

export default function IntegrationsPage() {
  // Available integrations
  const integrations = [
    {
      id: "monday",
      name: "Monday.com",
      description: "Sync products, orders, and more with Monday.com boards.",
      icon: LinkIcon,
      url: "/admin/integrations/monday",
      status: "available",
    },
    {
      id: "wordpress",
      name: "WordPress",
      description: "Connect with WordPress to automate content workflows.",
      icon: Globe,
      url: "/admin/integrations/wordpress",
      status: "available",
    },
    {
      id: "calendar",
      name: "Calendar",
      description: "Sync events and appointments with external calendars.",
      icon: Calendar,
      url: "/admin/integrations/calendar",
      status: "coming-soon",
    },
    {
      id: "csv",
      name: "CSV Import/Export",
      description: "Import and export data via CSV files.",
      icon: ArrowUpDown,
      url: "/admin/integrations/csv",
      status: "coming-soon",
    },
  ];

  return (
    <div className="container py-10">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">Integrations</h1>
          <p className="text-muted-foreground">
            Connect your inventory system with external services and platforms.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/admin/integrations/connections">
            <List className="mr-2 h-4 w-4" />
            Manage Connections
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id}>
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="rounded-md bg-muted p-2">
                  <integration.icon className="h-6 w-6" />
                </div>
                <CardTitle>{integration.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">
                {integration.description}
              </CardDescription>
            </CardContent>
            <CardFooter>
              {integration.status === "available" ? (
                <Button asChild>
                  <Link href={integration.url}>
                    Configure
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>
                  Coming Soon
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
