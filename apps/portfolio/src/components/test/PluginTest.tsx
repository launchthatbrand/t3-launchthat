// Test component to verify plugin system
"use client";

import { addAction, applyFilters, doAction } from "~/lib/hooks";

import type { HookContext } from "~/lib/hooks";
import React from "react";

// Test plugin registration
addAction("test.action", (...args: unknown[]) => {
  const message = args[0] as string;
  console.log("Test action triggered:", message);
});

// Test filter registration
addAction("test.filter.setup", () => {
  console.log("Setting up test filter");
});

export const PluginTest: React.FC = () => {
  const handleTestAction = () => {
    doAction("test.action", "Hello from WordPress-style hooks!");
  };

  const handleTestFilter = () => {
    const result = applyFilters("test.title", "Original Title");
    console.log("Filtered result:", result);
  };

  const testContext: HookContext = {
    postType: "product",
    postId: "test-123",
    isSubmitting: false,
  };

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="text-lg font-bold">Plugin System Test</h3>

      <div className="space-x-2">
        <button
          onClick={handleTestAction}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Test Action Hook
        </button>

        <button
          onClick={handleTestFilter}
          className="rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Test Filter Hook
        </button>
      </div>

      <div className="text-sm text-gray-600">
        Check the browser console for hook execution logs.
        <br />
        Context: {JSON.stringify(testContext, null, 2)}
      </div>
    </div>
  );
};
