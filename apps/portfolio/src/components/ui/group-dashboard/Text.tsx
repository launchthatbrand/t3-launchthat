import type { ElementType } from "react";

export interface TextProps {
  content?: string;
  variant?: "h1" | "h2" | "h3" | "h4" | "p" | "lead" | "small";
  align?: "left" | "center" | "right";
  className?: string;
}

export function Text({
  content = "",
  variant = "p",
  align = "left",
  className = "",
}: TextProps) {
  const alignClass = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  const variantClass = {
    h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl",
    h2: "scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0",
    h3: "scroll-m-20 text-2xl font-semibold tracking-tight",
    h4: "scroll-m-20 text-xl font-semibold tracking-tight",
    p: "leading-7 [&:not(:first-child)]:mt-6",
    lead: "text-xl text-muted-foreground",
    small: "text-sm font-medium leading-none",
  };

  // Handle special case for 'lead' and 'small' which aren't HTML elements
  const Tag: ElementType =
    variant === "lead" || variant === "small" ? "p" : variant;

  return (
    <Tag
      className={`${variantClass[variant]} ${alignClass[align]} ${className}`}
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
