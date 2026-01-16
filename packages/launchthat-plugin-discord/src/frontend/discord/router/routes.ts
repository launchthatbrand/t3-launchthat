export const normalizeBasePath = (basePath: string) =>
  basePath.endsWith("/") ? basePath.slice(0, -1) : basePath;

export const getDiscordAdminRoute = (
  basePath: string,
  segments: string[] = [],
) => {
  const normalized = normalizeBasePath(basePath);
  if (segments.length === 0) return normalized;
  return `${normalized}/${segments.map(encodeURIComponent).join("/")}`;
};

export const getSegment = (segments?: string[]) => segments?.[0] ?? "overview";
