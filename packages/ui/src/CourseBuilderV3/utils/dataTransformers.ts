import type {
  AvailableLesson,
  AvailableQuiz,
  AvailableTopic,
  CourseLesson,
  CourseQuiz,
  CourseTopic,
  UniversalId,
} from "../store/useUnifiedCourseStore";

// ============================================================================
// CONVEX TYPE DEFINITIONS
// ============================================================================

// Convex database types (as they come from the backend)
export interface ConvexCourse {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  productId?: string;
  isPublished?: boolean;
  courseStructure?: { lessonId: string }[];
}

export interface ConvexLesson {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  courseId?: string;
  order?: number;
  isPublished?: boolean;
  topics?: ConvexTopic[];
}

export interface ConvexTopic {
  _id: string;
  _creationTime: number;
  title: string;
  contentType: "text" | "video" | "quiz";
  content?: string;
  lessonId?: string;
  order?: number;
  isPublished?: boolean;
  quizzes?: ConvexQuiz[];
}

export interface ConvexQuiz {
  _id: string;
  _creationTime: number;
  title: string;
  description?: string;
  questions?: unknown[];
  topicId?: string;
  courseId?: string;
  order?: number;
  isPublished?: boolean;
  isFinal?: boolean;
}

// Full course structure response from getCourseStructure
export interface ConvexCourseStructure extends ConvexCourse {
  lessons: ConvexLesson[];
}

// ============================================================================
// TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Transform Convex course structure to unified format
 * This function handles both courseStructure and courseId attachment methods
 * solving the core issue identified in the analysis
 */
export const transformCourseStructure = (
  convexData: ConvexCourseStructure,
): {
  courseId: UniversalId;
  title: string;
  description?: string;
  lessons: CourseLesson[];
} => {
  if (!convexData) {
    throw new Error("Cannot transform null or undefined course structure");
  }

  // Transform lessons with proper ordering
  const transformedLessons: CourseLesson[] = convexData.lessons.map(
    (lesson, index) => ({
      id: lesson._id,
      title: lesson.title,
      order: lesson.order ?? index, // Use lesson.order if available, fallback to index
      topics: transformTopics(lesson.topics || []),
      createdAt: new Date(lesson._creationTime),
      updatedAt: new Date(lesson._creationTime), // Convex doesn't track updates separately
    }),
  );

  return {
    courseId: convexData._id,
    title: convexData.title,
    description: convexData.description,
    lessons: transformedLessons,
  };
};

/**
 * Transform Convex topics to unified format
 */
export const transformTopics = (convexTopics: ConvexTopic[]): CourseTopic[] => {
  return convexTopics
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) // Sort by order
    .map((topic) => ({
      id: topic._id,
      title: topic.title,
      contentType: topic.contentType,
      order: topic.order ?? 0,
      quizzes: transformQuizzes(topic.quizzes || []),
      createdAt: new Date(topic._creationTime),
      updatedAt: new Date(topic._creationTime),
    }));
};

/**
 * Transform Convex quizzes to unified format
 */
export const transformQuizzes = (convexQuizzes: ConvexQuiz[]): CourseQuiz[] => {
  return convexQuizzes
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) // Sort by order
    .map((quiz) => ({
      id: quiz._id,
      title: quiz.title,
      order: quiz.order ?? 0,
      questions: quiz.questions || [],
      createdAt: new Date(quiz._creationTime),
      updatedAt: new Date(quiz._creationTime),
    }));
};

/**
 * Transform available lessons from Convex to unified format
 */
export const transformAvailableLessons = (
  convexLessons: ConvexLesson[],
): AvailableLesson[] => {
  return convexLessons.map((lesson) => ({
    id: lesson._id,
    title: lesson.title,
    type: "lesson" as const,
    topics: transformTopics(lesson.topics || []),
  }));
};

/**
 * Transform available topics from Convex to unified format
 */
export const transformAvailableTopics = (
  convexTopics: ConvexTopic[],
): AvailableTopic[] => {
  return convexTopics.map((topic) => ({
    id: topic._id,
    title: topic.title,
    type: "topic" as const,
    contentType: topic.contentType,
    quizzes: transformQuizzes(topic.quizzes || []),
  }));
};

/**
 * Transform available quizzes from Convex to unified format
 */
export const transformAvailableQuizzes = (
  convexQuizzes: ConvexQuiz[],
): AvailableQuiz[] => {
  return convexQuizzes.map((quiz) => ({
    id: quiz._id,
    title: quiz.title,
    type: "quiz" as const,
    questions: quiz.questions || [],
  }));
};

// ============================================================================
// REVERSE TRANSFORMATION FUNCTIONS (Unified → Convex)
// ============================================================================

/**
 * Transform unified lesson back to Convex format for mutations
 */
export const transformLessonToConvex = (
  lesson: CourseLesson,
  courseId?: UniversalId,
): Partial<ConvexLesson> => {
  return {
    title: lesson.title,
    order: lesson.order,
    courseId: courseId,
    // Don't include topics here as they're managed separately
  };
};

/**
 * Transform unified topic back to Convex format for mutations
 */
export const transformTopicToConvex = (
  topic: CourseTopic,
  lessonId?: UniversalId,
): Partial<ConvexTopic> => {
  return {
    title: topic.title,
    contentType: topic.contentType,
    order: topic.order,
    lessonId: lessonId,
    // Don't include quizzes here as they're managed separately
  };
};

/**
 * Transform unified quiz back to Convex format for mutations
 */
export const transformQuizToConvex = (
  quiz: CourseQuiz,
  target: { topicId?: UniversalId; courseId?: UniversalId; isFinal?: boolean },
): Partial<ConvexQuiz> => {
  return {
    title: quiz.title,
    questions: quiz.questions,
    order: quiz.order,
    topicId: target.topicId,
    courseId: target.courseId,
    isFinal: target.isFinal,
  };
};

// ============================================================================
// ADVANCED TRANSFORMATION FUNCTIONS
// ============================================================================

/**
 * Enhanced course structure transformation that handles both attachment methods
 * This solves the critical issue where transformCourseData only read courseStructure
 */
export const transformCourseDataEnhanced = (
  convexData: ConvexCourseStructure,
  allLessons: ConvexLesson[],
): {
  courseId: UniversalId;
  title: string;
  description?: string;
  lessons: CourseLesson[];
} => {
  if (!convexData) {
    throw new Error("Cannot transform null or undefined course structure");
  }

  // Method 1: Get lessons from courseStructure (existing method)
  const structuredLessons = convexData.lessons || [];

  // Method 2: Get lessons attached via courseId but not in courseStructure
  const attachedLessons = allLessons.filter(
    (lesson) =>
      lesson.courseId === convexData._id &&
      !structuredLessons.some(
        (structuredLesson) => structuredLesson._id === lesson._id,
      ),
  );

  // Combine both methods
  const allCourseLessons = [...structuredLessons, ...attachedLessons];

  // Sort by order if available, then by creation time
  const sortedLessons = allCourseLessons.sort((a, b) => {
    if (a.order !== undefined && b.order !== undefined) {
      return a.order - b.order;
    }
    if (a.order !== undefined) return -1;
    if (b.order !== undefined) return 1;
    return a._creationTime - b._creationTime;
  });

  // Transform to unified format
  const transformedLessons: CourseLesson[] = sortedLessons.map(
    (lesson, index) => ({
      id: lesson._id,
      title: lesson.title,
      order: lesson.order ?? index,
      topics: transformTopics(lesson.topics || []),
      createdAt: new Date(lesson._creationTime),
      updatedAt: new Date(lesson._creationTime),
    }),
  );

  return {
    courseId: convexData._id,
    title: convexData.title,
    description: convexData.description,
    lessons: transformedLessons,
  };
};

/**
 * Transform course structure back to Convex courseStructure format
 * This ensures saves work correctly with the unified state
 */
export const transformToConvexCourseStructure = (
  lessons: CourseLesson[],
): { lessonId: string }[] => {
  return lessons
    .sort((a, b) => a.order - b.order)
    .map((lesson) => ({
      lessonId: lesson.id,
    }));
};

// ============================================================================
// VALIDATION AND ERROR HANDLING
// ============================================================================

/**
 * Validate that a Convex course structure is properly formed
 */
export const validateConvexCourseStructure = (
  data: unknown,
): data is ConvexCourseStructure => {
  if (!data || typeof data !== "object") return false;

  const course = data as ConvexCourseStructure;

  return (
    typeof course._id === "string" &&
    typeof course.title === "string" &&
    Array.isArray(course.lessons)
  );
};

/**
 * Safe transformation that handles errors gracefully
 */
export const safeTransformCourseStructure = (
  convexData: unknown,
): {
  courseId: UniversalId;
  title: string;
  description?: string;
  lessons: CourseLesson[];
} | null => {
  try {
    if (!validateConvexCourseStructure(convexData)) {
      console.error("Invalid Convex course structure:", convexData);
      return null;
    }

    return transformCourseStructure(convexData);
  } catch (error) {
    console.error("Error transforming course structure:", error);
    return null;
  }
};

// ============================================================================
// DEVELOPMENT UTILITIES
// ============================================================================

if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  // Expose transformers to window for debugging
  (window as any).courseDataTransformers = {
    transformCourseStructure,
    transformCourseDataEnhanced,
    transformToConvexCourseStructure,
    validateConvexCourseStructure,
    safeTransformCourseStructure,
  };
}
