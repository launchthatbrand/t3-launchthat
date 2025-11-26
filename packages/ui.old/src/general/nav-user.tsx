"use client";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@acme/ui/components/avatar";
import { ChevronsUpDown, LogOut } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@acme/ui/components/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@acme/ui/sidebar";

import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@acme/ui";

interface NavUserProps {
  user?: {
    name?: string | null;
    email?: string | null;
    avatar?: string | null;
  } | null;
  className?: string;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  signInLabel?: string;
  onSignOut?: () => void;
  menuItems?: {
    label: string;
    icon?: LucideIcon;
    onClick?: () => void;
  }[];
  unauthenticatedSlot?: ReactNode;
}

export function NavUser({
  user,
  className,
  isAuthenticated,
  onSignIn,
  signInLabel = "Sign In",
  onSignOut,
  menuItems,
  unauthenticatedSlot,
}: NavUserProps = {}) {
  const { isMobile } = useSidebar();
  const authenticated = isAuthenticated ?? Boolean(user);
  const displayName = user?.name ?? "User";
  const email = user?.email ?? "";
  const avatar = user?.avatar ?? undefined;
  const fallbackInitial = displayName.trim().charAt(0) || "U";

  if (!authenticated) {
    if (unauthenticatedSlot) {
      return <>{unauthenticatedSlot}</>;
    }
    return (
      <button
        className="ml-auto flex items-center justify-center rounded-md bg-gradient-to-r from-orange-400 via-pink-500 to-purple-600 px-4 py-1 text-sm font-medium text-white transition-colors hover:from-pink-600 hover:to-purple-600 disabled:opacity-60"
        onClick={onSignIn}
        disabled={!onSignIn}
        type="button"
      >
        {signInLabel}
      </button>
    );
  }

  return (
    <SidebarMenu className="w-auto">
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className={cn(
                "h-10 rounded-lg bg-gradient-to-r from-pink-500/20 to-purple-500/20 p-1 hover:from-pink-500/30 hover:to-purple-500/30",
                className,
              )}
            >
              <Avatar className="border-gradient-to-r h-8 w-8 rounded-lg border-2 from-pink-500 to-purple-500">
                <AvatarImage src={avatar} />
                <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500">
                  {fallbackInitial}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold text-black">
                  {displayName}
                </span>
              </div>
              <ChevronsUpDown className="ml-auto size-4 text-black/70" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border border-white/10 bg-gradient-to-r from-pink-500/30 to-purple-500/30 text-black backdrop-blur-xl"
            side={isMobile ? "bottom" : "bottom"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 rounded-t-lg bg-gradient-to-r from-pink-500/10 to-purple-500/10 px-3 py-2">
                <Avatar className="border-gradient-to-r h-8 w-8 rounded-lg border-2 from-pink-500 to-purple-500">
                  <AvatarImage src={avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-pink-500 to-purple-500">
                    {fallbackInitial}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{displayName}</span>
                  {email ? (
                    <span className="truncate text-xs">{email}</span>
                  ) : null}
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.08]" />
            {menuItems && menuItems.length > 0 ? (
              <>
                <DropdownMenuGroup>
                  {menuItems.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      className="focus:bg-gradient-to-r focus:from-pink-500/20 focus:to-purple-500/20"
                      onClick={item.onClick}
                    >
                      {item.icon ? (
                        <item.icon className="mr-2 h-4 w-4 text-pink-500" />
                      ) : null}
                      <span>{item.label}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator className="bg-white/[0.08]" />
              </>
            ) : null}
            {onSignOut ? (
              <DropdownMenuItem
                onClick={onSignOut}
                className="focus:bg-gradient-to-r focus:from-pink-500/20 focus:to-purple-500/20"
              >
                <LogOut className="mr-2 h-4 w-4 text-pink-500" />
                <span>Log out</span>
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
