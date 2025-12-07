"use client";

import type { ReactNode } from "react";
import { registerFrontendFilter } from "launchthat-plugin-core/frontendFilters";

import { QuizQuestions } from "../frontend/QuizQuestions";
import { useLmsCourseContext } from "../providers/LmsCourseProvider";
import { LinearProgressContentGate } from "./LinearProgressContentGate";

const LINEAR_PROGRESS_FILTER_ID = "lms-linear-progress-content-guard";
const QUIZ_CONTENT_FILTER_ID = "lms-quiz-content-injector";

const QuizContentInjector = ({ children }: { children: ReactNode }) => {
  const courseContext = useLmsCourseContext();
  if (!courseContext || courseContext.postTypeSlug !== "quizzes") {
    return <>{children}</>;
  }
  return (
    <>
      {children}
      <QuizQuestions />
    </>
  );
};

registerFrontendFilter({
  id: LINEAR_PROGRESS_FILTER_ID,
  location: "content",
  handler: (children: ReactNode) => (
    <LinearProgressContentGate>{children}</LinearProgressContentGate>
  ),
});

registerFrontendFilter({
  id: QUIZ_CONTENT_FILTER_ID,
  location: "content",
  handler: (children: ReactNode) => (
    <QuizContentInjector>{children}</QuizContentInjector>
  ),
});
