"use client";

import { useState } from "react";
import type { NextPage } from "next";
import { useMutation, useQuery } from "convex/react";
import { toast, Toaster } from "sonner";

import { AuthRequired } from "../_components/AuthRequired";
import { LoadingIndicator } from "../_components/LoadingIndicator";
import { TemplateBuilder } from "../_components/TemplateBuilder";
import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

interface Template {
  _id: Id<"templates">;
  name: string;
  description?: string;
  isPublic: boolean;
  currentVersion?: number;
  createdAt: number;
  updatedAt: number;
}

const TemplatesPage: NextPage = () => {
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Id<"templates"> | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const templates = useQuery(api.templates.list, { includePublic: true });
  const _createTemplate = useMutation(api.templates.create);
  const deleteTemplate = useMutation(api.templates.remove);

  const handleCreateTemplate = () => {
    setSelectedTemplate(null);
    setIsBuilderOpen(true);
  };

  const handleEditTemplate = (template: Template) => {
    setSelectedTemplate(template._id);
    setIsBuilderOpen(true);
  };

  const handleDeleteTemplate = (template: Template) => {
    setSelectedTemplate(template._id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = async () => {
    if (selectedTemplate) {
      try {
        await deleteTemplate({ id: selectedTemplate });
        toast.success("Template deleted successfully");
        setIsDeleteDialogOpen(false);
        setSelectedTemplate(null);
      } catch (error) {
        toast.error("Failed to delete template");
        console.error(error);
      }
    }
  };

  return (
    <AuthRequired>
      <div className="flex h-screen flex-col bg-white dark:bg-gray-900">
        <header className="border-b bg-white px-6 py-4 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Templates
            </h1>
            <button
              onClick={handleCreateTemplate}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Create Template
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {templates === undefined ? (
            <LoadingIndicator />
          ) : templates.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center">
              <div className="mb-4 text-5xl">📄</div>
              <h2 className="mb-2 text-xl font-semibold text-gray-700 dark:text-gray-300">
                No Templates Yet
              </h2>
              <p className="mb-6 text-center text-gray-500 dark:text-gray-400">
                Create your first template to start parsing emails efficiently.
              </p>
              <button
                onClick={handleCreateTemplate}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Create Template
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((template) => (
                <div
                  key={template._id}
                  className="rounded-lg border bg-white p-6 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {template.name}
                    </h3>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="rounded-md bg-gray-100 p-1 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        title="Edit Template"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                          />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteTemplate(template)}
                        className="rounded-md bg-gray-100 p-1 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                        title="Delete Template"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                    {template.description ?? "No description provided"}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span
                        className={`mr-2 flex h-2 w-2 rounded-full ${
                          template.isPublic
                            ? "bg-green-500"
                            : "bg-gray-500 dark:bg-gray-400"
                        }`}
                      ></span>
                      {template.isPublic ? "Public" : "Private"}
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      v{template.currentVersion ?? 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Template Builder Modal */}
        {isBuilderOpen && (
          <TemplateBuilder
            initialTemplateId={selectedTemplate}
            onClose={() => setIsBuilderOpen(false)}
          />
        )}

        {/* Delete Confirmation Dialog */}
        {isDeleteDialogOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="mx-auto w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
              <h3 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
                Delete Template
              </h3>
              <p className="mb-6 text-gray-500 dark:text-gray-300">
                Are you sure you want to delete this template? This action
                cannot be undone.
              </p>
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setIsDeleteDialogOpen(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDeleteTemplate}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        <Toaster />
      </div>
    </AuthRequired>
  );
};

export default TemplatesPage;
