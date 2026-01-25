import { ConnectionAccountDetailClient } from "../../settings/connections/[accountRowId]/ConnectionAccountDetailClient";

export default async function AdminConnectionAccountPage(props: {
  params: Promise<{ accountRowId: string }>;
}) {
  const params = await props.params;
  return <ConnectionAccountDetailClient accountRowId={params.accountRowId} />;
}

