import type {
  PluginDefinition,
  PluginSingleViewComponentProps,
} from "launchthat-plugin-core";

import type { ComponentType } from "react";
import { CourseBuilderScreen } from "./screens/CourseBuilderScreen";
import { CourseBuilderTab } from "./tabs/CourseBuilderTab";
import { CourseLinkedProductTab } from "./tabs/CourseLinkedProductTab";
import { CourseMembersTab } from "./tabs/CourseMembersTab";
import { LmsSettingsPage } from "./settings/LmsSettingsPage";

export {
  CourseBuilderScreen,
  CourseBuilderTab,
  CourseLinkedProductTab,
  CourseMembersTab,
  LmsSettingsPage,
};

export interface LmsPluginComponents {
  CourseBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CourseMembersTab: ComponentType<PluginSingleViewComponentProps>;
  CourseLinkedProductTab: ComponentType<PluginSingleViewComponentProps>;
}

export const createLmsPluginDefinition = ({
  CourseBuilderTab,
  CourseMembersTab,
  CourseLinkedProductTab,
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
      supports: {
        title: true,
        editor: true,
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
      },
      adminMenu: {
        enabled: true,
        label: "Lessons",
        slug: "lessons",
        parent: "lms",
        icon: "BookOpenCheck",
        position: 31,
      },
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
      },
      adminMenu: {
        enabled: true,
        label: "Topics",
        slug: "topics",
        parent: "lms",
        icon: "ListChecks",
        position: 32,
      },
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
      },
      adminMenu: {
        enabled: true,
        label: "Quizzes",
        slug: "quizzes",
        parent: "lms",
        icon: "ClipboardCheck",
        position: 33,
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
});

export const getDefaultLmsComponents = () => ({
  CourseBuilderTab,
  CourseMembersTab,
  CourseLinkedProductTab,
});

export let lmsPlugin: PluginDefinition = createLmsPluginDefinition(
  getDefaultLmsComponents(),
);

type ConfigureLmsPluginArgs = {
  CourseBuilderTab: ComponentType<PluginSingleViewComponentProps>;
  CourseMembersTab?: ComponentType<PluginSingleViewComponentProps>;
  CourseLinkedProductTab?: ComponentType<PluginSingleViewComponentProps>;
};

export const configureLmsPlugin = ({
  CourseBuilderTab,
  CourseMembersTab: membersOverride,
  CourseLinkedProductTab: linkedProductOverride,
}: ConfigureLmsPluginArgs) => {
  lmsPlugin = createLmsPluginDefinition({
    CourseBuilderTab,
    CourseMembersTab: membersOverride ?? CourseMembersTab,
    CourseLinkedProductTab: linkedProductOverride ?? CourseLinkedProductTab,
  });
};

export default createLmsPluginDefinition;

