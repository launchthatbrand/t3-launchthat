import { ConnectionAccountDetailClient } from "./ConnectionAccountDetailClient";

export default async function AdminSettingsConnectionAccountPage(props: {
  params: Promise<{ accountRowId: string }>;
}) {
  const params = await props.params;
  return <ConnectionAccountDetailClient accountRowId={params.accountRowId} />;
}

