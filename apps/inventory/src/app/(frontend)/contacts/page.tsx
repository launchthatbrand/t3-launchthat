"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "convex/react";

import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
} from "@acme/ui";

import { ContactList } from "./_components/ContactList";
import { CustomerTypeFilter } from "./_components/CustomerTypeFilter";
import { TagFilter } from "./_components/TagFilter";

export default function ContactsPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [customerType, setCustomerType] = useState<string | null>(null);

  // Get all available tags for filtering
  const tags = useQuery(api.contacts.queries.getTags, {
    userId: user?.id,
  });

  // Show loading state if user data is not loaded yet
  if (!isLoaded) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[70vh] w-full items-center justify-center">
          <div className="text-center">
            <p className="text-lg text-gray-500">Loading contacts...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show login prompt if no user
  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex h-[70vh] w-full items-center justify-center">
          <Card className="w-[400px]">
            <CardHeader>
              <CardTitle>Authentication Required</CardTitle>
              <CardDescription>
                Please sign in to access your contacts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => router.push("/login")} className="w-full">
                Sign In
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Contacts</h1>
      </div>

      <div className="mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Search Contacts</CardTitle>
            <CardDescription>
              Find contacts by name, email, or phone number
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="space-y-6">
          <CustomerTypeFilter value={customerType} onChange={setCustomerType} />
          <TagFilter
            tags={tags ?? []}
            selectedTags={selectedTags}
            onChange={setSelectedTags}
          />
        </div>
        <div className="md:col-span-3">
          <ContactList
            userId={user.id}
            search={searchQuery}
            tags={selectedTags}
            customerType={customerType}
          />
        </div>
      </div>
    </div>
  );
}
