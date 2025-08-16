"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { formatPhoneNumber } from "@convex-config/shared";
import { useQuery } from "convex/react";
import { ArrowLeft, Building, Edit, Mail, Phone } from "lucide-react";

import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
} from "@acme/ui";

export default function ContactDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  // Unwrap params with React.use() before accessing properties
  const unwrappedParams = React.use(params);
  const idParam =
    typeof unwrappedParams.id === "string" ? unwrappedParams.id : "";

  // Cast the ID for use with the query
  const contactId = idParam as Id<"contacts">;

  // Always call hooks at the top level
  const contact = useQuery(api.contacts.queries.getContact, {
    contactId,
  });

  // If we don't have a valid ID or user, redirect
  if (!idParam || !user) {
    router.push("/contacts");
    return null;
  }

  // Loading state
  if (!contact) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex h-40 items-center justify-center">
          <div className="text-muted-foreground">Loading contact...</div>
        </div>
      </div>
    );
  }

  // Ensure user can only access their own contacts (based on createdBy)
  if (contact.createdBy !== user.id) {
    router.push("/contacts");
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center">
          <Button
            variant="ghost"
            onClick={() => router.push("/contacts")}
            className="mr-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Contacts
          </Button>
          <h1 className="text-3xl font-bold">
            {contact.firstName} {contact.lastName}
          </h1>
        </div>
        {contact.createdBy === user.id && (
          <Button
            variant="outline"
            onClick={() => router.push(`/contacts/${contactId}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit Contact
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center">
              <Mail className="mr-3 h-5 w-5 text-muted-foreground" />
              <div>
                <h3 className="text-sm font-medium">Email</h3>
                <p>{contact.email}</p>
              </div>
            </div>

            {contact.phone && (
              <div className="flex items-center">
                <Phone className="mr-3 h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Phone</h3>
                  <p>{formatPhoneNumber(contact.phone)}</p>
                </div>
              </div>
            )}

            {contact.company && (
              <div className="flex items-center">
                <Building className="mr-3 h-5 w-5 text-muted-foreground" />
                <div>
                  <h3 className="text-sm font-medium">Company</h3>
                  <p>{contact.company}</p>
                </div>
              </div>
            )}

            <Separator />

            {contact.customerType && (
              <div>
                <h3 className="text-sm font-medium">Customer Type</h3>
                <Badge className="mt-1">
                  {contact.customerType.replace("-", " ")}
                </Badge>
              </div>
            )}

            {contact.leadStatus && (
              <div>
                <h3 className="text-sm font-medium">Lead Status</h3>
                <Badge variant="outline" className="mt-1">
                  {contact.leadStatus}
                </Badge>
              </div>
            )}

            {contact.tags && contact.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium">Tags</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {contact.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
            {contact.notes ? (
              <div className="whitespace-pre-line">{contact.notes}</div>
            ) : (
              <p className="text-muted-foreground">No notes available</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
