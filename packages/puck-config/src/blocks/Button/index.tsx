import { StyleWrapper, defaultStyleProps, styleFields } from "../../utils"

import { ComponentConfig } from "@measured/puck";
import React from "react";
import { Button as _Button } from "@acme/ui/button";

export type ButtonProps = {
  label: string;
  href: string;
  variant: "primary" | "secondary";
  openInNewTab: boolean;
  buttonWidth: "auto" | "full" | "3/4" | "1/2" | "1/3";
  backgroundColor: "primary" | "secondary" | "destructive" | "success" | "warning" | "white" | "transparent";
  borderRadius: "none" | "sm" | "md" | "lg" | "xl" | "full";
  borderColor: "none" | "primary" | "secondary" | "border" | "muted";
  borderWidth: "0" | "1" | "2" | "4";
  buttonPadding: "0" | "2" | "3" | "4" | "6";
};

export const Button: ComponentConfig<ButtonProps> = {
  label: "Button",
  fields: {
    label: {
      type: "text",
      label: "Button Text",
      contentEditable: true, // Enable inline text editing on canvas
    },
    href: {
      type: "text",
      label: "Link URL",
    },
    variant: {
      type: "select",
      label: "Button Variant",
      options: [
        { label: "Primary", value: "primary" },
        { label: "Secondary", value: "secondary" },
      ],
    },
    openInNewTab: {
      type: "radio",
      label: "Open in New Tab",
      options: [
        { label: "Yes", value: true },
        { label: "No", value: false },
      ],
    },
    buttonWidth: {
      type: "select",
      label: "Button Width",
      options: [
        { label: "Auto (Content)", value: "auto" },
        { label: "Full Width", value: "full" },
        { label: "Large (75%)", value: "3/4" },
        { label: "Half (50%)", value: "1/2" },
        { label: "Small (33%)", value: "1/3" },
      ],
    },
    backgroundColor: {
      type: "select",
      label: "Background Color",
      options: [
        { label: "Primary (Blue)", value: "primary" },
        { label: "Secondary (Gray)", value: "secondary" },
        { label: "Destructive (Red)", value: "destructive" },
        { label: "Success (Green)", value: "success" },
        { label: "Warning (Yellow)", value: "warning" },
        { label: "White", value: "white" },
        { label: "Transparent", value: "transparent" },
      ],
    },
    borderRadius: {
      type: "select",
      label: "Border Radius",
      options: [
        { label: "None", value: "none" },
        { label: "Small (4px)", value: "sm" },
        { label: "Medium (8px)", value: "md" },
        { label: "Large (12px)", value: "lg" },
        { label: "Extra Large (16px)", value: "xl" },
        { label: "Full (9999px)", value: "full" },
      ],
    },
    borderColor: {
      type: "select",
      label: "Border Color",
      options: [
        { label: "None", value: "none" },
        { label: "Primary (Blue)", value: "primary" },
        { label: "Secondary (Gray)", value: "secondary" },
        { label: "Border (Default)", value: "border" },
        { label: "Muted", value: "muted" },
      ],
    },
    borderWidth: {
      type: "select",
      label: "Border Width",
      options: [
        { label: "None (0px)", value: "0" },
        { label: "Thin (1px)", value: "1" },
        { label: "Medium (2px)", value: "2" },
        { label: "Thick (4px)", value: "4" },
      ],
    },
    buttonPadding: {
      type: "select",
      label: "Button Padding",
      options: [
        { label: "None", value: "0" },
        { label: "Small (8px)", value: "2" },
        { label: "Medium (12px)", value: "3" },
        { label: "Large (16px)", value: "4" },
        { label: "Extra Large (24px)", value: "6" },
      ],
    },
    ...styleFields, // Add shared style fields
  },
  defaultProps: {
    label: "Click me",
    href: "#",
    openInNewTab: false,
    buttonWidth: "auto",
    backgroundColor: "primary",
    borderRadius: "md",
    borderColor: "none",
    borderWidth: "0",
    buttonPadding: "4",
    variant: "primary",
    ...defaultStyleProps, // Add default style props
  },
  inline: true,
  render: ({
    label,
    href,
    openInNewTab,
    buttonWidth,
    backgroundColor,
    borderRadius,
    borderColor,
    borderWidth,
    buttonPadding,
    puck,
    ...styleProps
  }) => {
    // Button width classes
    const buttonWidthClasses = {
      auto: "w-auto",
      full: "w-full",
      "3/4": "w-3/4",
      "1/2": "w-1/2",
      "1/3": "w-1/3",
    };

    // Map settings to Tailwind classes (same as ButtonCard)
    const bgColorClasses = {
      primary: "bg-primary text-primary-foreground hover:bg-primary/90",
      secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
      destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
      success: "bg-green-600 text-white hover:bg-green-700",
      warning: "bg-yellow-500 text-white hover:bg-yellow-600",
      white: "bg-white text-black hover:bg-gray-100",
      transparent: "bg-transparent hover:bg-muted",
    };

    const radiusClasses = {
      none: "rounded-none",
      sm: "rounded-sm",
      md: "rounded-md",
      lg: "rounded-lg",
      xl: "rounded-xl",
      full: "rounded-full",
    };

    const borderColorClasses = {
      none: "",
      primary: "border-primary",
      secondary: "border-secondary",
      border: "border-border",
      muted: "border-muted",
    };

    const borderWidthClasses = {
      0: "border-0",
      1: "border",
      2: "border-2",
      4: "border-4",
    };

    const paddingClasses = {
      0: "px-0 py-0",
      2: "px-4 py-2",
      3: "px-6 py-3",
      4: "px-8 py-4",
      6: "px-12 py-6",
    };

    const buttonClasses = [
      "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 font-bold",
      bgColorClasses[backgroundColor] || bgColorClasses.primary,
      radiusClasses[borderRadius] || radiusClasses.md,
      borderColorClasses[borderColor] || "",
      borderWidthClasses[borderWidth] || borderWidthClasses[0],
      paddingClasses[buttonPadding] || paddingClasses[4],
      buttonWidthClasses[buttonWidth] || "w-auto",
    ]
      .filter(Boolean)
      .join(" ");

    const buttonContent = (
      <a
        href={href || "#"}
        target={openInNewTab ? "_blank" : undefined}
        rel={openInNewTab ? "noopener noreferrer" : undefined}
        className={buttonClasses}
        data-element="button"
      >
        {label}
      </a>
    );

    return (
      <StyleWrapper styleProps={styleProps} dragRef={puck.dragRef}>
        {buttonContent}
      </StyleWrapper>
    );
  },
};
