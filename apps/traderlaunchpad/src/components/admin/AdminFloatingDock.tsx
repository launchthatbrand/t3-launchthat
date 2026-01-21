"use client";

import * as React from "react";

import { FloatingDockDesktop } from "@acme/ui";
import {
  IconBrandTabler,
  IconBulb,
  IconNotebook,
  IconSettings,
  IconTargetArrow,
} from "@tabler/icons-react";

const items = [
  {
    label: "Dashboard",
    href: "/admin/dashboard",
    icon: <IconBrandTabler className="h-5 w-5 text-white/90" />,
  },
  {
    label: "Journal",
    href: "/admin/journal",
    icon: <IconNotebook className="h-5 w-5 text-white/90" />,
  },
  {
    label: "Ideas",
    href: "/admin/tradeideas",
    icon: <IconBulb className="h-5 w-5 text-white/90" />,
  },
  {
    label: "Plan",
    href: "/admin/tradingplan",
    icon: <IconTargetArrow className="h-5 w-5 text-white/90" />,
  },
  {
    label: "Settings",
    href: "/admin/settings",
    icon: <IconSettings className="h-5 w-5 text-white/90" />,
  },
] as const;

export function AdminFloatingDock() {
  return (
    <FloatingDockDesktop
      items={[...items]}
      className="fixed right-10 bottom-5 left-10 z-50 flex! h-auto! items-center justify-center gap-4 rounded-2xl border border-white/10 bg-black/60 px-4 py-3 backdrop-blur-md md:hidden!"
    />
  );
}

