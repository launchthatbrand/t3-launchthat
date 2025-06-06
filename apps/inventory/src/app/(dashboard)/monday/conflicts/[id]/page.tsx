import ConflictDashboard from "@/components/monday/ConflictDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board Conflicts | Monday.com Integration",
  description: "Manage and resolve data conflicts for a specific board mapping",
};

interface BoardConflictsPageProps {
  params: {
    id: string;
  };
}

export default function BoardConflictsPage({
  params,
}: BoardConflictsPageProps) {
  return (
    <div className="container mx-auto py-6">
      <ConflictDashboard boardMappingId={params.id} />
    </div>
  );
}
