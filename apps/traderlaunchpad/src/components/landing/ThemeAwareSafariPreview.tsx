"use client";

import * as React from "react";

import { Safari } from "@acme/ui";
import { useTheme } from "@acme/ui/theme";

export function ThemeAwareSafariPreview({
  url,
  lightImageSrc,
  darkImageSrc,
  className,
}: {
  url: string;
  lightImageSrc: string;
  darkImageSrc: string;
  className?: string;
}) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const imageSrc =
    !mounted || resolvedTheme === "dark" ? darkImageSrc : lightImageSrc;

  return <Safari url={url} imageSrc={imageSrc} className={className} />;
}
