"use client";

export type CourseAccessMode =
  | "open"
  | "free"
  | "buy_now"
  | "recurring"
  | "closed";

export type CourseProgressionMode = "linear" | "freeform";

export interface CourseSettings {
  accessMode: CourseAccessMode;
  prerequisites: string[];
  coursePoints: number;
  accessExpirationEnabled: boolean;
  accessStart?: string | null;
  accessEnd?: string | null;
  studentLimit?: number | null;
  progressionMode: CourseProgressionMode;
}

export const DEFAULT_COURSE_SETTINGS: CourseSettings = {
  accessMode: "open",
  prerequisites: [],
  coursePoints: 0,
  accessExpirationEnabled: false,
  accessStart: null,
  accessEnd: null,
  studentLimit: null,
  progressionMode: "linear",
};

export const LMS_COURSE_SETTINGS_META_KEY = "lms_course_settings";
export const LMS_COURSE_ACCESS_MODE_META_KEY = "lms_course_access_mode";
