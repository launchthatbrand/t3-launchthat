import { redirect } from "next/navigation";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (searchParams ? await searchParams : undefined) ?? {};

  const redirectUrlRaw = params.redirect_url;
  const returnToRaw = params.return_to;
  const tenantRaw = params.tenant;

  const redirectUrl = Array.isArray(redirectUrlRaw) ? redirectUrlRaw[0] : redirectUrlRaw;
  const returnTo = Array.isArray(returnToRaw) ? returnToRaw[0] : returnToRaw;
  const tenant = Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw;

  const qp = new URLSearchParams();
  const nextReturnTo =
    typeof redirectUrl === "string" && redirectUrl.trim()
      ? redirectUrl.trim()
      : typeof returnTo === "string" && returnTo.trim()
        ? returnTo.trim()
        : "";
  if (nextReturnTo) qp.set("return_to", nextReturnTo);
  if (typeof tenant === "string" && tenant.trim()) qp.set("tenant", tenant.trim());

  const qs = qp.toString();
  redirect(qs ? `/sign-in?${qs}` : "/sign-in");
}

