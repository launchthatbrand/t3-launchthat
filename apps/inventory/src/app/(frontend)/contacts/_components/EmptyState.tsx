"use client";

import { useRouter } from "next/navigation";
import { FilePlus, Search, Users } from "lucide-react";

import { Button, Card, CardContent } from "@acme/ui";

interface EmptyStateProps {
  type: "contacts" | "search" | "import";
  isAdmin?: boolean;
}

export const EmptyState = ({ type, isAdmin = false }: EmptyStateProps) => {
  const router = useRouter();

  const getEmptyStateContent = () => {
    switch (type) {
      case "contacts":
        if (isAdmin) {
          return {
            icon: <Users className="h-12 w-12 text-muted-foreground" />,
            title: "No contacts yet",
            description:
              "Create your first contact to get started with your CRM.",
            action: (
              <Button onClick={() => router.push("/admin/contacts/create")}>
                Create Contact
              </Button>
            ),
          };
        } else {
          return {
            icon: <Users className="h-12 w-12 text-muted-foreground" />,
            title: "No contacts yet",
            description:
              "You don't have any contacts yet. Contact the administrator if you need to see contacts here.",
            action: null,
          };
        }
      case "search":
        return {
          icon: <Search className="h-12 w-12 text-muted-foreground" />,
          title: "No results found",
          description:
            "We couldn't find any contacts matching your search criteria.",
          action: (
            <Button variant="outline" onClick={() => router.back()}>
              Clear Search
            </Button>
          ),
        };
      case "import":
        return {
          icon: <FilePlus className="h-12 w-12 text-muted-foreground" />,
          title: "Import Contacts",
          description:
            "You can import contacts from a CSV file to quickly build your contact list.",
          action: (
            <Button
              onClick={() =>
                router.push(
                  isAdmin ? "/admin/contacts/import" : "/contacts/import",
                )
              }
            >
              Import Contacts
            </Button>
          ),
        };
      default:
        return {
          icon: <Users className="h-12 w-12 text-muted-foreground" />,
          title: "No data available",
          description: "There's nothing to display here yet.",
          action: null,
        };
    }
  };

  const content = getEmptyStateContent();

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 rounded-full bg-muted p-4">{content.icon}</div>
          <h3 className="mb-2 text-xl font-semibold">{content.title}</h3>
          <p className="mb-6 max-w-md text-muted-foreground">
            {content.description}
          </p>
          {content.action}
        </div>
      </CardContent>
    </Card>
  );
};
