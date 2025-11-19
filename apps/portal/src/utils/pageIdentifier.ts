/**
 * Represents the unique identifier for a page in the CMS
 */
export interface PageInfo {
  /**
   * The base page type (e.g., 'group', 'store', 'download')
   */
  type: string;

  /**
   * The specific section of the page (e.g., 'dashboard', 'members', 'products')
   */
  section: string;

  /**
   * Optional entity ID associated with the page (e.g., group ID)
   */
  entityId: string | null;

  /**
   * Full URL path that this page represents
   */
  path: string;

  /**
   * Unique string identifier for the page
   */
  identifier: string;
}

/**
 * Parses a URL path to determine the page information
 *
 * @param path The URL path to parse
 * @param entityId Optional entity ID to associate with the page
 * @returns The page information object
 */
export function getPageInfo(
  path: string,
  entityId: string | null = null,
): PageInfo {
  // Clean the path by removing leading/trailing slashes
  const cleanPath = path.replace(/^\/|\/$/g, "");

  // Split the path into segments
  const segments = cleanPath.split("/");

  // Default values
  let type = "page";
  let section = "default";
  let resolvedEntityId: string | null = entityId;

  // Determine page type and section based on path structure
  if (segments.length > 0) {
    // Handle admin routes
    if (segments[0] === "admin") {
      if (segments.length > 1) {
        type = segments[1] ?? "admin";

        // For groups, handle special case
        if (type === "groups" && segments.length > 2) {
          // If entityId is provided, use it
          // If not and there's an ID in the URL, use that
          const fallbackEntityId = segments[2] ?? null;
          resolvedEntityId = entityId ?? fallbackEntityId;

          // Determine the section based on segments
          section = segments[3] ?? "dashboard";

          return {
            type,
            section,
            entityId: resolvedEntityId,
            path: cleanPath,
            identifier: `${type}-${section}-${resolvedEntityId}`,
          };
        }

        // For other admin sections
        section = segments[2] ?? "dashboard";

        return {
          type,
          section,
          entityId: resolvedEntityId,
          path: cleanPath,
          identifier: resolvedEntityId
            ? `${type}-${section}-${resolvedEntityId}`
            : `${type}-${section}`,
        };
      } else {
        // Just /admin
        type = "admin";
        section = "dashboard";
      }
    } else {
      // Non-admin routes
      type = segments[0] ?? "page";
      section = segments[1] ?? "default";
    }
  } else {
    // Homepage
    type = "home";
    section = "main";
  }

  // Build the identifier
  const identifier = resolvedEntityId
    ? `${type}-${section}-${resolvedEntityId}`
    : `${type}-${section}`;

  return {
    type,
    section,
    entityId: resolvedEntityId,
    path: cleanPath,
    identifier,
  };
}

/**
 * Gets a fully qualified page identifier for a given URL and optional entity ID
 *
 * @param path The URL path
 * @param entityId Optional entity ID
 * @returns The page identifier string
 */
export function getPageIdentifier(
  path: string,
  entityId: string | null = null,
): string {
  return getPageInfo(path, entityId).identifier;
}

export function getTenantScopedPageIdentifier(
  path: string,
  options: {
    entityId?: string | null;
    organizationId?: string | null;
  } = {},
): string {
  const baseIdentifier = getPageIdentifier(path, options.entityId ?? null);
  if (!options.organizationId) {
    return baseIdentifier;
  }
  return `${options.organizationId}:${baseIdentifier}`;
}

/**
 * Gets the page type for a given URL
 *
 * @param path The URL path
 * @returns The page type
 */
export function getPageType(path: string): string {
  return getPageInfo(path).type;
}

/**
 * Gets the page section for a given URL
 *
 * @param path The URL path
 * @returns The page section
 */
export function getPageSection(path: string): string {
  return getPageInfo(path).section;
}
