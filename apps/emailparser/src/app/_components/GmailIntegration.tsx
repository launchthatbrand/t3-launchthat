"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/components/Badge";
import { Button } from "@acme/ui/components/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/components/Card";
import { Spinner } from "@acme/ui/components/Spinner";

import { api } from "../../../convex/_generated/api";

const GmailIntegration = () => {
  const [syncInProgress, setSyncInProgress] = useState(false);

  // Check if user has Gmail integration enabled
  const hasIntegration = useQuery(api.gmail.hasGmailIntegration);

  // Actions for Gmail
  const syncEmails = useMutation(api.gmail.syncEmails);

  // Handle sync button click
  const handleSyncClick = async () => {
    try {
      setSyncInProgress(true);
      await syncEmails({ maxResults: 50 });
    } catch (error) {
      console.error("Error syncing emails:", error);
    } finally {
      // Set a timeout to disable the spinner after a reasonable time
      // In a real app, you might want to poll a sync status endpoint
      setTimeout(() => {
        setSyncInProgress(false);
      }, 5000);
    }
  };

  if (hasIntegration === undefined) {
    return (
      <div className="flex items-center justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (hasIntegration === false) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gmail Integration</CardTitle>
          <CardDescription>
            Connect your Gmail account to parse emails
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-l-4 border-orange-400 bg-orange-50 p-4 text-orange-700">
            <p className="font-medium">Google account not connected</p>
            <p className="mt-1 text-sm">
              You need to sign in with Google and grant access to Gmail to use
              this feature.
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <p className="text-sm text-gray-500">
            Please sign out and sign in again with Google to enable Gmail
            integration.
          </p>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gmail Integration</CardTitle>
            <CardDescription>
              Parse and process emails from your Gmail account
            </CardDescription>
          </div>
          <Badge variant="success" className="ml-2">
            Connected
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border-l-4 border-green-400 bg-green-50 p-4 text-green-700">
            <p className="font-medium">Your Gmail account is connected</p>
            <p className="mt-1 text-sm">
              You can now sync emails from your Gmail account to parse and
              process them.
            </p>
          </div>

          <div className="rounded-md border p-4">
            <h3 className="mb-2 font-medium">Synchronization</h3>
            <p className="mb-4 text-sm text-gray-600">
              Click the button below to fetch recent emails from your Gmail
              account.
            </p>
            <Button
              onClick={handleSyncClick}
              disabled={syncInProgress}
              className="w-full"
            >
              {syncInProgress ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Syncing emails...
                </>
              ) : (
                "Sync Gmail"
              )}
            </Button>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <p className="text-xs text-gray-500">
          Only emails you have access to will be fetched. Your data is securely
          stored and processed according to our privacy policy.
        </p>
      </CardFooter>
    </Card>
  );
};

export default GmailIntegration;
