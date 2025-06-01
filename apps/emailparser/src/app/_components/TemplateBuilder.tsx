"use client";

import type { FC } from "react";
import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";

import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";

// Define types for our data
interface FieldData {
  _id: Id<"fieldsStore">;
  name: string;
  highlightId: Id<"highlightsStore">;
  text?: string;
}

interface TemplateField {
  name: string;
  fieldId: Id<"fieldsStore">;
}

interface TemplateVersion {
  version: number;
  fields: TemplateField[];
  createdAt: number;
}

interface Template {
  _id: Id<"templates">;
  name: string;
  description?: string;
  isPublic: boolean;
  currentVersion?: number;
  versions?: TemplateVersion[];
}

interface TemplateBuilderProps {
  initialTemplateId?: Id<"templates"> | null;
  onClose?: () => void;
}

export const TemplateBuilder: FC<TemplateBuilderProps> = ({
  initialTemplateId = null,
  onClose,
}) => {
  // Initialize isOpen based on whether it's rendered as a modal (with onClose) or standalone
  const [isOpen, setIsOpen] = useState(onClose !== undefined);
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedFields, setSelectedFields] = useState<FieldData[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] =
    useState<Id<"templates"> | null>(initialTemplateId);
  const [currentTemplateData, setCurrentTemplateData] =
    useState<Template | null>(null);
  const [jsonPreview, setJsonPreview] = useState<Record<string, string> | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [availableFields, setAvailableFields] = useState<FieldData[]>([]);

  // Get all available fields
  const fieldsStore = api.fieldsStore;
  const fieldsResult = useQuery(fieldsStore.list) as FieldData[] | undefined;

  // Get all templates
  const templatesQuery = useQuery(api.templates.list, { includePublic: true });

  // Get selected template details
  const templateDetailsQuery = useQuery(
    api.templates.get,
    selectedTemplate ? { id: selectedTemplate } : "skip",
  );

  // Get JSON preview
  const jsonTemplateQuery = useQuery(
    api.templates.generateJson,
    selectedTemplate ? { id: selectedTemplate } : "skip",
  );

  // Process fields when the query returns data
  useEffect(() => {
    setAvailableFields(fieldsResult ?? []);
  }, [fieldsResult]);

  // Mutations
  const createTemplate = useMutation(api.templates.create);
  const updateTemplateFields = useMutation(api.templates.updateFields);
  const deleteTemplate = useMutation(api.templates.remove);
  const switchVersion = useMutation(api.templates.switchVersion);

  // Update templates when query changes
  useEffect(() => {
    if (templatesQuery) {
      setTemplates(templatesQuery as Template[]);
    }
  }, [templatesQuery]);

  // Update current template data when selection changes
  useEffect(() => {
    if (templateDetailsQuery) {
      const template = templateDetailsQuery as Template | null;
      setCurrentTemplateData(template);

      if (template) {
        setTemplateName(template.name);
        setTemplateDescription(template.description ?? "");
        setIsPublic(template.isPublic);

        // Get the current version fields
        if (template.versions && template.currentVersion) {
          const currentVersion = template.versions.find(
            (v) => v.version === template.currentVersion,
          );
          if (currentVersion) {
            // Find the corresponding field data for each template field
            const selectedFieldsData = currentVersion.fields
              .map((field) => {
                // Find the field in the fields list
                const fieldData = availableFields.find(
                  (f) => f._id === field.fieldId,
                );
                return fieldData ? { ...fieldData } : null;
              })
              .filter(Boolean) as FieldData[];

            setSelectedFields(selectedFieldsData);
          }
        }
      }
    }
  }, [templateDetailsQuery, availableFields]);

  // Update JSON preview when available
  useEffect(() => {
    if (jsonTemplateQuery) {
      const data = jsonTemplateQuery as {
        templateName: string;
        version: number;
        data: Record<string, string>;
      } | null;
      setJsonPreview(data?.data ?? null);
    }
  }, [jsonTemplateQuery]);

  // Handle adding a field to the selected fields
  const handleAddField = (field: FieldData) => {
    // Check if field is already selected
    if (selectedFields.some((f) => f._id === field._id)) {
      toast.error("This field is already added to the template");
      return;
    }

    setSelectedFields([...selectedFields, field]);
  };

  // Handle removing a field from the selected fields
  const handleRemoveField = (fieldId: Id<"fieldsStore">) => {
    setSelectedFields(selectedFields.filter((f) => f._id !== fieldId));
  };

  // Handle creating a new template
  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Please enter a template name");
      return;
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field for your template");
      return;
    }

    try {
      setIsLoading(true);

      // Format fields for the template
      const templateFields = selectedFields.map((field) => ({
        name: field.name,
        fieldId: field._id,
      }));

      // Create the template
      await createTemplate({
        name: templateName.trim(),
        description: templateDescription.trim() || undefined,
        isPublic,
        fields: templateFields,
      });

      // Clear form
      setTemplateName("");
      setTemplateDescription("");
      setIsPublic(false);
      setSelectedFields([]);
      setSelectedTemplate(null);

      toast.success("Template created successfully");
      handleClose();
    } catch (error) {
      console.error("Error creating template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to create template",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle updating an existing template
  const handleUpdateTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }

    if (selectedFields.length === 0) {
      toast.error("Please select at least one field for your template");
      return;
    }

    try {
      setIsLoading(true);

      // Format fields for the template
      const templateFields = selectedFields.map((field) => ({
        name: field.name,
        fieldId: field._id,
      }));

      // Update the template fields
      await updateTemplateFields({
        id: selectedTemplate,
        fields: templateFields,
      });

      toast.success("Template updated successfully");
    } catch (error) {
      console.error("Error updating template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to update template",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a template
  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }

    if (
      !window.confirm(
        "Are you sure you want to delete this template? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setIsLoading(true);

      // Delete the template
      await deleteTemplate({
        id: selectedTemplate,
      });

      // Clear form
      setTemplateName("");
      setTemplateDescription("");
      setIsPublic(false);
      setSelectedFields([]);
      setSelectedTemplate(null);

      toast.success("Template deleted successfully");
      handleClose();
    } catch (error) {
      console.error("Error deleting template:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to delete template",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle switching to a different template version
  const handleSwitchVersion = async (version: number) => {
    if (!selectedTemplate) {
      toast.error("No template selected");
      return;
    }

    try {
      setIsLoading(true);

      await switchVersion({
        id: selectedTemplate,
        version,
      });

      toast.success(`Switched to version ${version}`);
    } catch (error) {
      console.error("Error switching template version:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to switch version",
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle closing the template builder
  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setIsOpen(false);
    }
  };

  // Format date for display
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // If rendered as a standalone component and not open, show the button
  if (!isOpen && onClose === undefined) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Manage Templates
      </button>
    );
  }

  // If not open and rendered with initialTemplateId, return null
  if (!isOpen) {
    return null;
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <h3 className="text-lg font-medium text-gray-900">Template Builder</h3>
        <button
          onClick={handleClose}
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

      {/* Content */}
      <div className="flex h-[calc(90vh-4rem)] overflow-hidden">
        {/* Left panel - Templates list */}
        <div className="w-64 overflow-auto border-r p-4">
          <h4 className="mb-3 font-medium text-gray-700">Your Templates</h4>

          <button
            onClick={() => {
              setSelectedTemplate(null);
              setTemplateName("");
              setTemplateDescription("");
              setIsPublic(false);
              setSelectedFields([]);
            }}
            className="mb-3 w-full rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            New Template
          </button>

          {templates.length === 0 ? (
            <p className="text-sm text-gray-500">No templates found</p>
          ) : (
            <ul className="space-y-2">
              {templates.map((template) => (
                <li
                  key={template._id.toString()}
                  className={`cursor-pointer rounded-md p-2 ${
                    selectedTemplate?.toString() === template._id.toString()
                      ? "bg-blue-100"
                      : "hover:bg-gray-100"
                  }`}
                  onClick={() => setSelectedTemplate(template._id)}
                >
                  <div className="font-medium">{template.name}</div>
                  <div className="text-xs text-gray-500">
                    {template.isPublic ? "Public" : "Private"} • v
                    {template.currentVersion ?? 1}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Middle panel - Template editor */}
        <div className="flex-1 overflow-auto p-4">
          <h4 className="mb-3 font-medium text-gray-700">
            {selectedTemplate ? "Edit Template" : "Create New Template"}
          </h4>

          <div className="space-y-4">
            {/* Template name */}
            <div>
              <label
                htmlFor="templateName"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Template Name
              </label>
              <input
                id="templateName"
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="e.g., Invoice Parser"
                disabled={isLoading}
              />
            </div>

            {/* Template description */}
            <div>
              <label
                htmlFor="templateDescription"
                className="mb-1 block text-sm font-medium text-gray-700"
              >
                Description (optional)
              </label>
              <textarea
                id="templateDescription"
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Describe what this template is used for..."
                rows={3}
                disabled={isLoading}
              />
            </div>

            {/* Public/Private toggle */}
            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                disabled={isLoading}
              />
              <label
                htmlFor="isPublic"
                className="ml-2 block text-sm text-gray-700"
              >
                Make this template public
              </label>
            </div>

            {/* Selected fields */}
            <div>
              <h5 className="mb-2 font-medium text-gray-700">
                Template Fields
              </h5>
              {selectedFields.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No fields selected. Add fields from the right panel.
                </p>
              ) : (
                <ul className="space-y-2">
                  {selectedFields.map((field) => (
                    <li
                      key={field._id.toString()}
                      className="flex items-center justify-between rounded-md border border-gray-200 bg-white p-3 shadow-sm"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{field.name}</div>
                        <div className="mt-1 line-clamp-1 text-xs text-gray-500">
                          {field.text ?? "No text available"}
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveField(field._id)}
                        className="ml-2 rounded p-1 text-red-600 hover:bg-red-50"
                        title="Remove Field"
                        disabled={isLoading}
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
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Template actions */}
            <div className="flex space-x-2 pt-4">
              {selectedTemplate ? (
                <>
                  <button
                    onClick={handleUpdateTemplate}
                    className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Template"}
                  </button>
                  <button
                    onClick={handleDeleteTemplate}
                    className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed disabled:bg-red-300"
                    disabled={isLoading}
                  >
                    Delete
                  </button>
                </>
              ) : (
                <button
                  onClick={handleCreateTemplate}
                  className="flex-1 rounded-md bg-blue-600 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed disabled:bg-blue-300"
                  disabled={isLoading}
                >
                  {isLoading ? "Creating..." : "Create Template"}
                </button>
              )}
            </div>

            {/* Version history (if editing) */}
            {selectedTemplate &&
              currentTemplateData?.versions &&
              currentTemplateData.versions.length > 0 && (
                <div className="mt-8">
                  <h5 className="mb-2 font-medium text-gray-700">
                    Version History
                  </h5>
                  <div className="max-h-48 overflow-auto rounded-md border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Version
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Fields
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Created
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {currentTemplateData.versions
                          .slice()
                          .sort((a, b) => b.version - a.version)
                          .map((version) => (
                            <tr key={version.version}>
                              <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                v{version.version}
                                {version.version ===
                                  currentTemplateData.currentVersion && (
                                  <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-800">
                                    Current
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {version.fields.length} fields
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {formatDate(version.createdAt)}
                              </td>
                              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                {version.version !==
                                  currentTemplateData.currentVersion && (
                                  <button
                                    onClick={() =>
                                      handleSwitchVersion(version.version)
                                    }
                                    className="rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-200"
                                    disabled={isLoading}
                                  >
                                    Switch to this version
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Right panel - Available fields and JSON preview */}
        <div className="w-80 overflow-auto border-l p-4">
          <div className="mb-6">
            <h4 className="mb-3 font-medium text-gray-700">Available Fields</h4>
            {availableFields.length === 0 ? (
              <p className="text-sm text-gray-500">
                No fields available. Create fields first.
              </p>
            ) : (
              <ul className="max-h-64 space-y-2 overflow-auto">
                {availableFields.map((field) => (
                  <li
                    key={field._id.toString()}
                    className="cursor-pointer rounded-md border border-gray-200 bg-white p-3 shadow-sm hover:border-blue-300"
                    onClick={() => handleAddField(field)}
                  >
                    <div className="font-medium">{field.name}</div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div>
            <h4 className="mb-3 font-medium text-gray-700">JSON Preview</h4>
            <div className="rounded-md bg-gray-800 p-4">
              {!jsonPreview || Object.keys(jsonPreview).length === 0 ? (
                <div className="py-4 text-center text-gray-400">
                  {selectedTemplate
                    ? "No data available for this template"
                    : "Create a template to see preview"}
                </div>
              ) : (
                <pre className="max-h-96 overflow-auto text-sm text-green-400">
                  {JSON.stringify(jsonPreview, null, 2)}
                </pre>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
