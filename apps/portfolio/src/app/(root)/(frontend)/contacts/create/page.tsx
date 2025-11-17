"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { ArrowLeft } from "lucide-react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui";

import { ContactForm } from "~/app/(root)/(frontend)/contacts/_components/ContactForm";
import { ContactFormValues } from "~/app/(root)/(frontend)/contacts/_components/ContactFormTypes";

export default function CreateContactPage() {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createContact = useMutation(api.contacts.crud.createContact);

  // Redirect if not logged in
  if (isLoaded && !user) {
    router.push("/login");
    return null;
  }

  const handleCreateContact = async (formData: ContactFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await createContact({
        userId: user.id,
        contactData: formData,
      });

      // Redirect back to contacts list
      router.push("/contacts");
    } catch (error) {
      console.error("Error creating contact:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show loading state if user data is not loaded yet
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-40 items-center justify-center">
          <div className="text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/contacts")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Contacts
        </Button>
        <h1 className="text-3xl font-bold">Create New Contact</h1>
      </div>

      <Card className="border shadow">
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Enter the details for your new contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactForm
            onSubmit={handleCreateContact}
            isSubmitting={isSubmitting}
          />
        </CardContent>
      </Card>
    </div>
  );
}
