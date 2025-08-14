"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
// Use the identified path
import { api } from "@convex-config/_generated/api";
// Convex imports
import { useMutation } from "convex/react";

// Use correct relative path from this file location
import { TopicForm } from "../_components/TopicForm";

// Define the type for the form values expected by the mutation
interface CreateTopicFormValues {
  title: string;
  // Add other optional fields if they are part of the form
}

const CreateTopicPage = () => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get the Convex mutation function
  const createTopic = useMutation(api.topics.create);

  const handleCreateTopic = async (values: CreateTopicFormValues) => {
    setIsSubmitting(true);
    try {
      // Call the Convex mutation
      await createTopic({ title: values.title });
      // Redirect on success (optional)
      router.push("/admin/lms/courses"); // Redirect back to courses list
    } catch (error) {
      console.error("Failed to create topic:", error);
      // Error is handled by toast in TopicForm, re-throw for state
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="mb-6 text-3xl font-bold">Create New Topic</h1>
      <TopicForm onSubmit={handleCreateTopic} isSubmitting={isSubmitting} />
    </div>
  );
};

export default CreateTopicPage;
