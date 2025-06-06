"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui";

import { ContactForm } from "~/app/(frontend)/contacts/_components/ContactForm";
import { ContactFormValues } from "~/app/(frontend)/contacts/_components/ContactFormTypes";

export default function AdminEditContactPage() {
  const router = useRouter();
  const { user } = useUser();
  const params = useParams();
  // Unwrap params with React.use() before accessing properties
  const unwrappedParams = React.use(params);
  const idParam =
    typeof unwrappedParams.id === "string" ? unwrappedParams.id : "";

  // Cast the ID for use with the query
  const contactId = idParam as Id<"contacts">;

  // Always call hooks at the top level
  const [isSubmitting, setIsSubmitting] = useState(false);
  const updateContact = useMutation(api.contacts.crud.updateContact);
  const contact = useQuery(api.contacts.queries.getContact, {
    contactId,
  });

  // If we don't have a valid ID, redirect
  if (!idParam) {
    router.push("/admin/contacts");
    return null;
  }

  const handleUpdateContact = async (formData: ContactFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await updateContact({
        contactId,
        updates: formData,
      });

      // Redirect back to contact detail view
      router.push(`/admin/contacts/${contactId}`);
    } catch (error) {
      console.error("Error updating contact:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Loading state
  if (!contact) {
    return (
      <div className="flex h-40 items-center justify-center">
        <div className="text-muted-foreground">Loading contact data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => router.push(`/admin/contacts/${contactId}`)}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">
          Edit Contact: {contact.firstName} {contact.lastName}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>Update the details for this contact</CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm
            onSubmit={handleUpdateContact}
            isSubmitting={isSubmitting}
            initialData={contact}
          />
        </CardContent>
      </Card>
    </div>
  );
}
