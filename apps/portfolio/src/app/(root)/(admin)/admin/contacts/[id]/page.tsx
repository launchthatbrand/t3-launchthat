"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft, Edit, Trash } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Separator,
} from "@acme/ui";

// Define a placeholder for interactions/notes component
const ContactInteractions = ({
  _contactId,
}: {
  _contactId: Id<"contacts">;
}) => {
  // This would be implemented later when interactions functionality is added
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Interactions</CardTitle>
        <CardDescription>
          View all recent interactions with this contact
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">No recent interactions</p>
      </CardContent>
    </Card>
  );
};

export default function AdminViewContactPage() {
  const router = useRouter();
  const params = useParams();
  // Unwrap params with React.use() before accessing properties
  const unwrappedParams = React.use(params);
  const idParam =
    typeof unwrappedParams.id === "string" ? unwrappedParams.id : "";

  // Cast the ID only when using it in the query
  const contactId = idParam as Id<"contacts">;

  // Always call hooks at the top level, regardless of conditions
  const contact = useQuery(api.contacts.queries.getContact, {
    contactId,
  });
  const deleteContact = useMutation(api.contacts.crud.deleteContact);

  // Handle delete contact
  const handleDeleteContact = async () => {
    if (confirm("Are you sure you want to delete this contact?")) {
      await deleteContact({ contactId });
      router.push("/admin/contacts");
    }
  };

  // If we don't have a valid ID, redirect
  if (!idParam) {
    router.push("/admin/contacts");
    return null;
  }

  if (!contact) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-muted-foreground">Loading contact...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/admin/contacts")}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">
            {contact.firstName} {contact.lastName}
          </h1>
          {contact.customerType && (
            <Badge className="ml-4" variant="outline">
              {contact.customerType}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/admin/contacts/${contactId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button variant="destructive" onClick={handleDeleteContact}>
            <Trash className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Contact Info */}
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">
                Email
              </h3>
              <p>{contact.email}</p>
            </div>

            {contact.phone && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Phone
                </h3>
                <p>{contact.phone}</p>
              </div>
            )}

            {contact.company && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Company
                </h3>
                <p>{contact.company}</p>
              </div>
            )}

            {contact.jobTitle && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Job Title
                </h3>
                <p>{contact.jobTitle}</p>
              </div>
            )}

            <Separator />

            {contact.tags && contact.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Tags
                </h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {contact.leadStatus && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground">
                  Lead Status
                </h3>
                <Badge variant="outline">{contact.leadStatus}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interactions & Activity */}
        <div className="col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notes</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.notes ? (
                <p>{contact.notes}</p>
              ) : (
                <p className="text-muted-foreground">No notes available</p>
              )}
            </CardContent>
          </Card>

          <ContactInteractions _contactId={contactId} />
        </div>
      </div>
    </div>
  );
}
