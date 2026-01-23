import SignInClient from "./SignInClient";

export default async function Page({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;

  const returnToRaw = resolvedSearchParams?.return_to;
  const tenantRaw = resolvedSearchParams?.tenant;
  const uiRaw = resolvedSearchParams?.ui;
  const methodRaw = resolvedSearchParams?.method;
  const phoneRaw = resolvedSearchParams?.phone;
  const emailRaw = resolvedSearchParams?.email;

  const returnTo = Array.isArray(returnToRaw) ? returnToRaw[0] : returnToRaw;
  const tenant = Array.isArray(tenantRaw) ? tenantRaw[0] : tenantRaw;
  const ui = Array.isArray(uiRaw) ? uiRaw[0] : uiRaw;
  const method = Array.isArray(methodRaw) ? methodRaw[0] : methodRaw;
  const phone = Array.isArray(phoneRaw) ? phoneRaw[0] : phoneRaw;
  const email = Array.isArray(emailRaw) ? emailRaw[0] : emailRaw;

  const prefillMethod: "phone" | "email" | null =
    method === "phone" || method === "email" ? method : null;

  return (
    <div className="flex flex-1 items-center justify-center">
      <SignInClient
        returnTo={typeof returnTo === "string" ? returnTo : null}
        tenantSlug={typeof tenant === "string" ? tenant : null}
        ui={ui === "clerk" ? "clerk" : "custom"}
        prefillMethod={prefillMethod}
        prefillPhone={typeof phone === "string" ? phone : null}
        prefillEmail={typeof email === "string" ? email : null}
      />
    </div>
  );
}


