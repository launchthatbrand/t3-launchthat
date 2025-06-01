"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEmailParserStore } from "../../store";

// Define types for our data
interface HighlightData {
  _id: Id<"highlightsStore">;
  text: string;
  className?: string;
}

interface FieldData {
  _id: Id<"fieldsStore">;
  name: string;
  highlightId: Id<"highlightsStore">;
}

export const FieldsSidebar: FC = () => {
  const [newFieldName, setNewFieldName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const selectedEmailId = useEmailParserStore((s) => s.selectedEmailId);

  // Convert string ID to Convex ID or use null if not available
  const emailId = selectedEmailId ? (selectedEmailId as Id<"emails">) : null;

  // Convex queries and mutations - with proper typing
  const highlightsQuery = useQuery(
    api.highlightsStore.listByEmail,
    emailId ? { emailId } : "skip",
  );
  const highlights = (highlightsQuery ?? []) as HighlightData[];

  const fieldsQuery = useQuery(api.fieldsStore.list);
  const fields = (fieldsQuery ?? []) as FieldData[];

  const createField = useMutation(api.fieldsStore.create);
  const removeField = useMutation(api.fieldsStore.remove);

  // Store state for UI
  const showToast = useEmailParserStore((s) => s.showToast);
  const showConfirmDialog = useEmailParserStore((s) => s.showConfirmDialog);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  // Find current highlight using optional chaining and safe type checking
  const currentHighlight = highlights.find(
    (h) => h.className === "highlight-current",
  );

  const handleAddField = async () => {
    if (!newFieldName || !currentHighlight) {
      showToast("error", "Please enter a field name and select text");
      return;
    }

    // Validate field name
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(newFieldName)) {
      showToast(
        "error",
        "Field name must start with a letter and contain only letters, numbers, and underscores",
      );
      return;
    }

    try {
      await createField({
        name: newFieldName.trim(),
        highlightId: currentHighlight._id,
      });

      setNewFieldName("");
      showToast("success", "Field added successfully");
    } catch (error) {
      console.error("Error adding field:", error);
      showToast(
        "error",
        error instanceof Error ? error.message : "Failed to add field",
      );
    }
  };

  const handleDeleteField = (id: Id<"fieldsStore">) => {
    showConfirmDialog({
      message:
        "Are you sure you want to delete this field? This action cannot be undone.",
      onConfirm: () => {
        // Use void to explicitly mark the promise as intentionally not awaited
        void (async () => {
          try {
            await removeField({ id });
            showToast("success", "Field deleted successfully");
          } catch (error) {
            console.error("Error deleting field:", error);
            showToast(
              "error",
              error instanceof Error ? error.message : "Failed to delete field",
            );
          }
        })();
      },
    });
  };

  const handleEnterKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      // Use void to explicitly mark the promise as intentionally not awaited
      void handleAddField();
    }
  };

  return (
    <div className="flex h-full flex-col overflow-hidden p-4">
      <h2 className="mb-4 text-lg font-medium text-gray-900">
        Structured Data
      </h2>

      <div className="mb-4 rounded-md border border-gray-200 bg-white p-4 shadow-sm">
        <h3 className="mb-2 text-sm font-medium text-gray-700">Add Field</h3>
        <div className="space-y-3">
          <div>
            <label
              htmlFor="fieldName"
              className="mb-1 block text-xs text-gray-600"
            >
              Field Name
            </label>
            <input
              ref={inputRef}
              id="fieldName"
              type="text"
              value={newFieldName}
              onChange={(e) => setNewFieldName(e.target.value)}
              placeholder="e.g., title, description"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              onKeyDown={handleEnterKeyDown}
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-gray-600">
              Selected Text
            </label>
            <div className="min-h-[2.5rem] rounded-md border border-gray-300 bg-gray-50 p-2 text-sm text-gray-600">
              {currentHighlight?.text ?? "No text selected"}
            </div>
          </div>
          <button
            onClick={() => void handleAddField()}
            disabled={!newFieldName || !currentHighlight}
            className="w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:bg-blue-300"
          >
            Add Field
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <h3 className="mb-2 text-sm font-medium text-gray-700">Fields</h3>
        {fields.length === 0 ? (
          <p className="text-sm text-gray-500">No fields added yet</p>
        ) : (
          <ul className="space-y-2">
            {fields.map((field) => {
              // Find the highlight associated with this field
              const highlight = highlights.find(
                (h) => h._id === field.highlightId,
              );

              return (
                <li
                  key={field._id.toString()}
                  className="flex items-start justify-between rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                >
                  <div className="flex-1 truncate">
                    <div className="font-medium text-gray-900">
                      {field.name}
                    </div>
                    <div className="mt-1 truncate text-xs text-gray-500">
                      {highlight?.text ?? "No text selected"}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteField(field._id)}
                    className="ml-2 rounded p-1 text-red-600 hover:bg-red-50"
                    title="Delete Field"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
