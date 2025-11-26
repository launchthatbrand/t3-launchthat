import type { ContentItemBase } from "./content";

/**
 * Represents a section within a module, containing content items.
 */
export interface Section {
  /** Unique identifier for the section */
  id: string;
  /** Display title for the section */
  title: string;
  /** Content items in this section (lessons, topics, quizzes, etc.) */
  items: ContentItemBase[];
}

/**
 * Represents a module within a course, containing sections.
 */
export interface Module {
  /** Unique identifier for the module */
  id: string;
  /** Display title for the module */
  title: string;
  /** Sections within this module */
  sections: Section[];
}

/**
 * Represents a course, containing modules and progress/navigation metadata.
 */
export interface Course {
  /** Unique identifier for the course */
  id: string;
  /** Display title for the course */
  title: string;
  /** Modules within the course */
  modules: Module[];
  /** Optional: ID of the current module for navigation */
  currentModuleId?: string;
  /** Optional: List of completed section IDs for progress tracking */
  completedSections?: string[];
  /** Optional: Additional metadata for extensibility */
  [key: string]: unknown;
}

/**
 * Represents the full course structure hierarchy.
 */
export type CourseStructure = Course;
