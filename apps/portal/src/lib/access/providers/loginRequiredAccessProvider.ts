import type {
  ContentAccessDecision,
  ContentAccessProvider,
} from "../contentAccessRegistry";

type ContentAccessRulesLike = {
  isPublic?: boolean | null;
};

type EvalData = {
  contentRules?: ContentAccessRulesLike | null;
};

export const loginRequiredAccessProvider: ContentAccessProvider = {
  id: "core.loginRequired",
  priority: 10,
  decide: ({ subject, data }): ContentAccessDecision => {
    const d = (data ?? {}) as EvalData;
    const rules = (d.contentRules ?? null) as ContentAccessRulesLike | null;
    if (!rules) return { kind: "abstain" };

    const isPublic = Boolean(rules.isPublic);
    if (isPublic) return { kind: "abstain" };

    // If the page is not public, it must require authentication even if there
    // are no role/tag/permission constraints configured.
    if (!subject.isAuthenticated) {
      return { kind: "deny", reason: "Please log in to access this content" };
    }

    // Authenticated → let other providers evaluate additional constraints.
    return { kind: "abstain" };
  },
};


