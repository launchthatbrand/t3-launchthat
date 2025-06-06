"use client";

import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { AlertCircle, CheckCircle, PlayIcon, Timer } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { useMutation, useQuery } from "convex/react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Id } from "@/convex/_generated/dataModel";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export interface RuleTesterProps {
  integrationId: Id<"mondayIntegration">;
  ruleId?: Id<"mondaySyncRules">;
  ruleDraft?: any; // Draft rule data for testing rules before saving
}

export function RuleTester({
  integrationId,
  ruleId,
  ruleDraft,
}: RuleTesterProps) {
  const [testDocumentId, setTestDocumentId] = useState("");
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [testError, setTestError] = useState<string | null>(null);

  // Get available document IDs for testing
  const availableDocuments = useQuery(
    api.monday.queries.getAvailableDocumentsForTesting,
    ruleId || ruleDraft
      ? {
          integrationId,
          ruleId,
          triggerTable: ruleDraft?.triggerTable,
        }
      : "skip",
  );

  // Mutation to test a rule
  const testRule = useMutation(api.monday.mutations.testSyncRule);

  const handleRunTest = async () => {
    if (!testDocumentId) {
      setTestError("Please enter a document ID to test with");
      return;
    }

    setIsTesting(true);
    setTestResult(null);
    setTestError(null);

    try {
      const result = await testRule({
        ruleId,
        integrationId,
        documentId: testDocumentId,
        draftRule: ruleDraft,
      });

      setTestResult(result);
    } catch (err) {
      setTestError(
        err instanceof Error ? err.message : "An unknown error occurred",
      );
    } finally {
      setIsTesting(false);
    }
  };

  // If we don't have a rule ID or draft data, show a message
  if (!ruleId && !ruleDraft) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Tester</CardTitle>
          <CardDescription>
            Test your synchronization rule before saving
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTitle>No rule to test</AlertTitle>
            <AlertDescription>
              Save your rule or provide draft data to enable testing
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // If we're loading document data
  if (availableDocuments === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rule Tester</CardTitle>
          <CardDescription>
            Test your synchronization rule before saving
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-32" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rule Tester</CardTitle>
        <CardDescription>
          Test your synchronization rule with real data before saving
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="documentId">Document ID to Test</Label>
          <div className="flex gap-2">
            <Input
              id="documentId"
              value={testDocumentId}
              onChange={(e) => setTestDocumentId(e.target.value)}
              placeholder="Enter a document ID to test with"
              className="flex-1"
            />
            <Button
              onClick={handleRunTest}
              disabled={isTesting || !testDocumentId}
            >
              {isTesting ? (
                <Timer className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <PlayIcon className="mr-2 h-4 w-4" />
              )}
              {isTesting ? "Running..." : "Run Test"}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Enter the ID of a document from{" "}
            {ruleDraft?.triggerTable || "the trigger table"} to test this rule
            with
          </p>
        </div>

        {availableDocuments && availableDocuments.length > 0 && (
          <div className="rounded-md bg-muted p-3">
            <p className="mb-2 text-sm font-medium">
              Available document IDs for testing:
            </p>
            <div className="flex flex-wrap gap-2">
              {availableDocuments.map((doc: any) => (
                <Badge
                  key={doc.id}
                  variant="outline"
                  className="cursor-pointer hover:bg-accent"
                  onClick={() => setTestDocumentId(doc.id)}
                >
                  {doc.id.substring(0, 8)}...
                  {doc.label && (
                    <span className="ml-1 opacity-70">({doc.label})</span>
                  )}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {testError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Test Failed</AlertTitle>
            <AlertDescription>{testError}</AlertDescription>
          </Alert>
        )}

        {testResult && (
          <div className="space-y-4">
            <Alert variant={testResult.success ? "default" : "destructive"}>
              {testResult.success ? (
                <CheckCircle className="h-4 w-4" />
              ) : (
                <AlertCircle className="h-4 w-4" />
              )}
              <AlertTitle>
                {testResult.success ? "Test Succeeded" : "Test Failed"}
              </AlertTitle>
              <AlertDescription>{testResult.message}</AlertDescription>
            </Alert>

            <div className="space-y-2">
              <Label>Test Results</Label>
              <Textarea
                readOnly
                className="h-48 font-mono"
                value={JSON.stringify(testResult.details, null, 2)}
              />
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-xs text-muted-foreground">
        Testing rules helps identify issues before they affect your live data
      </CardFooter>
    </Card>
  );
}
