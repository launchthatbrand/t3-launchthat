import React from "react";

export type MediaItem = {
  id: number | string;
  url: string;
  title?: string;
  filename?: string;
  caption?: string;
  alt?: string;
  type?: string;
  width?: number;
  height?: number;
  mime?: string;
};

export type MediaPickerProps = {
  multiple?: boolean;
  allowedTypes?: string[];
  value?: MediaItem[];
  onSelect: (items: MediaItem[]) => void;
  variant?: "card" | "inline";
  title?: string;
};

/**
 * Placeholder MediaPicker component.
 * Consumers should replace this via webpack aliasing or forked implementation.
 */
export const MediaPicker: React.FC<MediaPickerProps> = ({
  multiple = true,
  value = [],
  onSelect,
  title = "Select Media",
}) => {
  const handleSelect = () => {
    // Simply echo selected value back – real integrations should open a modal and pass selected items
    onSelect(value);
  };

  return (
    <div className="rounded border border-dashed border-gray-300 p-4 text-sm text-gray-600">
      <p className="font-medium text-gray-700">{title}</p>
      <p className="mt-2">
        This is a placeholder MediaPicker. Provide your own implementation by replacing this
        component in the `@acme/puck-config` package to integrate with your media library.
      </p>
      <button
        type="button"
        onClick={handleSelect}
        className="mt-3 rounded border border-gray-400 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-700"
      >
        {multiple ? "Review Selected Media" : "Use Current Selection"}
      </button>
    </div>
  );
};

