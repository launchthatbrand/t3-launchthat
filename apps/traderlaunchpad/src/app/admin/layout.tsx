"use client";

import {
  IconBrandTabler,
  IconBulb,
  IconNotebook,
  IconSettings,
  IconTargetArrow,
} from "@tabler/icons-react";
import React, { useState } from "react";
import { Sidebar, SidebarBody, SidebarLink } from "~/components/ui/sidebar";

import { GridLines } from "~/components/background/GridLines";
import Image from "next/image";
import { NavItems } from "~/components/ui/resizable-navbar";
import { TraderLaunchpadNavUser } from "~/components/auth/TraderLaunchpadNavUser";
import { motion } from "motion/react";
import { redirect } from "next/navigation";
import { useAuth } from "@clerk/nextjs";

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
      href: "/admin/dashboard",
      icon: (
        <IconBrandTabler className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trading Journal",
      href: "/admin/dashboard",
      icon: (
        <IconNotebook className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trade Ideas",
      href: "/admin/tradeideas",
      icon: (
        <IconBulb className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Trading Plan",
      href: "/admin/tradingplan",
      icon: (
        <IconTargetArrow className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
    {
      label: "Settings",
      href: "/admin/settings",
      icon: (
        <IconSettings className="h-5 w-5 shrink-0 text-neutral-700 dark:text-neutral-200" />
      ),
    },
  ];



  

  return (
    <div className="max-h-screen h-full flex flex-1 overflow-hidden">
      <Sidebar open={open} setOpen={setOpen}>
        <SidebarBody className="justify-between p-2 gap-10 min-h-screen z-50 border-white/10! border-r bg-black/40! backdrop-blur-md">
        {open ? <Logo /> : <LogoIcon />}
         <div className="flex flex-1 flex-col p-2 overflow-x-hidden overflow-y-auto">
        
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
            </div>
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex-1 overflow-y-scroll">

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
        <div className="w-full px-4 py-6">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0">
              <GridLines columns={3} />
            </div>

            <div className="relative z-10 mx-auto max-w-7xl">
              {children}
            </div>
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
        className="whitespace-pre bg-linear-to-b from-white via-orange-200 to-orange-500 bg-clip-text text-lg font-bold tracking-tight text-transparent"
      >
        Trader Launchpad
      </motion.span>
    </a>
  );
};
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
};

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