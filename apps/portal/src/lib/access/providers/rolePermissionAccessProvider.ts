import type {
  ContentAccessDecision,
  ContentAccessProvider,
} from "../contentAccessRegistry";

interface ContentAccessRulesLike {
  requiredRoleNames?: string[] | null;
  requiredPermissionKeys?: string[] | null;
}

interface EvalData {
  contentRules?: ContentAccessRulesLike | null;
  roleNames?: string[]; // resolved role names for the viewer
  permissionGrants?: Record<string, boolean>; // permissionKey -> allowed
  userRole?: string | null; // legacy user.role string
}

const normalize = (value: unknown): string =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export const rolePermissionAccessProvider: ContentAccessProvider = {
  id: "core.rolePermissionAccess",
  priority: 20,
  decide: ({ subject, data }): ContentAccessDecision => {
    const d = (data ?? {}) as EvalData;
    const rules = (d.contentRules ?? null);
    if (!rules) return { kind: "abstain" };

    const requiredRoles = Array.isArray(rules.requiredRoleNames)
      ? rules.requiredRoleNames.filter((r) => typeof r === "string" && r.trim().length > 0)
      : [];
    const requiredPerms = Array.isArray(rules.requiredPermissionKeys)
      ? rules.requiredPermissionKeys.filter(
          (p) => typeof p === "string" && p.trim().length > 0,
        )
      : [];

    if (requiredRoles.length === 0 && requiredPerms.length === 0) {
      return { kind: "abstain" };
    }

    if (!subject.isAuthenticated) {
      return { kind: "deny", reason: "Please sign in to access this content" };
    }

    const roleNameSet = new Set(
      [
        ...(Array.isArray(d.roleNames) ? d.roleNames : []),
        ...(d.userRole ? [d.userRole] : []),
      ]
        .map(normalize)
        .filter(Boolean),
    );

    if (requiredRoles.length > 0) {
      const hasRole = requiredRoles.map(normalize).some((r) => roleNameSet.has(r));
      if (!hasRole) {
        return { kind: "deny", reason: "Missing required role" };
      }
    }

    if (requiredPerms.length > 0) {
      const grants = d.permissionGrants ?? {};
      const allOk = requiredPerms.every((k) => grants[k] === true);
      if (!allOk) {
        return { kind: "deny", reason: "Missing required permission" };
      }
    }

    return { kind: "allow" };
  },
};


