import type {
  PluginDefinition,
  PluginFrontendSingleRendererProps,
  PluginFrontendSingleSlotProps,
  PluginSingleViewComponentProps,
  PluginSingleViewSlotProps,
} from "launchthat-plugin-core";
import type { ComponentType } from "react";

import type { CourseSummary } from "./frontend/CoursesArchive";
import type { Id } from "./lib/convexId";
import { LmsBadgesMetaBox } from "./admin/metaBoxes/LmsBadgesMetaBox";
import { LmsQuizPassPercentMetaBox } from "./admin/metaBoxes/LmsQuizPassPercentMetaBox";
import { AdminLessonCompletionCallout } from "./components/AdminLessonCompletionCallout";
import { CourseProgress } from "./components/CourseProgress";
import { FrontendLessonCompletionCallout } from "./components/FrontendLessonCompletionCallout";
import { CertificateViewer } from "./frontend/CertificateViewer";
import { CourseNav } from "./frontend/CourseNav";
import { CoursesArchive } from "./frontend/CoursesArchive";
import { CourseSingle } from "./frontend/CourseSingle";
import { CourseBuilderScreen } from "./screens/CourseBuilderScreen";
import { LmsSettingsPage } from "./settings/LmsSettingsPage";
import { CertificateBuilderTab } from "./tabs/CertificateBuilderTab";
import { CourseBuilderTab } from "./tabs/CourseBuilderTab";
import { CourseLinkedProductTab } from "./tabs/CourseLinkedProductTab";
import { CourseMembersTab } from "./tabs/CourseMembersTab";
import { CourseSettingsTab } from "./tabs/CourseSettingsTab";
import { QuizBuilderTab } from "./tabs/QuizBuilderTab";

export type { CourseSummary } from "./frontend/CoursesArchive";

export {
  CourseBuilderScreen,
  CourseBuilderTab,
  CertificateBuilderTab,
  CourseLinkedProductTab,
  CourseMembersTab,
  CourseSettingsTab,
  LmsSettingsPage,
  CoursesArchive,
  CourseSingle,
  CertificateViewer,
  CourseNav,
};
export {
  LmsCourseProvider,
  useLmsCourseContext,
} from "./providers/LmsCourseProvider";

export interface LmsPluginComponents {
  CourseBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CourseMembersTab: ComponentType<PluginSingleViewComponentProps>;
  CourseLinkedProductTab: ComponentType<PluginSingleViewComponentProps>;
  CourseSettingsTab: ComponentType<PluginSingleViewComponentProps>;
  QuizBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CertificateBuilderTab: ComponentType<PluginSingleViewComponentProps>;
}

// const buildCompletionSlot = (slug: string) => ({
//   id: `lms-${slug}-completion-slot`,
//   location: "afterMainContent" as const,
//   render: (props: PluginSingleViewSlotProps) => (
//     <AdminLessonCompletionCallout {...props} />
//   ),
// });

const buildFrontendCompletionSlot = (slug: string) => ({
  id: `lms-frontend-${slug}-completion-slot`,
  location: "afterContent" as const,
  render: (props: PluginFrontendSingleSlotProps) => (
    <FrontendLessonCompletionCallout {...props} />
  ),
});

const buildFrontendProgressSlot = (slug: string) => ({
  id: `lms-frontend-${slug}-progress-slot`,
  location: "header" as const,
  render: (props: PluginFrontendSingleSlotProps) => (
    <CourseProgress {...props} />
  ),
});

const LMS_COMPONENT_TABLES = [
  "launchthat_lms:posts",
  "launchthat_lms:postsMeta",
];

const LMS_POST_TYPE_SLUG_SET = new Set([
  "courses",
  "lessons",
  "topics",
  "quizzes",
  "certificates",
]);

const FRONTEND_TAXONOMY_TERM_LINK_FILTER = "frontend.single.taxonomy.termLink";

export const createLmsPluginDefinition = ({
  CourseBuilderTab,
  CourseMembersTab,
  CourseLinkedProductTab,
  CourseSettingsTab,
  QuizBuilderTab,
  CertificateBuilderTab,
}: LmsPluginComponents): PluginDefinition => ({
  id: "lms",
  name: "Learning Management System",
  description: "Courses, lessons, topics and quizzes with learner tracking.",
  longDescription:
    "Perfect for education businesses. Enabling this plugin provisions all LMS post types with archive pages, admin menus and rich metadata.",
  features: [
    "Course + lesson builders",
    "Topic + quiz post types",
    "Access control hooks",
    "Completion tracking",
  ],
  postTypes: [
    {
      name: "Courses",
      slug: "courses",
      description: "Top-level LMS course container.",
      isPublic: true,
      includeTimestamps: true,
      enableApi: true,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        attachments: true,
        featuredImage: true,
        customFields: true,
        revisions: true,
        taxonomy: true,
      },
      rewrite: {
        hasArchive: true,
        archiveSlug: "courses",
        singleSlug: "course",
        withFront: true,
        feeds: false,
        pages: true,
      },
      frontend: {
        archive: {
          render: ({ posts }) => (
            <CoursesArchive courses={(posts ?? []) as CourseSummary[]} />
          ),
        },
        single: {
          render: ({ post }: PluginFrontendSingleRendererProps) => {
            const typedPost = post as {
              _id: string;
              slug?: string | null;
              organizationId?: string | null;
            };
            return (
              <CourseSingle
                courseId={typedPost._id as Id<"posts">}
                courseSlug={typedPost.slug ?? undefined}
                organizationId={
                  typedPost.organizationId as Id<"organizations"> | undefined
                }
              />
            );
          },
        },
        singleSlots: [
          buildFrontendProgressSlot("courses"),
          buildFrontendCompletionSlot("courses"),
        ],
        filters: [
          {
            id: "lms-linear-progress-content-guard",
            location: "content",
          },
        ],
      },
      adminMenu: {
        enabled: true,
        label: "Courses",
        slug: "courses",
        parent: "lms",
        icon: "GraduationCap",
        position: 30,
      },
      metaBoxes: [
        {
          id: "lms-badges",
          title: "Badges",
          description: "Badges earned by completing this course.",
          location: "sidebar",
          priority: 35,
          fieldKeys: [],
          rendererKey: "lms.badges.assign",
        },
      ],
      metaBoxRenderers: {
        "lms.badges.assign": LmsBadgesMetaBox,
      },
      singleView: {
        basePath: "/admin/lms/courses",
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Update course metadata, hero imagery and SEO.",
            usesDefaultEditor: true,
          },
          {
            id: "builder",
            slug: "builder",
            label: "Builder",
            description: "Control the modular course outline.",
            render: (props) => <CourseBuilderTab {...props} />,
          },
          {
            id: "members",
            slug: "members",
            label: "Members",
            description: "Invite and manage enrolled learners.",
            render: (props) => <CourseMembersTab {...props} />,
          },
          {
            id: "linked-product",
            slug: "linked-product",
            label: "Linked Product",
            description: "Map this course to a storefront listing.",
            render: (props) => <CourseLinkedProductTab {...props} />,
          },
          {
            id: "settings",
            slug: "settings",
            label: "Settings",
            description: "Control access, prerequisites, and pacing.",
            render: (props) => <CourseSettingsTab {...props} />,
          },
        ],
      },
      // singleViewSlots: [buildCompletionSlot("courses")],
    },
    {
      name: "Certificates",
      slug: "certificates",
      description:
        "Course completion certificates issued at the end of a course, lesson, or topic.",
      isPublic: true,
      includeTimestamps: true,
      enableApi: true,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        attachments: true,
        featuredImage: true,
        customFields: true,
        revisions: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "certificate",
        withFront: true,
        feeds: false,
        pages: true,
      },
      frontend: {
        single: {
          render: ({ post }: PluginFrontendSingleRendererProps) => {
            const typedPost = post as {
              _id: string;
              slug?: string | null;
              organizationId?: string | null;
            };
            return (
              <CertificateViewer
                certificateId={typedPost._id as Id<"posts">}
                certificateSlug={typedPost.slug ?? undefined}
                organizationId={
                  typedPost.organizationId as Id<"organizations"> | undefined
                }
              />
            );
          },
        },
      },
      adminMenu: {
        enabled: true,
        label: "Certificates",
        slug: "certificates",
        parent: "lms",
        icon: "Award",
        position: 55,
      },
      singleView: {
        basePath: "/admin/lms/certificates",
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Update certificate metadata and content.",
            usesDefaultEditor: true,
          },
          {
            id: "builder",
            slug: "builder",
            label: "Builder",
            description:
              "Design a printable certificate by placing dynamic fields on a background.",
            render: (props) => <CertificateBuilderTab {...props} />,
          },
        ],
      },
    },
    {
      name: "Badges",
      slug: "badges",
      description:
        "Achievement badges that can be earned by completing LMS content.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        excerpt: true,
        featuredImage: true,
        customFields: true,
        revisions: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "badge",
        withFront: true,
        feeds: false,
        pages: true,
      },
      adminMenu: {
        enabled: true,
        label: "Badges",
        slug: "badges",
        parent: "lms",
        icon: "BadgeCheck",
        position: 56,
      },
      singleView: {
        basePath: "/admin/lms/badges",
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Update badge details and imagery.",
            usesDefaultEditor: true,
          },
        ],
      },
    },
    {
      name: "Lessons",
      slug: "lessons",
      description: "Lessons nested under a course.",
      isPublic: true,
      includeTimestamps: true,
      enableApi: true,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        attachments: true,
        featuredImage: true,
        customFields: true,
        revisions: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "lesson",
        withFront: true,
        feeds: false,
        pages: true,
        permalink: {
          canonical: "/course/{meta.courseSlug}/lesson/{slug}",
          aliases: ["/lesson/{slug}"],
        },
      },
      frontend: {
        singleSlots: [
          buildFrontendProgressSlot("lessons"),
          buildFrontendCompletionSlot("lessons"),
        ],
        filters: [
          {
            id: "lms-linear-progress-content-guard",
            location: "content",
          },
        ],
      },
      adminMenu: {
        enabled: true,
        label: "Lessons",
        slug: "lessons",
        parent: "lms",
        icon: "BookOpenCheck",
        position: 31,
      },
      metaBoxes: [
        {
          id: "lms-badges",
          title: "Badges",
          description: "Badges earned by completing this lesson.",
          location: "sidebar",
          priority: 35,
          fieldKeys: [],
          rendererKey: "lms.badges.assign",
        },
      ],
      metaBoxRenderers: {
        "lms.badges.assign": LmsBadgesMetaBox,
      },
      // singleViewSlots: [buildCompletionSlot("lessons")],
    },
    {
      name: "Topics",
      slug: "topics",
      description: "Lesson topics / sub-lessons.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        customFields: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "topic",
        withFront: true,
        feeds: false,
        pages: true,
        permalink: {
          canonical:
            "/course/{meta.courseSlug}/lesson/{meta.lessonSlug}/topic/{slug}",
          aliases: ["/topic/{slug}"],
        },
      },
      frontend: {
        singleSlots: [
          buildFrontendProgressSlot("topics"),
          buildFrontendCompletionSlot("topics"),
        ],
        filters: [
          {
            id: "lms-linear-progress-content-guard",
            location: "content",
          },
        ],
      },
      adminMenu: {
        enabled: true,
        label: "Topics",
        slug: "topics",
        parent: "lms",
        icon: "ListChecks",
        position: 32,
      },
      metaBoxes: [
        {
          id: "lms-badges",
          title: "Badges",
          description: "Badges earned by completing this topic.",
          location: "sidebar",
          priority: 35,
          fieldKeys: [],
          rendererKey: "lms.badges.assign",
        },
      ],
      metaBoxRenderers: {
        "lms.badges.assign": LmsBadgesMetaBox,
      },
      // singleViewSlots: [buildCompletionSlot("topics")],
    },
    {
      name: "Quizzes",
      slug: "quizzes",
      description: "Assessments that connect to lessons/topics.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        postMeta: true,
      },
      rewrite: {
        hasArchive: false,
        singleSlug: "quiz",
        withFront: true,
        feeds: false,
        pages: true,
        permalink: {
          canonical:
            "/course/{meta.courseSlug}/lesson/{meta.lessonSlug}/quiz/{slug}",
          aliases: ["/quiz/{slug}"],
        },
      },
      frontend: {
        singleSlots: [buildFrontendCompletionSlot("quizzes")],
        filters: [
          {
            id: "lms-linear-progress-content-guard",
            location: "content",
          },
          {
            id: "lms-quiz-content-injector",
            location: "content",
          },
        ],
      },
      adminMenu: {
        enabled: true,
        label: "Quizzes",
        slug: "quizzes",
        parent: "lms",
        icon: "ClipboardCheck",
        position: 33,
      },
      metaBoxes: [
        {
          id: "lms-badges",
          title: "Badges",
          description: "Badges earned by passing this quiz.",
          location: "sidebar",
          priority: 35,
          fieldKeys: [],
          rendererKey: "lms.badges.assign",
        },
        {
          id: "lms-quiz-pass-percent",
          title: "Quiz passing",
          description:
            "Configure the minimum percentage required to pass this quiz (used for awarding badges).",
          location: "sidebar",
          priority: 36,
          fieldKeys: [],
          rendererKey: "lms.quiz.passPercent",
        },
      ],
      metaBoxRenderers: {
        "lms.badges.assign": LmsBadgesMetaBox,
        "lms.quiz.passPercent": LmsQuizPassPercentMetaBox,
      },
      singleView: {
        basePath: "/admin/lms/quizzes",
        defaultTab: "edit",
        tabs: [
          {
            id: "edit",
            slug: "edit",
            label: "Edit",
            description: "Manage quiz metadata and content.",
            usesDefaultEditor: true,
          },
          {
            id: "builder",
            slug: "builder",
            label: "Builder",
            description: "Create questions and configure answer logic.",
            render: (props) => <QuizBuilderTab {...props} />,
          },
        ],
      },
    },
    {
      name: "Quiz Questions",
      slug: "lms-quiz-question",
      description: "Individual quiz questions managed through the builder.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: false,
      storageKind: "component",
      storageTables: LMS_COMPONENT_TABLES,
      supports: {
        title: true,
        editor: true,
        customFields: true,
      },
      rewrite: {
        hasArchive: false,
      },
      adminMenu: {
        enabled: true,
        label: "Quiz Questions",
        slug: "lms-quiz-question",
        parent: "lms",
        icon: "HelpCircle",
        position: 34,
      },
    },
  ],
  settingsPages: [
    {
      id: "lms-settings",
      slug: "settings",
      label: "Settings",
      description: "Configure branding, learner defaults and assessments.",
      render: (props) => <LmsSettingsPage {...props} />,
    },
  ],
  hooks: {
    filters: [
      {
        hook: FRONTEND_TAXONOMY_TERM_LINK_FILTER,
        acceptedArgs: 2,
        callback: (href: unknown, context: unknown) => {
          if (typeof href !== "string") {
            return href;
          }
          if (!context || typeof context !== "object") {
            return href;
          }

          const ctx = context as Record<string, unknown>;
          const postTypeSlug =
            typeof ctx.postTypeSlug === "string" ? ctx.postTypeSlug : undefined;
          if (!postTypeSlug || !LMS_POST_TYPE_SLUG_SET.has(postTypeSlug)) {
            return href;
          }

          const courseSlug =
            typeof ctx.courseSlug === "string" ? ctx.courseSlug : undefined;
          const taxonomySlug =
            typeof ctx.taxonomySlug === "string" ? ctx.taxonomySlug : undefined;
          const termSlug =
            typeof ctx.termSlug === "string" ? ctx.termSlug : undefined;

          if (!courseSlug || !taxonomySlug || !termSlug) {
            return href;
          }

          const taxonomyParam =
            taxonomySlug === "category"
              ? "category"
              : taxonomySlug === "post_tag"
                ? "tag"
                : taxonomySlug;
          const key =
            taxonomySlug === "category"
              ? "category"
              : taxonomySlug === "post_tag"
                ? "tag"
                : taxonomySlug;

          return `/course/${encodeURIComponent(courseSlug)}?taxonomy=${encodeURIComponent(
            taxonomyParam,
          )}&${encodeURIComponent(key)}=${encodeURIComponent(termSlug)}`;
        },
      },
    ],
  },
});

export const getDefaultLmsComponents = () => ({
  CourseBuilderTab,
  CourseMembersTab,
  CourseLinkedProductTab,
  CourseSettingsTab,
  QuizBuilderTab,
  CertificateBuilderTab,
});

export let lmsPlugin: PluginDefinition = createLmsPluginDefinition(
  getDefaultLmsComponents(),
);

type ConfigureLmsPluginArgs = {
  CourseBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CourseMembersTab?: ComponentType<PluginSingleViewComponentProps>;
  CourseLinkedProductTab?: ComponentType<PluginSingleViewComponentProps>;
  CourseSettingsTab?: ComponentType<PluginSingleViewComponentProps>;
  QuizBuilderTab?: ComponentType<PluginSingleViewComponentProps>;
  CertificateBuilderTab?: ComponentType<PluginSingleViewComponentProps>;
};

export const configureLmsPlugin = ({
  CourseBuilderTab,
  CourseMembersTab: membersOverride,
  CourseLinkedProductTab: linkedProductOverride,
  CourseSettingsTab: settingsOverride,
  QuizBuilderTab: quizBuilderOverride,
  CertificateBuilderTab: certificateBuilderOverride,
}: ConfigureLmsPluginArgs) => {
  lmsPlugin = createLmsPluginDefinition({
    CourseBuilderTab,
    CourseMembersTab: membersOverride ?? CourseMembersTab,
    CourseLinkedProductTab: linkedProductOverride ?? CourseLinkedProductTab,
    CourseSettingsTab: settingsOverride ?? CourseSettingsTab,
    QuizBuilderTab: quizBuilderOverride ?? QuizBuilderTab,
    CertificateBuilderTab: certificateBuilderOverride ?? CertificateBuilderTab,
  });
};

export default createLmsPluginDefinition;
