"use client";

import { ChevronLeft } from "lucide-react";

import { Button } from "@acme/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@acme/ui/tabs";

import { BlockedUsersList } from "~/components/social/BlockedUsersList";
import { ContentFilterSettings } from "~/components/social/ContentFilterSettings";

export default function SocialSettingsPage() {
  return (
    <div className="container max-w-4xl py-6">
      <div className="mb-6 flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="mr-2"
          onClick={() => window.history.back()}
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-bold">Social Settings</h1>
      </div>

      <Tabs defaultValue="privacy" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="privacy">Privacy & Safety</TabsTrigger>
          <TabsTrigger value="blocked">Blocked Users</TabsTrigger>
        </TabsList>

        <TabsContent value="privacy" className="space-y-6">
          <ContentFilterSettings />

          {/* We'll add a placeholder for BlockedUsersList component */}
          <div className="hidden">
            <BlockedUsersList />
          </div>
        </TabsContent>

        <TabsContent value="blocked">
          {/* This component will be implemented separately */}
          <p className="mb-6 text-muted-foreground">
            Manage users you&apos;ve blocked from interacting with your content
            or profile.
          </p>

          <BlockedUsersList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
