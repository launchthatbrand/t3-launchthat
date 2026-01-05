type ContentAccessDecision =
  | { kind: "allow"; reason?: string }
  | { kind: "deny"; reason?: string }
  | { kind: "redirect"; to: string; reason?: string }
  | { kind: "abstain" };

type ContentAccessProvider = {
  id: string;
  pluginId?: string;
  priority?: number;
  decide: (args: {
    subject: { isAuthenticated: boolean };
    resource: { contentType: string; contentId: string };
    data?: unknown;
  }) => ContentAccessDecision;
};

type LmsCourseAccessMode = "open" | "free" | "buy_now" | "recurring" | "closed";

type LmsCourseAccessContext = {
  courseId: string;
  courseSlug: string;
  accessMode: LmsCourseAccessMode;
  cascadeToSteps: boolean;
  buyNowUrl?: string | null;
  // True if the current resource should inherit the course access mode (lesson/topic/etc).
  appliesToCurrentResource: boolean;
};

type EvalData = {
  lmsCourseAccess?: LmsCourseAccessContext | null;
  userRole?: string | null;
  lmsAdminBypassCourseAccess?: boolean;
};

export const lmsCourseCascadeAccessProvider: ContentAccessProvider = {
  id: "lms.courseCascade",
  pluginId: "lms",
  priority: 15,
  decide: ({ subject, data, resource }): ContentAccessDecision => {
    const d = (data ?? {}) as EvalData;
    const ctx = d.lmsCourseAccess ?? null;
    if (!ctx) return { kind: "abstain" };

    const userRoleRaw =
      typeof d.userRole === "string" ? d.userRole.trim().toLowerCase() : "";
    const isAdmin = userRoleRaw === "admin";
    if (d.lmsAdminBypassCourseAccess === true && isAdmin) {
      return { kind: "allow", reason: "Admin bypass enabled" };
    }

    // Only enforce when the course is not open AND the policy applies to this resource.
    if (!ctx.appliesToCurrentResource) return { kind: "abstain" };
    if (ctx.accessMode === "open") return { kind: "abstain" };

    // Allow logged-out users to view the course landing page itself.
    // Enforcement should apply to step pages (lesson/topic/quiz) when cascade is enabled.
    if (resource.contentType === "post" && resource.contentId === ctx.courseId) {
      return { kind: "abstain" };
    }

    // Minimal enforcement for now: non-open LMS courses require authentication.
    // (Future: "free/buy_now/recurring/closed" can enforce enrollment/purchase.)
    if (!subject.isAuthenticated) {
      if (ctx.accessMode === "buy_now") {
        // Keep default AccessDeniedPage UX (Sign In / Go Home), but allow LMS to
        // inject a “Purchase this course” CTA via `frontend.accessDenied.actions`.
        return { kind: "deny", reason: "Purchase required" };
      }

      return {
        kind: "deny",
        reason: "Please log in to access this course content",
      };
    }

    return { kind: "abstain" };
  },
};
