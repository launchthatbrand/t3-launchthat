"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import type { TabConfig } from "~/components/admin/NavigationContext";
import { AdminLayout, AdminLayoutHeader } from "~/components/admin/AdminLayout";
import { NavigationContext } from "~/components/admin/NavigationContext";

interface AdminLayoutProps {
  children: ReactNode;
}

export const COURSE_TABS: TabConfig[] = [
  {
    value: "courses",
    label: "Courses",
    href: "/admin/lms/courses",
  },
  {
    value: "lessons",
    label: "Lessons",
    href: "/admin/lms/lessons",
  },
  {
    value: "topics",
    label: "Topics",
    href: "/admin/lms/topics",
  },
  {
    value: "quizzes",
    label: "Quizzes",
    href: "/admin/lms/quizzes",
  },
];

export default function AdminStoreLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const baseUrl = "/admin/lms";
  const coursesUrl = "/admin/lms/courses";
  const lessonsUrl = "/admin/lms/lessons";
  const topicsUrl = "/admin/lms/topics";
  const quizzesUrl = "/admin/lms/quizzes";

  // Check if we're on a specific order page (has an ORDER_ID)
  const isSpecificCoursePage = () => {
    const orderIdPattern = new RegExp(`^${coursesUrl}/[^/]+$`);
    return orderIdPattern.test(pathname);
  };

  const isSpecificLessonPage = () => {
    const lessonIdPattern = new RegExp(`^${lessonsUrl}/[^/]+$`);
    return lessonIdPattern.test(pathname);
  };

  const isSpecificTopicPage = () => {
    const topicIdPattern = new RegExp(`^${topicsUrl}/[^/]+$`);
    return topicIdPattern.test(pathname);
  };

  const isSpecificQuizPage = () => {
    const quizIdPattern = new RegExp(`^${quizzesUrl}/[^/]+$`);
    return quizIdPattern.test(pathname);
  };

  // Get page configuration based on current route
  const getPageConfig = () => {
    if (isSpecificCoursePage()) {
      const courseId = pathname.split(`${coursesUrl}/`)[1];
      return {
        title: `Course ${courseId}`,
        description: `View and manage course details for ${courseId}`,
        showTabs: true,
        activeTab: "courses", // Default to details tab for order pages
        tabs: COURSE_TABS, // Use order-specific tabs with client navigation
        navigationContext: NavigationContext.ENTITY_LEVEL,
      };
    }

    if (isSpecificLessonPage()) {
      const lessonId = pathname.split(`${lessonsUrl}/`)[1];
      return {
        title: `Lesson ${lessonId}`,
        description: `View and manage lesson details for ${lessonId}`,
        showTabs: true,
        activeTab: "lessons",
      };
    }
    if (isSpecificTopicPage()) {
      const topicId = pathname.split(`${topicsUrl}/`)[1];
      return {
        title: `Topic ${topicId}`,
        description: `View and manage topic details for ${topicId}`,
        showTabs: true,
        activeTab: "topics",
      };
    }
    if (isSpecificQuizPage()) {
      const quizId = pathname.split(`${quizzesUrl}/`)[1];
      return {
        title: `Quiz ${quizId}`,
        description: `View and manage quiz details for ${quizId}`,
        showTabs: true,
        activeTab: "quizzes",
      };
    }

    //Default configurations for other pages - all use STORE_TABS with server navigation
    if (pathname === baseUrl) {
      return {
        title: "Store Dashboard",
        description: "Overview of your store performance and metrics",
        showTabs: true,
        activeTab: "dashboard",
        tabs: COURSE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/courses`)) {
      return {
        title: "Courses",
        description: "Manage and track lms courses",
        showTabs: true,
        activeTab: "courses",
        tabs: COURSE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/lessons`)) {
      return {
        title: "Lessons",
        description: "Manage and track lms lessons",
        showTabs: true,
        activeTab: "lessons",
        tabs: COURSE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/topics`)) {
      return {
        title: "Topics",
        description: "Manage and track lms topics",
        showTabs: true,
        activeTab: "topics",
        tabs: COURSE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    if (pathname.startsWith(`${baseUrl}/quizzes`)) {
      return {
        title: "Quizzes",
        description: "Manage and track lms quizzes",
        showTabs: true,
        activeTab: "quizzes",
        tabs: COURSE_TABS,
        navigationContext: NavigationContext.SECTION_LEVEL,
      };
    }

    // Fallback
    return {
      title: "Courses",
      description: "Manage your courses, lessons, and topics",
      showTabs: true,
      activeTab: "courses",
      tabs: COURSE_TABS,
      navigationContext: NavigationContext.SECTION_LEVEL,
    };
  };

  const pageConfig = getPageConfig();

  return (
    <AdminLayout
      title={pageConfig.title}
      description={pageConfig.description}
      showTabs={pageConfig.showTabs}
      activeTab={pageConfig.activeTab}
      tabs={pageConfig.tabs}
      baseUrl={baseUrl}
      pathname={pathname} // Enable auto-detection
      forceNavigationContext={pageConfig.navigationContext} // Override detection if needed
    >
      <AdminLayoutHeader />
      {children}
    </AdminLayout>
  );
}
