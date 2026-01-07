import { useConvexUser } from "~/hooks/useConvexUser";

/**
 * Custom hook to check if the current user has a specific role.
 *
 * IMPORTANT:
 * Tenant/custom hosts intentionally do NOT mount <ClerkProvider />, so we avoid
 * Clerk hooks here and rely on the Convex user doc instead.
 *
 * @returns {object} An object containing:
 *  - `isLoaded`: Boolean indicating if the user state has loaded.
 *  - `hasRole`: Function to check if the user has the specified role.
 *               Returns `false` if auth is loading, user is not signed in,
 *               or user does not have the role.
 */
export const useRoleCheck = () => {
  const { user, isLoading } = useConvexUser();
  const isLoaded = !isLoading;

  /**
   * Checks if the signed-in user has the specified role.
   *
   * @param {string} role - The role to check for (e.g., 'admin').
   * @returns {boolean} True if the user is loaded, signed in, and has the role, false otherwise.
   */
  const hasRole = (role: string): boolean => {
    if (!isLoaded || !user) {
      return false;
    }

    const normalizedUserRole =
      typeof (user as { role?: unknown }).role === "string"
        ? String((user as { role: string }).role).trim().toLowerCase()
        : "";
    const normalizedTarget = role.trim().toLowerCase();

    // Treat common elevated roles as "admin".
    if (normalizedTarget === "admin") {
      return ["admin", "super_admin", "superadmin"].includes(normalizedUserRole);
    }

    return normalizedUserRole === normalizedTarget;
  };

  return { isLoaded, hasRole };
};
