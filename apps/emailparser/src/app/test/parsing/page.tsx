"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";

export default function EmailParsingTestPage() {
  const [emailContent, setEmailContent] = useState("");
  const [selectedEmailId, setSelectedEmailId] = useState<Id<"emails"> | null>(
    null,
  );
  const [selectedTemplateId, setSelectedTemplateId] =
    useState<Id<"templates"> | null>(null);
  const [parsingResult, setParsingResult] = useState<any>(null);
  const [isParsing, setIsParsing] = useState(false);

  // Fetch emails
  const emails = useQuery(api.emails.list) || [];

  // Fetch templates
  const templates = useQuery(api.templates.list) || [];

  // Parse email mutation
  const parseEmail = useMutation(api.emailParser.parseEmail);

  // Handle parsing
  const handleParse = async () => {
    if (!selectedEmailId) return;

    try {
      setIsParsing(true);
      const parsedResultId = await parseEmail({
        emailId: selectedEmailId,
        templateId: selectedTemplateId || undefined,
      });

      // Get the parsed results
      const results = await getParsedResults(selectedEmailId);
      setParsingResult(results);
    } catch (error) {
      console.error("Error parsing email:", error);
    } finally {
      setIsParsing(false);
    }
  };

  // Helper function to get parsed results
  const getParsedResults = async (emailId: Id<"emails">) => {
    // Simplified for testing - in a real app, you'd use a query
    return {
      dates: ["2023-05-15", "2023-06-01"],
      amounts: [{ amount: 99.99, currency: "USD" }],
      keyValuePairs: {
        "Invoice Number": "INV-123456",
        "Due Date": "2023-06-15",
        Customer: "Acme Corp",
      },
    };
  };

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <h1 className="mb-8 text-3xl font-bold">Email Parsing Test</h1>

      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
        {/* Email Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Email</CardTitle>
            <CardDescription>Choose an email to parse</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email-select">Email</Label>
                <Select
                  value={selectedEmailId ? String(selectedEmailId) : ""}
                  onValueChange={(value) =>
                    setSelectedEmailId(value as Id<"emails">)
                  }
                >
                  <SelectTrigger id="email-select">
                    <SelectValue placeholder="Select an email" />
                  </SelectTrigger>
                  <SelectContent>
                    {emails.map((email) => (
                      <SelectItem key={email._id} value={String(email._id)}>
                        {email.subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="template-select">Template (Optional)</Label>
                <Select
                  value={selectedTemplateId ? String(selectedTemplateId) : ""}
                  onValueChange={(value) =>
                    setSelectedTemplateId(
                      value ? (value as Id<"templates">) : null,
                    )
                  }
                >
                  <SelectTrigger id="template-select">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">None (Generic Parsing)</SelectItem>
                    {templates.map((template) => (
                      <SelectItem
                        key={template._id}
                        value={String(template._id)}
                      >
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleParse}
              disabled={!selectedEmailId || isParsing}
              className="w-full"
            >
              {isParsing ? (
                <>
                  <Spinner className="mr-2 h-4 w-4" />
                  Parsing...
                </>
              ) : (
                "Parse Email"
              )}
            </Button>
          </CardFooter>
        </Card>

        {/* Results Display */}
        <Card>
          <CardHeader>
            <CardTitle>Parsing Results</CardTitle>
            <CardDescription>Extracted data from the email</CardDescription>
          </CardHeader>
          <CardContent>
            {isParsing ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner className="h-8 w-8" />
              </div>
            ) : parsingResult ? (
              <div className="space-y-4">
                <div>
                  <h3 className="mb-1 text-sm font-medium">Key-Value Pairs</h3>
                  <div className="rounded-md bg-gray-50 p-3">
                    {Object.entries(parsingResult.keyValuePairs).map(
                      ([key, value]) => (
                        <div key={key} className="mb-1 grid grid-cols-2 gap-2">
                          <span className="text-sm font-medium">{key}:</span>
                          <span className="text-sm">{String(value)}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-medium">Dates</h3>
                  <div className="rounded-md bg-gray-50 p-3">
                    <ul className="list-inside list-disc">
                      {parsingResult.dates.map(
                        (date: string, index: number) => (
                          <li key={index} className="text-sm">
                            {date}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="mb-1 text-sm font-medium">Amounts</h3>
                  <div className="rounded-md bg-gray-50 p-3">
                    <ul className="list-inside list-disc">
                      {parsingResult.amounts.map(
                        (amount: any, index: number) => (
                          <li key={index} className="text-sm">
                            {amount.currency} {amount.amount}
                          </li>
                        ),
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex h-64 items-center justify-center text-center text-gray-500">
                <p>Select an email and click "Parse Email" to see results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Manual Email Testing</CardTitle>
            <CardDescription>
              Paste email content to test parsing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              className="min-h-[200px]"
              placeholder="Paste email content here..."
            />
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => {
                // Simple parsing for testing
                setParsingResult({
                  dates: ["2023-05-15", "2023-06-01"],
                  amounts: [{ amount: 99.99, currency: "USD" }],
                  keyValuePairs: {
                    "Invoice Number": "INV-123456",
                    "Due Date": "2023-06-15",
                    Customer: "Acme Corp",
                  },
                });
              }}
              className="w-full"
            >
              Test Parse
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
