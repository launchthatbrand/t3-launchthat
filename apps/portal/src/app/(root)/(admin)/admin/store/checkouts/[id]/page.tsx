"use client";

import { redirect } from "next/navigation";

export default function LegacyCheckoutsEditRedirect() {
  redirect("/admin/store/funnels");
}
