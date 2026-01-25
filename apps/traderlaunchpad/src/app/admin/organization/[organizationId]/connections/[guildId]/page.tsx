import { redirect } from "next/navigation";

export default async function AdminOrganizationConnectionGuildRedirect(props: {
  params: Promise<{ organizationId: string; guildId: string }>;
}) {
  const params = await props.params;
  redirect(
    `/admin/organization/${encodeURIComponent(
      params.organizationId,
    )}/connections/discord/guilds/${encodeURIComponent(params.guildId)}`,
  );
}

