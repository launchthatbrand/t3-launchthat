import { GroupCreationForm } from "@/components/groups/GroupCreationForm";

export const metadata = {
  title: "Create Group | WSA App",
  description: "Create a new group in WSA App",
};

export default function CreateGroupPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="mx-auto max-w-2xl space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Create a New Group
          </h1>
          <p className="text-muted-foreground">
            Fill out the form below to create a new group. All fields marked
            with * are required.
          </p>
        </div>

        <GroupCreationForm />
      </div>
    </div>
  );
}
