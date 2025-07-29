import { cx } from "class-variance-authority";
import { twMerge } from "tailwind-merge";

const cn = (...inputs: Parameters<typeof cx>) => twMerge(cx(inputs));

export { cn };

export * from "./accordion";
export * from "./alert";
export * from "./alert-dialog";
export * from "./aspect-ratio";
export * from "./avatar";
export * from "./badge";
export * from "./breadcrumb";
export * from "./button";
export * from "./calendar";
export * from "./card";
export * from "./carousel";
export * from "./chart";
export * from "./checkbox";
export * from "./collapsible";
export * from "./command";
export * from "./context-menu";
export * from "./dialog";
export * from "./drawer";
export * from "./dropdown-menu";
export * from "./form";
export * from "./general";
export * from "./hover-card";
export * from "./input";
export * from "./label";
export * from "./menubar";
export * from "./navigation-menu";
export * from "./pagination";
export * from "./popover";
export * from "./progress";
export * from "./radio-group";
export * from "./resizable";
export * from "./scroll-area";
export * from "./select";
export * from "./separator";
export * from "./sidebar";
export * from "./sheet";
export * from "./skeleton";
export * from "./slider";
export { Toaster as SonnerToaster } from "./sonner";
export * from "./switch";
export * from "./table";
export * from "./tabs";
export * from "./textarea";
export * from "./toast";
export * from "./toggle";
export * from "./toggle-group";
export * from "./tooltip";
export * from "./site-header";
export * from "./components/multi-select";
export type { NavItem } from "./components/sidebar-layout/app-sidebar";
// export * from "./sidebar"; // Assuming sidebar.tsx might be app-specific or a larger layout component
// export * from "./theme"; // Assuming theme.tsx has side effects or is not a direct component export

export { CourseBuilder } from "./CourseBuilderV3";
export type { CourseBuilderProps } from "./CourseBuilderV3";

// Advanced components
export * from "./advanced";
export * from "./copy-text";
export * from "./pdf-export";
export * from "./entity-list-with-pdf-export";
