"use client";

import { cn } from "@acme/ui";

interface LogoProps {
  className?: string;
  appName?: string;
}

export function Logo({
  className,
  appName = "Wall Street Academy",
}: LogoProps) {
  const [firstPart, ...rest] = appName.split(" ");
  const secondPart = rest.join(" ");

  return (
    <div className={cn("flex items-center gap-1", className)}>
      <span className="font-semibold text-[#2b0e4d]">{firstPart}</span>
      <span className="font-light text-[#FC653C]">{secondPart}</span>
    </div>
  );
}
