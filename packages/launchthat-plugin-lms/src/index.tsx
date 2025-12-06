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
import { AdminLessonCompletionCallout } from "./components/AdminLessonCompletionCallout";
import { CourseProgress } from "./components/CourseProgress";
import { FrontendLessonCompletionCallout } from "./components/FrontendLessonCompletionCallout";
import { CourseNav } from "./frontend/CourseNav";
import { CoursesArchive } from "./frontend/CoursesArchive";
import { CourseSingle } from "./frontend/CourseSingle";
import { CourseBuilderScreen } from "./screens/CourseBuilderScreen";
import { LmsSettingsPage } from "./settings/LmsSettingsPage";
import { CourseBuilderTab } from "./tabs/CourseBuilderTab";
import { CourseLinkedProductTab } from "./tabs/CourseLinkedProductTab";
import { CourseMembersTab } from "./tabs/CourseMembersTab";
import { CourseSettingsTab } from "./tabs/CourseSettingsTab";

export type { CourseSummary } from "./frontend/CoursesArchive";

export {
  CourseBuilderScreen,
  CourseBuilderTab,
  CourseLinkedProductTab,
  CourseMembersTab,
  CourseSettingsTab,
  LmsSettingsPage,
  CoursesArchive,
  CourseSingle,
  CourseNav,
};

export interface LmsPluginComponents {
  CourseBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CourseMembersTab: ComponentType<PluginSingleViewComponentProps>;
  CourseLinkedProductTab: ComponentType<PluginSingleViewComponentProps>;
  CourseSettingsTab: ComponentType<PluginSingleViewComponentProps>;
}

const buildCompletionSlot = (slug: string) => ({
  id: `lms-${slug}-completion-slot`,
  location: "afterMainContent" as const,
  render: (props: PluginSingleViewSlotProps) => (
    <AdminLessonCompletionCallout {...props} />
  ),
});

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

export const createLmsPluginDefinition = ({
  CourseBuilderTab,
  CourseMembersTab,
  CourseLinkedProductTab,
  CourseSettingsTab,
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
      },
      adminMenu: {
        enabled: true,
        label: "Courses",
        slug: "courses",
        parent: "lms",
        icon: "GraduationCap",
        position: 30,
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
      singleViewSlots: [buildCompletionSlot("courses")],
    },
    {
      name: "Lessons",
      slug: "lessons",
      description: "Lessons nested under a course.",
      isPublic: true,
      includeTimestamps: true,
      enableApi: true,
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
      },
      adminMenu: {
        enabled: true,
        label: "Lessons",
        slug: "lessons",
        parent: "lms",
        icon: "BookOpenCheck",
        position: 31,
      },
      singleViewSlots: [buildCompletionSlot("lessons")],
    },
    {
      name: "Topics",
      slug: "topics",
      description: "Lesson topics / sub-lessons.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
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
      },
      adminMenu: {
        enabled: true,
        label: "Topics",
        slug: "topics",
        parent: "lms",
        icon: "ListChecks",
        position: 32,
      },
      singleViewSlots: [buildCompletionSlot("topics")],
    },
    {
      name: "Quizzes",
      slug: "quizzes",
      description: "Assessments that connect to lessons/topics.",
      isPublic: false,
      includeTimestamps: true,
      enableApi: true,
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
      },
      adminMenu: {
        enabled: true,
        label: "Quizzes",
        slug: "quizzes",
        parent: "lms",
        icon: "ClipboardCheck",
        position: 33,
      },
      singleViewSlots: [buildCompletionSlot("quizzes")],
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
});

export const getDefaultLmsComponents = () => ({
  CourseBuilderTab,
  CourseMembersTab,
  CourseLinkedProductTab,
  CourseSettingsTab,
});

export let lmsPlugin: PluginDefinition = createLmsPluginDefinition(
  getDefaultLmsComponents(),
);

type ConfigureLmsPluginArgs = {
  CourseBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CourseMembersTab?: ComponentType<PluginSingleViewComponentProps>;
  CourseLinkedProductTab?: ComponentType<PluginSingleViewComponentProps>;
  CourseSettingsTab?: ComponentType<PluginSingleViewComponentProps>;
};

export const configureLmsPlugin = ({
  CourseBuilderTab,
  CourseMembersTab: membersOverride,
  CourseLinkedProductTab: linkedProductOverride,
  CourseSettingsTab: settingsOverride,
}: ConfigureLmsPluginArgs) => {
  lmsPlugin = createLmsPluginDefinition({
    CourseBuilderTab,
    CourseMembersTab: membersOverride ?? CourseMembersTab,
    CourseLinkedProductTab: linkedProductOverride ?? CourseLinkedProductTab,
    CourseSettingsTab: settingsOverride ?? CourseSettingsTab,
  });
};

export default createLmsPluginDefinition;
