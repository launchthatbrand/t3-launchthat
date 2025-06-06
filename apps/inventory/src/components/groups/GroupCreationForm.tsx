"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/convex/_generated/api";
import { useMutation } from "convex/react";
import { toast } from "sonner";
import { z } from "zod";

import {
  EntityForm,
  FormCheckbox,
  FormSelect,
  FormTextareaInput,
  FormTextInput,
} from "@acme/ui/advanced/entity-form";

// Group creation form validation schema
const groupFormSchema = z.object({
  name: z
    .string()
    .min(3, "Group name must be at least 3 characters")
    .max(50, "Group name cannot exceed 50 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(500, "Description cannot exceed 500 characters"),
  privacy: z.enum(["public", "private", "restricted"]),
  allowMemberPosts: z.boolean().default(true),
  allowMemberInvites: z.boolean().default(true),
  showInDirectory: z.boolean().default(true),
  categoryTags: z.string().optional(),
});

type GroupFormValues = z.infer<typeof groupFormSchema>;

export function GroupCreationForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const createGroup = useMutation(api.groups.createGroup);

  const handleSubmit = async (data: GroupFormValues) => {
    setIsSubmitting(true);
    try {
      // Process category tags (convert comma-separated string to array)
      const categoryTags = data.categoryTags
        ? data.categoryTags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : undefined;

      // Create group settings object
      const settings = {
        allowMemberPosts: data.allowMemberPosts,
        allowMemberInvites: data.allowMemberInvites,
        showInDirectory: data.showInDirectory,
        autoApproveMembers: true,
        moderationEnabled: false,
      };

      // Call the API to create the group
      const groupId = await createGroup({
        name: data.name,
        description: data.description,
        privacy: data.privacy,
        settings,
        categoryTags,
      });

      toast.success("Group created successfully!");
      // Navigate to the newly created group page
      router.push(`/groups/${groupId}`);
    } catch (error) {
      console.error("Error creating group:", error);
      toast.error("Failed to create group. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <EntityForm
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      isSubmitting={isSubmitting}
      validationSchema={groupFormSchema}
      defaultValues={{
        name: "",
        description: "",
        privacy: "public",
        allowMemberPosts: true,
        allowMemberInvites: true,
        showInDirectory: true,
        categoryTags: "",
      }}
      submitButtonText="Create Group"
      className="space-y-6"
    >
      <FormTextInput
        name="name"
        label="Group Name"
        placeholder="Enter group name"
        required
      />

      <FormTextareaInput
        name="description"
        label="Description"
        placeholder="Describe what this group is about"
        required
        rows={4}
      />

      <FormSelect
        name="privacy"
        label="Privacy Setting"
        required
        options={[
          { value: "public", label: "Public - Anyone can see and join" },
          {
            value: "restricted",
            label: "Restricted - Anyone can see, approval required to join",
          },
          { value: "private", label: "Private - Only visible to members" },
        ]}
      />

      <div className="space-y-4 rounded-md border p-4">
        <h3 className="text-sm font-medium">Group Settings</h3>

        <FormCheckbox
          name="allowMemberPosts"
          label="Allow members to create posts"
        />

        <FormCheckbox
          name="allowMemberInvites"
          label="Allow members to invite others"
        />

        <FormCheckbox
          name="showInDirectory"
          label="Show this group in public directory"
        />
      </div>

      <FormTextInput
        name="categoryTags"
        label="Category Tags"
        placeholder="Enter tags separated by commas (e.g., tech, coding, design)"
      />
    </EntityForm>
  );
}
