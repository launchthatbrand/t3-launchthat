"use client";

import { redirect } from "next/navigation";

export default function LegacyCheckoutsRedirect() {
  redirect("/admin/store/funnels");
}
