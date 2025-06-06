import ConflictDashboard from "@/components/monday/ConflictDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Monday.com Conflict Management",
  description:
    "Manage and resolve data conflicts between Convex and Monday.com",
};

export default function ConflictsPage() {
  return (
    <div className="container mx-auto py-6">
      <ConflictDashboard />
    </div>
  );
}
