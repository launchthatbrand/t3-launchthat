"use client";

import React, { useState } from "react";
import { useMutation, useQuery } from "convex/react";

import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

export default function TestPage() {
  const [emailSubject, setEmailSubject] = useState("");
  const [emailSender, setEmailSender] = useState("");
  const [emailContent, setEmailContent] = useState("");
  const [templateName, setTemplateName] = useState("");
  const [templateDescription, setTemplateDescription] = useState("");
  const [templatePublic, setTemplatePublic] = useState(false);
  const [selectedEmailId, setSelectedEmailId] = useState<string>("");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [testResults, setTestResults] = useState<string[]>([]);
  const [userId, setUserId] = useState<string>("");
  const [emailId, setEmailId] = useState<Id<"emails"> | null>(null);
  const [templateId, setTemplateId] = useState<Id<"templates"> | null>(null);
  const [sharedUserId, setSharedUserId] = useState<string>("");
  const [roleName, setRoleName] = useState<string>("");

  // Get data
  const emails = useQuery(api.emails.list);
  const templates = useQuery(api.templates.list, { includePublic: true });

  // Mutations
  const addEmail = useMutation(api.emails.addMockEmail);
  const createTemplate = useMutation(api.templates.create);
  const importEmails = useMutation(api.batch.importEmails);

  // CRUD operations
  const createEmail = useMutation(api.emails.create);
  const getEmail = useQuery(api.emails.get, emailId ? { id: emailId } : "skip");
  const listEmails = useQuery(api.emails.list, {});
  const updateEmail = useMutation(api.emails.update);
  const deleteEmail = useMutation(api.emails.remove);
  const searchEmails = useQuery(api.emails.search, { query: "Test" });

  // Template operations
  const getTemplate = useQuery(
    api.templates.get,
    templateId ? { id: templateId } : "skip"
  );
  const listTemplates = useQuery(api.templates.list, {});

  // Permission and role operations
  const shareResource = useMutation(api.sharing.shareResource);
  const removeSharedAccess = useMutation(api.sharing.removeSharedAccess);
  const getSharedWithMe = useQuery(api.sharing.getSharedWithMe, {});
  const getResourceSharing = useQuery(
    api.sharing.getResourceSharing,
    emailId ? { resourceType: "emails", resourceId: emailId } : "skip"
  );

  // Role operations
  const getUserRoles = useQuery(
    api.userRoles.getUserRoles,
    userId ? { userId } : {}
  );
  const hasRole = useQuery(
    api.userRoles.hasRole,
    roleName ? { roleName } : "skip"
  );
  const initSystemRoles = useMutation(api.userRoles.initSystemRoles);

  // Performance operations
  const startTimer = useMutation(api.performance.startTimer);
  const endTimer = useMutation(api.performance.endTimer);
  const getPerformanceMetrics = useQuery(api.performance.getMetrics, {});

  // Function to add a test result message
  const addTestResult = (message: string) => {
    setTestResults((prev) => [message, ...prev.slice(0, 9)]);
  };

  // Handle form submissions
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const emailId = await addEmail({
        subject: emailSubject,
        sender: emailSender,
        content: emailContent,
      });
      addTestResult(`Email added with ID: ${emailId}`);
      // Reset form
      setEmailSubject("");
      setEmailSender("");
      setEmailContent("");
    } catch (error) {
      console.error("Error adding email:", error);
      addTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const templateId = await createTemplate({
        name: templateName,
        description: templateDescription,
        isPublic: templatePublic,
      });
      addTestResult(`Template created with ID: ${templateId}`);
      // Reset form
      setTemplateName("");
      setTemplateDescription("");
      setTemplatePublic(false);
    } catch (error) {
      console.error("Error creating template:", error);
      addTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Batch operations test
  const handleBatchImport = async () => {
    try {
      const startTime = Date.now();
      const emailIds = await importEmails({
        emails: [
          {
            subject: "Batch Email 1",
            sender: "batch@example.com",
            content: "This is batch email 1.",
          },
          {
            subject: "Batch Email 2",
            sender: "batch@example.com",
            content: "This is batch email 2.",
          },
          {
            subject: "Batch Email 3",
            sender: "batch@example.com",
            content: "This is batch email 3.",
          },
        ],
      });
      const duration = Date.now() - startTime;
      addTestResult(
        `Batch imported ${emailIds.length} emails in ${duration}ms`,
      );
    } catch (error) {
      console.error("Error with batch import:", error);
      addTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  // Performance test - Query with index
  const performQueryWithIndex = useQuery(api.emails.list);

  // Performance test - Template duplication
  const duplicateTemplate = useMutation(api.batch.duplicateTemplate);

  const handleDuplicateTemplate = async () => {
    if (!selectedTemplateId) {
      addTestResult("Error: No template selected for duplication");
      return;
    }

    try {
      const startTime = Date.now();
      const newTemplateId = await duplicateTemplate({
        templateId: selectedTemplateId as Id<"templates">,
        newName: `Copy of ${templates?.find((t) => t._id === selectedTemplateId)?.name ?? "Template"}`,
      });
      const duration = Date.now() - startTime;
      addTestResult(
        `Template duplicated in ${duration}ms with new ID: ${newTemplateId}`,
      );
    } catch (error) {
      console.error("Error duplicating template:", error);
      addTestResult(
        `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  };

  const handleCreateEmail = async () => {
    try {
      const newEmailId = await createEmail({
        subject: "Test Email",
        sender: "test@example.com",
        content: "This is a test email content",
      });
      setEmailId(newEmailId);
      console.log("Created email with ID:", newEmailId);
    } catch (error) {
      console.error("Error creating email:", error);
    }
  };

  const handleCreateTemplate = async () => {
    try {
      const newTemplateId = await createTemplate({
        name: "Test Template",
        description: "Template for testing",
        isPublic: true,
      });
      setTemplateId(newTemplateId);
      console.log("Created template with ID:", newTemplateId);
    } catch (error) {
      console.error("Error creating template:", error);
    }
  };

  const handleDeleteEmail = async () => {
    if (!emailId) return;
    try {
      await deleteEmail({ id: emailId });
      setEmailId(null);
      console.log("Deleted email");
    } catch (error) {
      console.error("Error deleting email:", error);
    }
  };

  const handleUpdateEmail = async () => {
    if (!emailId) return;
    try {
      await updateEmail({
        id: emailId,
        subject: "Updated Test Email",
        content: "This content has been updated",
      });
      console.log("Updated email");
    } catch (error) {
      console.error("Error updating email:", error);
    }
  };
  
  const handleShareResource = async () => {
    if (!emailId || !sharedUserId) return;
    try {
      const sharedResourceId = await shareResource({
        resourceType: "emails",
        resourceId: emailId,
        sharedWithUserId: sharedUserId,
        permissions: ["read", "update"],
      });
      console.log("Shared resource ID:", sharedResourceId);
    } catch (error) {
      console.error("Error sharing resource:", error);
    }
  };
  
  const handleRemoveSharing = async () => {
    if (!emailId || !sharedUserId) return;
    try {
      await removeSharedAccess({
        resourceType: "emails",
        resourceId: emailId,
        sharedWithUserId: sharedUserId,
      });
      console.log("Removed sharing");
    } catch (error) {
      console.error("Error removing sharing:", error);
    }
  };
  
  const handleInitRoles = async () => {
    try {
      const result = await initSystemRoles({});
      console.log("Initialized system roles:", result);
    } catch (error) {
      console.error("Error initializing roles:", error);
    }
  };

  const handlePerformanceTest = async () => {
    try {
      const timerId = await startTimer({ label: "performanceTest" });
      
      // Perform some operations
      for (let i = 0; i < 5; i++) {
        await createEmail({
          subject: `Performance Test Email ${i}`,
          sender: "performance@example.com",
          content: `This is performance test email ${i}`,
        });
      }
      
      await endTimer({ id: timerId });
      console.log("Performance test completed");
    } catch (error) {
      console.error("Error in performance test:", error);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-6 text-2xl font-bold">Email Parser Testing Page</h1>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Add Email Form */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Add Mock Email</h2>
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full rounded border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm">Sender</label>
              <input
                type="email"
                value={emailSender}
                onChange={(e) => setEmailSender(e.target.value)}
                className="w-full rounded border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm">Content</label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                className="h-24 w-full rounded border p-2"
                required
              ></textarea>
            </div>
            <button
              type="submit"
              className="rounded bg-blue-500 px-4 py-2 text-white"
            >
              Add Email
            </button>
          </form>
        </div>

        {/* Add Template Form */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Create Template</h2>
          <form onSubmit={handleTemplateSubmit} className="space-y-3">
            <div>
              <label className="block text-sm">Name</label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="w-full rounded border p-2"
                required
              />
            </div>
            <div>
              <label className="block text-sm">Description</label>
              <textarea
                value={templateDescription}
                onChange={(e) => setTemplateDescription(e.target.value)}
                className="h-24 w-full rounded border p-2"
              ></textarea>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isPublic"
                checked={templatePublic}
                onChange={(e) => setTemplatePublic(e.target.checked)}
                className="mr-2"
              />
              <label htmlFor="isPublic" className="text-sm">
                Make Public
              </label>
            </div>
            <button
              type="submit"
              className="rounded bg-green-500 px-4 py-2 text-white"
            >
              Create Template
            </button>
          </form>
        </div>

        {/* Display Emails */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Emails</h2>
          {emails && emails.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <ul>
                {emails.map((email) => (
                  <li
                    key={email._id}
                    className="cursor-pointer border-b py-2 hover:bg-gray-100"
                    onClick={() => setSelectedEmailId(email._id)}
                  >
                    <div className="font-medium">{email.subject}</div>
                    <div className="text-sm text-gray-600">
                      From: {email.sender}
                    </div>
                    <div className="text-xs text-gray-500">ID: {email._id}</div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No emails found</p>
          )}
        </div>

        {/* Display Templates */}
        <div className="rounded-lg border p-4">
          <h2 className="mb-4 text-lg font-semibold">Templates</h2>
          {templates && templates.length > 0 ? (
            <div className="max-h-64 overflow-y-auto">
              <ul>
                {templates.map((template) => (
                  <li
                    key={template._id}
                    className="cursor-pointer border-b py-2 hover:bg-gray-100"
                    onClick={() => setSelectedTemplateId(template._id)}
                  >
                    <div className="font-medium">{template.name}</div>
                    {template.description && (
                      <div className="text-sm">{template.description}</div>
                    )}
                    <div className="text-xs text-gray-500">
                      ID: {template._id}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-gray-500">No templates found</p>
          )}
        </div>

        {/* Performance Testing */}
        <div className="col-span-1 rounded-lg border p-4 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Performance Testing</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <h3 className="font-medium">Batch Operations</h3>
              <button
                onClick={handleBatchImport}
                className="mt-2 rounded bg-purple-500 px-4 py-2 text-white"
              >
                Import 3 Emails
              </button>
            </div>
            <div>
              <h3 className="font-medium">Template Operations</h3>
              <div className="mt-2">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => setSelectedTemplateId(e.target.value)}
                  className="mb-2 w-full rounded border p-2"
                >
                  <option value="">Select a template</option>
                  {templates?.map((template) => (
                    <option key={template._id} value={template._id}>
                      {template.name}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleDuplicateTemplate}
                  disabled={!selectedTemplateId}
                  className="w-full rounded bg-teal-500 px-4 py-2 text-white disabled:opacity-50"
                >
                  Duplicate Template
                </button>
              </div>
            </div>
            <div>
              <h3 className="font-medium">Query Performance</h3>
              <div className="mt-2 text-sm">
                <p>Emails loaded: {performQueryWithIndex?.length ?? 0}</p>
                <p className="text-xs text-gray-500">
                  Using index: by_userId and by_receivedAt
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Results */}
        <div className="col-span-1 rounded-lg border p-4 md:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Test Results</h2>
          <div className="max-h-60 overflow-y-auto rounded bg-gray-100 p-3 font-mono text-sm">
            {testResults.length > 0 ? (
              <ul>
                {testResults.map((result, index) => (
                  <li key={index} className="border-b border-gray-300 py-1">
                    {result}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No test results yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6 border p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Email Operations</h2>
        <div className="space-y-4">
          <button
            onClick={handleCreateEmail}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Test Email
          </button>
          
          <button
            onClick={handleUpdateEmail}
            className="bg-green-500 text-white px-4 py-2 rounded"
            disabled={!emailId}
          >
            Update Email
          </button>
          
          <button
            onClick={handleDeleteEmail}
            className="bg-red-500 text-white px-4 py-2 rounded"
            disabled={!emailId}
          >
            Delete Email
          </button>
          
          {emailId && (
            <div className="mt-2">
              <p>Selected Email ID: {emailId}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-medium mt-4 mb-2">Email List</h3>
            {listEmails ? (
              <div className="max-h-40 overflow-y-auto">
                <ul>
                  {listEmails.map((email) => (
                    <li
                      key={email._id}
                      className="cursor-pointer hover:bg-gray-100 p-1"
                      onClick={() => setEmailId(email._id)}
                    >
                      {email.subject}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Loading emails...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 border p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Template Operations</h2>
        <div className="space-y-4">
          <button
            onClick={handleCreateTemplate}
            className="bg-blue-500 text-white px-4 py-2 rounded"
          >
            Create Test Template
          </button>
          
          {templateId && (
            <div className="mt-2">
              <p>Selected Template ID: {templateId}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-medium mt-4 mb-2">Template List</h3>
            {listTemplates ? (
              <div className="max-h-40 overflow-y-auto">
                <ul>
                  {listTemplates.map((template) => (
                    <li
                      key={template._id}
                      className="cursor-pointer hover:bg-gray-100 p-1"
                      onClick={() => setTemplateId(template._id)}
                    >
                      {template.name}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Loading templates...</p>
            )}
          </div>
        </div>
      </div>
      
      <div className="mt-6 border p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Permissions & Sharing</h2>
        <div className="space-y-4">
          <div>
            <label className="block mb-1">User ID to share with:</label>
            <input
              type="text"
              value={sharedUserId}
              onChange={(e) => setSharedUserId(e.target.value)}
              className="border p-2 w-full"
              placeholder="Enter user ID"
            />
          </div>
          
          <button
            onClick={handleShareResource}
            className="bg-purple-500 text-white px-4 py-2 rounded"
            disabled={!emailId || !sharedUserId}
          >
            Share Email
          </button>
          
          <button
            onClick={handleRemoveSharing}
            className="bg-red-500 text-white px-4 py-2 rounded"
            disabled={!emailId || !sharedUserId}
          >
            Remove Sharing
          </button>
          
          <div>
            <h3 className="font-medium mt-4 mb-2">Resources Shared With Me</h3>
            {getSharedWithMe ? (
              <div className="max-h-40 overflow-y-auto">
                <ul>
                  {getSharedWithMe.map((share) => (
                    <li key={share._id} className="p-1">
                      <span className="font-semibold">{share.resourceType}</span>:{" "}
                      {share.resourceDetails?.subject || share.resourceDetails?.name || "Unknown"}
                      <span className="text-xs text-gray-500 ml-2">
                        (Permissions: {share.permissions.join(", ")})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Loading shared resources...</p>
            )}
          </div>
          
          {emailId && getResourceSharing && (
            <div>
              <h3 className="font-medium mt-4 mb-2">Email Shared With</h3>
              <div className="max-h-40 overflow-y-auto">
                <ul>
                  {getResourceSharing.map((share) => (
                    <li key={share._id} className="p-1">
                      User: {share.sharedWithUserId}
                      <span className="text-xs text-gray-500 ml-2">
                        (Permissions: {share.permissions.join(", ")})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-6 border p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Role Management</h2>
        <div className="space-y-4">
          <button
            onClick={handleInitRoles}
            className="bg-green-500 text-white px-4 py-2 rounded"
          >
            Initialize System Roles
          </button>
          
          <div>
            <label className="block mb-1">Check User ID Roles:</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="border p-2 w-full"
              placeholder="Enter user ID (leave blank for current user)"
            />
          </div>
          
          <div>
            <label className="block mb-1">Check Role:</label>
            <input
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              className="border p-2 w-full"
              placeholder="Enter role name (e.g., admin)"
            />
            
            {roleName && hasRole !== undefined && (
              <p className="mt-1">
                User has role &quot;{roleName}&quot;: {hasRole ? "Yes" : "No"}
              </p>
            )}
          </div>
          
          <div>
            <h3 className="font-medium mt-4 mb-2">User Roles</h3>
            {getUserRoles ? (
              <div className="max-h-40 overflow-y-auto">
                <ul>
                  {getUserRoles.map((userRole) => (
                    <li key={userRole._id} className="p-1">
                      Role: {userRole.roleName}
                      <span className="text-xs text-gray-500 ml-2">
    </div>
  );
}
