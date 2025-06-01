"use client";

import { FC, useEffect, useRef, useState } from "react";
import { useMutation } from "convex/react";
import { toast } from "sonner";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useEmailParserStore } from "../../store";
import { TemplateBuilder } from "./TemplateBuilder";

export const JsonPreview: FC = () => {
  const isOpen = useEmailParserStore((s) => s.isJsonPreviewOpen);
  const setOpen = useEmailParserStore((s) => s.setJsonPreviewOpen);
  const generateJsonTemplate = useEmailParserStore(
    (s) => s.generateJsonTemplate,
  );
  const templateVersion = useEmailParserStore((s) => s.templateVersion);
  const [jsonTemplate, setJsonTemplate] = useState<Record<string, string>>({});
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveDescription, setSaveDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const jsonRef = useRef<HTMLPreElement>(null);

  // Convex template mutation
  const createTemplateMutation = useMutation(api.templates.create);

  useEffect(() => {
    if (isOpen) {
      const template = generateJsonTemplate();
      setJsonTemplate(template);
    }
  }, [isOpen, templateVersion, generateJsonTemplate]);

  const handleCopyJson = async () => {
    try {
      const jsonString = JSON.stringify(jsonTemplate, null, 2);
      await navigator.clipboard.writeText(jsonString);
      toast.success("JSON copied to clipboard");
    } catch (error) {
      console.error("Failed to copy JSON:", error);
      toast.error("Failed to copy JSON to clipboard");
    }
  };

  const handleSaveTemplate = () => {
    if (Object.keys(jsonTemplate).length === 0) {
      toast.error("No fields defined. Add fields to save a template.");
      return;
    }

    // Open the save dialog
    setIsSaveDialogOpen(true);
  };

  const handleSaveTemplateSubmit = async () => {
    if (!saveName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    try {
      setIsSaving(true);

      // Get the fields from the store
      const storeFields = useEmailParserStore.getState().fields;

      if (storeFields.length === 0) {
        toast.error("No fields defined. Add fields to save a template.");
        return;
      }

      // Format fields for template creation - convert store fields to Convex fields
      const templateFields = storeFields.map((field) => {
        // Map field id to Convex ID - in practice, this should be done when saving to Convex
        const fieldId = field.id as unknown as Id<"fieldsStore">;
        return {
          name: field.name,
          fieldId,
        };
      });

      // Create the template
      await createTemplateMutation({
        name: saveName.trim(),
        description: saveDescription.trim() || undefined,
        isPublic,
        fields: templateFields,
      });

      toast.success("Template saved successfully");
      setIsSaveDialogOpen(false);

      // Reset form
      setSaveName("");
      setSaveDescription("");
      setIsPublic(false);
    } catch (error) {
      console.error("Error saving template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to save template",
      );
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Close on escape key
      if (e.key === "Escape" && isOpen) {
        setOpen(false);
      }

      // Copy on Ctrl+C or Cmd+C when preview is open and focused
      if (
        (e.ctrlKey || e.metaKey) &&
        e.key === "c" &&
        isOpen &&
        document.activeElement === jsonRef.current
      ) {
        e.preventDefault();
        void handleCopyJson(); // Use void to explicitly ignore the promise
      }

      // Save on Ctrl+S or Cmd+S when preview is open
      if ((e.ctrlKey || e.metaKey) && e.key === "s" && isOpen) {
        e.preventDefault();
        handleSaveTemplate();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, setOpen, handleCopyJson]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            setOpen(false);
          }
        }}
      >
        <div className="relative w-full max-w-2xl rounded-lg bg-white shadow-2xl">
          <div className="flex items-center justify-between border-b p-4">
            <h3 className="text-lg font-medium text-gray-900">JSON Template</h3>
            <div className="flex space-x-2">
              <button
                onClick={handleSaveTemplate}
                className="rounded-md bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Save Template
              </button>
              <button
                onClick={handleCopyJson}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>
          <div className="p-4">
            <div className="relative rounded-md bg-gray-800 p-4">
              {Object.keys(jsonTemplate).length === 0 ? (
                <div className="py-4 text-center text-gray-400">
                  No fields defined. Add fields to generate a template.
                </div>
              ) : (
                <pre
                  ref={jsonRef}
                  className="max-h-96 overflow-auto text-sm text-green-400"
                  tabIndex={0}
                >
                  {JSON.stringify(jsonTemplate, null, 2)}
                </pre>
              )}
            </div>
            <div className="mt-4 text-xs text-gray-500">
              <p>
                <strong>Keyboard shortcuts:</strong> Press{" "}
                <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono">
                  Esc
                </kbd>{" "}
                to close,{" "}
                <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono">
                  Ctrl+C
                </kbd>{" "}
                to copy when focused,{" "}
                <kbd className="rounded bg-gray-100 px-1 py-0.5 font-mono">
                  Ctrl+S
                </kbd>{" "}
                to save as a template
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Save Template Dialog */}
      {isSaveDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <button
              onClick={() => setIsSaveDialogOpen(false)}
              className="absolute right-4 top-4 rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-400"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <h3 className="mb-4 text-lg font-medium text-gray-900">
              Save as Template
            </h3>

            <p className="mb-4 text-sm text-gray-600">
              Save your current field selections as a reusable template for
              future emails.
            </p>

            <div className="mb-4">
              <label
                htmlFor="templateName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                placeholder="e.g., Invoice Template"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                disabled={isSaving}
              />
            </div>

            <div className="mb-4">
              <label
                htmlFor="templateDescription"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Description (optional)
              </label>
              <textarea
                id="templateDescription"
                placeholder="What this template is used for..."
                value={saveDescription}
                onChange={(e) => setSaveDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                rows={3}
                disabled={isSaving}
              />
            </div>

            <div className="mb-4 flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isSaving}
              />
              <label
                htmlFor="isPublic"
                className="ml-2 block text-sm text-gray-700"
              >
                Make this template public
              </label>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setIsSaveDialogOpen(false)}
                className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-400"
                disabled={isSaving}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplateSubmit}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isSaving}
              >
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Template Manager */}
      <TemplateBuilder />
    </>
  );
};
