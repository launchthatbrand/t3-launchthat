"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
  FloatingDockDesktop,
  WarpBackground,
} from "@acme/ui";
import {
  IconBrandTabler,
  IconBulb,
  IconNotebook,
  IconSettings,
  IconTargetArrow,
} from "@tabler/icons-react";
import React, { useState } from "react";
import {
  Sidebar,
  SidebarBody,
  SidebarLink,
  useSidebar,
} from "~/components/ui/sidebar";

import { GridLines } from "~/components/background/GridLines";
import Image from "next/image";
import { NavItems } from "~/components/ui/resizable-navbar";
import { Tooltip as TooltipCard } from "@acme/ui/components/ui/tooltip-card";
import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";
import { cn } from "~/lib/utils";
import { motion } from "motion/react";
import { redirect } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

const UpgradeToProCTA = () => {
  const { open: sidebarOpen } = useSidebar();

  const icon = (
    <span className="relative grid place-items-center">
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/6 ring-1 ring-white/12">
        <span className="text-lg leading-none text-orange-200">👑</span>
      </span>
      {/* Notification dot */}
      <span className="pointer-events-none absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-orange-400/60" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-orange-400 ring-2 ring-black/30" />
      </span>
    </span>
  );

  // Compact (collapsed): icon-only
  if (!sidebarOpen) {
    const compact = (
      <a
        href="/admin/settings/billing"
        className="flex items-center justify-center p-2 transition-colors hover:bg-white/7"
        aria-label="Upgrade for more features"
      >
        {icon}
      </a>
    );
    return <TooltipCard content="Upgrade to Pro">{compact}</TooltipCard>;
  }

  // Expanded: WarpBackground CTA
  return (
    <a href="/admin/settings/billing" className="block">
      <WarpBackground className="overflow-hidden rounded-xl border border-white/12 bg-black/2 p-0">
        <Card className="w-full rounded-none! border-0 bg-transparent p-3 shadow-none!">
          <CardContent className="flex items-center gap-3 p-0">
            {icon}
            <div className="min-w-0">
              <CardTitle className="text-sm text-white">
                Upgrade for more features
              </CardTitle>
              <CardDescription className="text-xs text-white/60">
                Organizations + customizable AI
              </CardDescription>
            </div>
            <motion.span
              animate={{
                display: "inline-block",
                opacity: 1,
              }}
              className="ml-auto rounded-full border border-orange-500/25 bg-orange-500/10 px-2 py-1 text-[11px] font-semibold text-orange-200"
            >
              Upgrade
            </motion.span>
          </CardContent>
        </Card>
      </WarpBackground>
    </a>
  );
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId, isLoaded } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      link: "/admin/dashboard",
    },
    {
      name: "Trading Plan",
      link: "/admin/tradingplan",
    },
    {
      name: "TradeIdeas",
      link: "/admin/tradeideas",
    },
    {
      name: "Orders",
      link: "/admin/orders",
    },
    {
      name: "Analytics",
      link: "/admin/analytics",
    },
    {
      name: "Integrations",
      link: "/admin/integrations",
    },
    {
      name: "Settings",
      link: "/admin/settings",
    },
  ];

  // Protect the route client-side (redundant with middleware but safe)
  React.useEffect(() => {
    if (isLoaded && !userId) {
      redirect("/sign-in");
    }
  }, [isLoaded, userId]);

  if (!isLoaded || !userId) return null;

  const links = [
    {
      label: "Dashboard",
      href: "/platform",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Integrations",
      href: "/platform/integrations",
      icon: (
        <IconNotebook className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Users",
      href: "/platform/users",
      icon: (
        <IconBulb className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/platform/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];

  return (
    <div
      className={cn(
        "mx-auto flex w-full flex-1 flex-col overflow-hidden rounded-md border border-neutral-200 md:flex-row dark:border-neutral-700",
        "h-screen", // for your use case, use `h-screen` instead of `h-[60vh]`
      )}
    >
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody
          mobileHeaderClassName="text-white"
          mobileHeader={
            <a
              href="/admin/dashboard"
              className="flex items-center gap-2 text-sm font-semibold text-white/90"
            >
              <Image
                src="/images/tl-logo-1.png"
                alt="Trader Launchpad"
                width={32}
                height={32}
                className="h-7 w-7"
                priority
              />
              <span className="bg-linear-to-b from-white via-orange-200 to-orange-500 bg-clip-text text-transparent">
                Admin
              </span>
            </a>
          }
          mobileVariant="none"
          className="z-50 min-h-screen justify-between gap-3 border-r border-white/10! bg-black/40! p-2 backdrop-blur-md"
        >
          {open ? <Logo /> : <LogoIcon />}
          <div className="mb-8 flex flex-1 flex-col justify-between overflow-x-hidden overflow-y-auto p-2">
            <div className="mt-2 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
            {/* <UpgradeToProCTA /> */}
          </div>
        </SidebarBody>
      </Sidebar>

      {/* Mobile-only navigation (replaces the drawer sidebar on small screens) */}
      <FloatingDockDesktop
        className="absolute right-10 bottom-5 left-10 z-50 flex items-center justify-center bg-black! backdrop-blur-md md:hidden"
        items={links}
      />

      <div className="flex flex-1 flex-col overflow-y-scroll">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-black/40 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between">
            <div className="flex items-center gap-4">
              <nav className="hidden items-center space-x-4 lg:flex lg:space-x-6">
                <NavItems items={navItems} />
              </nav>
            </div>

            <div className="relative z-10">
              <TraderLaunchpadNavUser afterSignOutUrl="/" />
            </div>
          </div>
        </header>
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-0">
            <GridLines columns={3} />
          </div>
          <div className="w-full px-4 py-6">
            <div className="relative z-10 mx-auto max-w-7xl">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function Logo() {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image
        src="/images/tl-logo-1.png"
        alt="Trader Launchpad"
        width={100}
        height={100}
        className="h-10 w-10"
        priority
      />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="bg-linear-to-b from-white via-orange-200 to-orange-500 bg-clip-text text-lg font-bold tracking-tight whitespace-pre text-transparent"
      >
        Trader Launchpad
      </motion.span>
    </a>
  );
}
export function LogoIcon() {
  return (
    <a
      href="#"
      className="relative z-20 flex items-center space-x-2 py-1 text-sm font-normal text-black"
    >
      <Image
        src="/images/tl-logo-1.png"
        alt="Trader Launchpad"
        width={100}
        height={100}
        className="h-10 w-10"
        priority
      />
    </a>
  );
}

// const Logo = () => {
//   return (
//     <Link href="/" className="flex items-center gap-2">
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         transition={{ duration: 0.2 }}
//         className="flex items-center gap-2"
//       >
//         {/* Logo Icon */}
//         <Image
//           src="/images/tl-logo-1.png"
//           alt="Trader Launchpad"
//           width={100}
//           height={100}
//           className="h-12 w-12"
//           priority
//         />
//         <span className="bg-linear-to-b from-white via-orange-200 to-orange-500 bg-clip-text text-lg font-bold tracking-tight text-transparent">
//           Trader Launchpad
//         </span>
//       </motion.div>
//     </Link>
//   );
// };

// const LogoIcon = () => {
//   return (
//     <motion.div
//       initial={{ opacity: 0 }}
//       animate={{ opacity: 1 }}
//       transition={{ duration: 0.2 }}
//       className="flex h-7 w-7 items-center justify-center rounded bg-white text-black"
//     >

//     </motion.div>
//   );
// };
