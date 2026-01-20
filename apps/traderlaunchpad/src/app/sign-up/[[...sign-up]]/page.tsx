import { redirect } from "next/navigation";

export default function SignUpPage() {
  // TraderLaunchpad does not have a dedicated sign-up flow.
  // Accounts are created via the sign-in flow and access is gated by entitlements.
  redirect("/sign-in");
}


