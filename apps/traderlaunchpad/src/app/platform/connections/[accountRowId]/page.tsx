import { ConnectionAccountDetailClient } from "../../../admin/settings/connections/[accountRowId]/ConnectionAccountDetailClient";

export default async function PlatformConnectionAccountPage(props: {
  params: Promise<{ accountRowId: string }>;
}) {
  const params = await props.params;
  return <ConnectionAccountDetailClient accountRowId={params.accountRowId} />;
}

