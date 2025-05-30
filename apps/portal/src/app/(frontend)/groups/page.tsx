import { GroupDirectory } from "@/components/groups/GroupDirectory";

export const metadata = {
  title: "Groups | WSA App",
  description: "Browse and join groups in WSA App",
};

export default function GroupsDirectoryPage() {
  return (
    <div className="container mx-auto py-6">
      <GroupDirectory />
    </div>
  );
}
