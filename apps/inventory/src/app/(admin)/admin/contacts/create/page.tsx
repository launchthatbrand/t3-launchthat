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

import { ContactForm } from "~/app/(frontend)/contacts/_components/ContactForm";
import { ContactFormValues } from "~/app/(frontend)/contacts/_components/ContactFormTypes";

export default function AdminCreateContactPage() {
  const router = useRouter();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createContact = useMutation(api.contacts.crud.createContact);

  const handleCreateContact = async (formData: ContactFormValues) => {
    if (!user?.id) return;

    setIsSubmitting(true);
    try {
      await createContact({
        userId: user.id,
        contactData: formData,
      });

      // Redirect back to contacts list
      router.push("/admin/contacts");
    } catch (error) {
      console.error("Error creating contact:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          onClick={() => router.push("/admin/contacts")}
          className="mr-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold">Create New Contact</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Contact Information</CardTitle>
          <CardDescription>
            Enter the details for the new contact
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
