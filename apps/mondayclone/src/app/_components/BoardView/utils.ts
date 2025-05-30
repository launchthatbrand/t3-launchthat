export const getGroupColorProps = (color: string | undefined) => {
  if (!color) return { style: { backgroundColor: "#3b82f6", color: "#fff" } }; // Tailwind blue-500
  // If hex code, use as is
  if (color.startsWith("#"))
    return { style: { backgroundColor: color, color: "#fff" } };
  // If it's a known Tailwind color name, map to hex (basic mapping for common colors)
  const colorMap: Record<string, string> = {
    red: "#ef4444",
    orange: "#f59e42",
    yellow: "#eab308",
    green: "#22c55e",
    blue: "#3b82f6",
    indigo: "#6366f1",
    violet: "#8b5cf6",
    purple: "#a21caf",
    pink: "#ec4899",
    gray: "#6b7280",
  };
  if (typeof color === "string") {
    const base = color.split("-")[0];
    if (base && colorMap[base])
      return { style: { backgroundColor: colorMap[base], color: "#fff" } };
  }
  return { style: { backgroundColor: "#3b82f6", color: "#fff" } };
};
