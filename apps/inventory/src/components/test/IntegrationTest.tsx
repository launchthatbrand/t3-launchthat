import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";

import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Input } from "@acme/ui/input";

export function IntegrationTest() {
  const [name, setName] = useState("World");
  const [result, setResult] = useState<string | null>(null);

  // Test query using our test module
  const testQueryResult = useQuery(
    api.integrations_old.testWordPress.testSimpleQuery,
  );

  // Test mutation
  const testMutation = useMutation(api.integrations.test.basic.testMutation);

  const handleTestMutation = async () => {
    const response = await testMutation({ name });
    setResult(response);
  };

  return (
    <Card className="mx-auto mt-8 max-w-md">
      <CardHeader>
        <CardTitle>Integrations Module Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="mb-2 text-sm font-medium">Test Query Result:</p>
          <div className="rounded-md bg-gray-100 p-3">
            {testQueryResult || "Loading..."}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Test Mutation:</p>
          <div className="flex space-x-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
            />
            <Button onClick={handleTestMutation}>Test</Button>
          </div>
          {result && (
            <div className="mt-2 rounded-md bg-gray-100 p-3">{result}</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
