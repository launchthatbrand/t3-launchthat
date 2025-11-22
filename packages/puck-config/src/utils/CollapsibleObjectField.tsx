import { ObjectField } from "@measured/puck";
import React from "react";

type CollapsibleFieldProps = {
  field?: {
    label?: string;
    render?: (props: CollapsibleFieldRenderProps) => React.ReactNode;
  };
  name?: string;
  value?: Record<string, unknown>;
  onChange?: (value: Record<string, unknown>) => void;
  children?: React.ReactNode;
  objectFields?: ObjectField[];
};

type CollapsibleFieldRenderProps = CollapsibleFieldProps;

/**
 * Collapsible Object Field Component
 * Custom field renderer for object types that provides an accordion-style UI
 */
export const CollapsibleObjectField: React.FC<CollapsibleFieldProps> = ({
  field,
  name, // eslint-disable-line @typescript-eslint/no-unused-vars
  value = {},
  onChange,
  objectFields,
  children,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Intentionally unused but kept for compatibility with field renderer signature
  void value;
  void onChange;

  return (
    <div className="mb-3 overflow-hidden rounded-md">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-2.5 transition-colors hover:from-purple-100 hover:to-blue-100"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {field?.label || "Settings"}
          <span className="text-xs font-normal text-gray-500">
            ({isOpen ? "collapse" : "expand"})
          </span>
        </span>
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && <div className="space-y-3 bg-white p-0">{children}</div>}
    </div>
  );
};
