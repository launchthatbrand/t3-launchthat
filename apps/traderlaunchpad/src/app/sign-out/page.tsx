import { env } from "~/env";
import { createSignOutPage } from "launchthat-plugin-core-tenant/next/routes/sign-out";

export default createSignOutPage({
  rootDomain: String(env.NEXT_PUBLIC_ROOT_DOMAIN ?? "traderlaunchpad.com"),
});

