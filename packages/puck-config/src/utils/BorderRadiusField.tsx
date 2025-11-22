import React from "react";

export type BorderRadiusOption = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
export type BorderRadiusMode = "all" | "individual";

export type BorderRadiusValue = {
  mode: BorderRadiusMode;
  all: BorderRadiusOption;
  corners: {
    tl: BorderRadiusOption;
    tr: BorderRadiusOption;
    br: BorderRadiusOption;
    bl: BorderRadiusOption;
  };
};

type BorderRadiusFieldProps = {
  value?: Partial<BorderRadiusValue>;
  onChange: (value: BorderRadiusValue) => void;
};

const radiusOptions: { label: string; value: BorderRadiusOption }[] = [
  { label: "None", value: "none" },
  { label: "SM", value: "sm" },
  { label: "MD", value: "md" },
  { label: "LG", value: "lg" },
  { label: "XL", value: "xl" },
  { label: "2XL", value: "2xl" },
  { label: "Full", value: "full" },
];

const defaultCorners: BorderRadiusValue["corners"] = {
  tl: "none",
  tr: "none",
  br: "none",
  bl: "none",
};

/**
 * Border Radius Field Component
 * Custom field for controlling border radius with individual corner control
 */
export const BorderRadiusField: React.FC<BorderRadiusFieldProps> = ({ value, onChange }) => {
  const initialMode: BorderRadiusMode = value?.mode ?? "all";
  const initialAll: BorderRadiusOption = value?.all ?? "none";
  const initialCorners: BorderRadiusValue["corners"] = {
    ...defaultCorners,
    ...(value?.corners ?? {}),
  };

  const [mode, setMode] = React.useState<BorderRadiusMode>(initialMode);
  const [allValue, setAllValue] = React.useState<BorderRadiusOption>(initialAll);
  const [corners, setCorners] = React.useState(initialCorners);

  const handleModeChange = (newMode: BorderRadiusMode) => {
    setMode(newMode);
    onChange({
      mode: newMode,
      all: allValue,
      corners,
    });
  };

  const handleAllChange = (newValue: BorderRadiusOption) => {
    setAllValue(newValue);
    onChange({
      mode,
      all: newValue,
      corners,
    });
  };

  const handleCornerChange = (corner: keyof BorderRadiusValue["corners"], newValue: BorderRadiusOption) => {
    const newCorners = { ...corners, [corner]: newValue };
    setCorners(newCorners);
    onChange({
      mode,
      all: allValue,
      corners: newCorners,
    });
  };

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => handleModeChange("all")}
          className={`rounded px-3 py-1 text-xs ${
            mode === "all"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          All
        </button>
        <button
          type="button"
          onClick={() => handleModeChange("individual")}
          className={`rounded px-3 py-1 text-xs ${
            mode === "individual"
              ? "bg-blue-500 text-white"
              : "bg-gray-200 text-gray-700 hover:bg-gray-300"
          }`}
        >
          Individual
        </button>
      </div>

      {mode === "all" ? (
        <select
          value={allValue}
          onChange={(e) => handleAllChange(e.target.value)}
          className="w-full rounded border px-2 py-1 text-sm"
        >
          {radiusOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs text-gray-600">Top Left</label>
            <select
              value={corners.tl}
              onChange={(e) => handleCornerChange("tl", e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs"
            >
              {radiusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Top Right</label>
            <select
              value={corners.tr}
              onChange={(e) => handleCornerChange("tr", e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs"
            >
              {radiusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Bottom Left</label>
            <select
              value={corners.bl}
              onChange={(e) => handleCornerChange("bl", e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs"
            >
              {radiusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-600">Bottom Right</label>
            <select
              value={corners.br}
              onChange={(e) => handleCornerChange("br", e.target.value)}
              className="w-full rounded border px-2 py-1 text-xs"
            >
              {radiusOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
};
