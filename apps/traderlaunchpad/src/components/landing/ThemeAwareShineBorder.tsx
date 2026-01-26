"use client";

import * as React from "react";

import { ShineBorder } from "@acme/ui";
import { useTheme } from "@acme/ui/theme";

type ThemeAwareShineBorderProps = Omit<
  React.ComponentProps<typeof ShineBorder>,
  "shineColor"
>;

export function ThemeAwareShineBorder(props: ThemeAwareShineBorderProps) {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const shineColor = !mounted || resolvedTheme === "dark" ? "white" : "black";

  return <ShineBorder {...props} shineColor={shineColor} />;
}
