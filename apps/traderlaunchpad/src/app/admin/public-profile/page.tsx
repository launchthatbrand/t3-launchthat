import { redirect } from "next/navigation";

export default function AdminPublicProfileRedirectPage() {
  redirect("/admin/settings/account");
}

