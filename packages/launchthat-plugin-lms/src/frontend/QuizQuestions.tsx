"use client";

import type { PluginFrontendSingleSlotProps } from "launchthat-plugin-core";
import { useEffect, useState } from "react";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";

import type { CarouselApi } from "@acme/ui/carousel";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@acme/ui/card";
import { Carousel, CarouselContent, CarouselItem } from "@acme/ui/carousel";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { Id } from "../lib/convexId";
import type { QuizAttemptSummary, QuizQuestion } from "../types";
import { useLmsCourseContext } from "../providers/LmsCourseProvider";

const QUESTION_TYPE_LABELS: Record<string, string> = {
  singleChoice: "Single choice",
  multipleChoice: "Multiple choice",
  shortText: "Short answer",
  longText: "Essay",
};

type AnswerPayload = {
  selectedOptionIds?: string[];
  answerText?: string;
};

const formatPercent = (value: number) =>
  `${value.toFixed(1).replace(/\.0$/, "")}%`;

const formatDuration = (durationMs?: number) => {
  if (!durationMs) return null;
  const totalSeconds = Math.max(1, Math.round(durationMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes <= 0) {
    return `${seconds}s`;
  }
  return `${minutes}m ${seconds.toString().padStart(2, "0")}s`;
};

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

type QuizQuestionsProps = Partial<PluginFrontendSingleSlotProps>;

export function QuizQuestions(props: QuizQuestionsProps = {}) {
  const courseContext = useLmsCourseContext();
  const quizIdFromProps =
    props &&
    props.post &&
    typeof (props.post as { _id?: unknown })._id === "string"
      ? ((props.post as { _id: string })._id as Id<"posts">)
      : undefined;
  const organizationIdFromProps =
    props &&
    typeof props.organizationId === "string" &&
    props.organizationId.length > 0
      ? (props.organizationId as Id<"organizations">)
      : undefined;
  const quizId = quizIdFromProps ?? courseContext?.quizId;
  const organizationId =
    organizationIdFromProps ?? courseContext?.organizationId;

  const quizData = useQuery(
    api.plugins.lms.queries.getQuizBuilderState,
    quizId
      ? ({ quizId, organizationId } as {
          quizId: Id<"posts">;
          organizationId?: Id<"organizations">;
        })
      : "skip",
  );
  const attemptsData = useQuery(
    api.plugins.lms.queries.getQuizAttemptsForViewer,
    quizId ? { quizId } : "skip",
  );
  const submitQuizAttempt = useMutation(
    api.plugins.lms.mutations.submitQuizAttempt,
  );

  const [mode, setMode] = useState<"idle" | "inProgress" | "summary">("idle");
  const [answerMap, setAnswerMap] = useState<Record<string, AnswerPayload>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [carouselApi, setCarouselApi] = useState<CarouselApi | null>(null);
  const [attemptSummary, setAttemptSummary] =
    useState<QuizAttemptSummary | null>(null);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttemptSummary[]>(
    [],
  );
  const [attemptStartedAt, setAttemptStartedAt] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (Array.isArray(attemptsData)) {
      setAttemptHistory(attemptsData);
      if (mode === "idle") {
        setAttemptSummary(attemptsData[0] ?? null);
      }
    }
  }, [attemptsData, mode]);

  useEffect(() => {
    if (!carouselApi) return;
    const handleSelect = () => {
      setCurrentIndex(carouselApi.selectedScrollSnap());
    };
    handleSelect();
    carouselApi.on("select", handleSelect);
    return () => {
      carouselApi.off("select", handleSelect);
    };
  }, [carouselApi]);

  useEffect(() => {
    if (mode === "inProgress" && carouselApi) {
      carouselApi.scrollTo(0);
    }
  }, [carouselApi, mode]);

  if (!quizId) {
    return null;
  }

  if (quizData === undefined) {
    return <QuizQuestionsSkeleton />;
  }

  const questions = (quizData?.questions ?? []) as QuizQuestion[];

  const isQuestionAnswered = (question: QuizQuestion) => {
    const answer = answerMap[question._id];
    if (!answer) return false;
    if (question.questionType === "singleChoice") {
      return (answer.selectedOptionIds ?? []).length === 1;
    }
    if (question.questionType === "multipleChoice") {
      return (answer.selectedOptionIds ?? []).length > 0;
    }
    return (answer.answerText ?? "").trim().length > 0;
  };

  const allQuestionsAnswered = questions.every(isQuestionAnswered);
  const currentQuestion = questions[currentIndex];
  const isCurrentAnswered = currentQuestion
    ? isQuestionAnswered(currentQuestion)
    : false;

  const handleAnswerChange = (
    questionId: Id<"posts">,
    payload: AnswerPayload,
  ) => {
    setAnswerMap((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        ...payload,
      },
    }));
  };

  const handleStartQuiz = () => {
    if (!questions.length) return;
    setMode("inProgress");
    setAnswerMap({});
    setCurrentIndex(0);
    setAttemptStartedAt(Date.now());
    setAttemptSummary(null);
  };

  const handleRetakeQuiz = () => {
    setMode("inProgress");
    setAnswerMap({});
    setCurrentIndex(0);
    setAttemptStartedAt(Date.now());
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      carouselApi?.scrollTo(currentIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      carouselApi?.scrollTo(currentIndex - 1);
    }
  };

  const handleSubmit = async () => {
    if (!allQuestionsAnswered || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      const responses = questions.map((question) => {
        const answer = answerMap[question._id];
        return {
          questionId: question._id,
          questionType: question.questionType,
          selectedOptionIds: answer?.selectedOptionIds,
          answerText: answer?.answerText,
        };
      });

      const result = await submitQuizAttempt({
        quizId,
        courseId: courseContext?.courseId,
        lessonId: courseContext?.lessonId,
        durationMs: attemptStartedAt
          ? Date.now() - attemptStartedAt
          : undefined,
        responses,
      });

      if (result?.attempt) {
        setAttemptSummary(result.attempt);
        setAttemptHistory((prev) =>
          [
            result.attempt,
            ...prev.filter((attempt) => attempt._id !== result.attempt._id),
          ].slice(0, 10),
        );
      }
      setMode("summary");
      toast.success("Quiz submitted");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to submit quiz";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const questionCountLabel =
    questions.length === 1 ? "1 question" : `${questions.length} questions`;

  if (questions.length === 0) {
    return (
      <div className="mt-10">
        <Alert>
          <AlertTitle>No questions available</AlertTitle>
          <AlertDescription>
            This quiz does not have any published questions yet.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="mt-10 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">
            Interactive quiz
          </h2>
          <p className="text-muted-foreground text-sm">
            Answer each question to advance. You must complete the quiz before
            starting a new attempt.
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {questionCountLabel}
        </Badge>
      </div>

      {mode === "inProgress" && currentQuestion ? (
        <Card>
          <CardHeader className="space-y-1">
            <div className="text-muted-foreground flex items-center justify-between text-sm">
              <span>
                Question {currentIndex + 1} of {questions.length}
              </span>
              {attemptStartedAt && (
                <span>
                  Started{" "}
                  {dateFormatter.format(attemptStartedAt).replace(",", "")}
                </span>
              )}
            </div>
            <CardTitle className="text-lg font-semibold">
              {quizData?.quiz?.title ?? "Quiz"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <Carousel
              className="w-full"
              opts={{ watchDrag: false }}
              setApi={setCarouselApi}
            >
              <CarouselContent>
                {questions.map((question) => (
                  <CarouselItem key={question._id}>
                    <QuestionSlide
                      question={question}
                      answer={answerMap[question._id]}
                      onAnswerChange={handleAnswerChange}
                    />
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>

            <div className="flex flex-wrap justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={handlePrevious}
                disabled={currentIndex === 0}
              >
                Previous
              </Button>
              {currentIndex < questions.length - 1 ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  disabled={!isCurrentAnswered}
                >
                  Next question
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!allQuestionsAnswered || isSubmitting}
                >
                  {isSubmitting ? "Submitting…" : "Submit quiz"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ) : mode === "summary" && attemptSummary ? (
        <AttemptSummaryCard
          summary={attemptSummary}
          onRetake={handleRetakeQuiz}
        />
      ) : (
        <QuizIntro
          onStart={handleStartQuiz}
          questionCount={questions.length}
          lastAttempt={attemptSummary ?? attemptHistory[0]}
        />
      )}

      <AttemptHistoryList
        attempts={attemptHistory}
        isLoading={attemptsData === undefined}
      />
    </div>
  );
}

const QuizQuestionsSkeleton = () => (
  <div className="mt-10 space-y-4">
    <Skeleton className="h-8 w-64" />
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-full" />
      </CardHeader>
      <CardContent className="space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-2/5" />
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  </div>
);

interface QuestionSlideProps {
  question: QuizQuestion;
  answer?: AnswerPayload;
  onAnswerChange: (questionId: Id<"posts">, payload: AnswerPayload) => void;
}

const QuestionSlide = ({
  question,
  answer,
  onAnswerChange,
}: QuestionSlideProps) => {
  const toggleMultipleOption = (optionId: string) => {
    const selections = new Set(answer?.selectedOptionIds ?? []);
    if (selections.has(optionId)) {
      selections.delete(optionId);
    } else {
      selections.add(optionId);
    }
    onAnswerChange(question._id, { selectedOptionIds: [...selections] });
  };

  const selectSingleOption = (optionId: string) => {
    onAnswerChange(question._id, { selectedOptionIds: [optionId] });
  };

  const handleTextChange = (value: string) => {
    onAnswerChange(question._id, { answerText: value });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <CardTitle className="text-base font-semibold">
          {question.prompt}
        </CardTitle>
        <Badge variant="secondary">
          {QUESTION_TYPE_LABELS[question.questionType] ?? question.questionType}
        </Badge>
      </div>

      {question.questionType === "singleChoice" && (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label
              key={option.id}
              className="bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <input
                type="radio"
                name={`single-${question._id}`}
                checked={!!answer?.selectedOptionIds?.includes(option.id)}
                onChange={() => selectSingleOption(option.id)}
                className="text-primary focus:ring-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {question.questionType === "multipleChoice" && (
        <div className="space-y-2">
          {question.options?.map((option) => (
            <label
              key={option.id}
              className="bg-muted/40 flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm"
            >
              <input
                type="checkbox"
                checked={!!answer?.selectedOptionIds?.includes(option.id)}
                onChange={() => toggleMultipleOption(option.id)}
                className="text-primary focus:ring-primary"
              />
              <span>{option.label}</span>
            </label>
          ))}
        </div>
      )}

      {(question.questionType === "shortText" ||
        question.questionType === "longText") && (
        <Textarea
          placeholder="Type your response here..."
          className="text-sm"
          rows={question.questionType === "longText" ? 6 : 3}
          value={answer?.answerText ?? ""}
          onChange={(event) => handleTextChange(event.target.value)}
        />
      )}
    </div>
  );
};

const AttemptSummaryCard = ({
  summary,
  onRetake,
}: {
  summary: QuizAttemptSummary;
  onRetake: () => void;
}) => {
  const durationLabel = formatDuration(summary.durationMs);
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-semibold">Quiz summary</CardTitle>
        <p className="text-muted-foreground text-sm">
          Completed {dateFormatter.format(summary.completedAt)}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-6">
          <div>
            <p className="text-muted-foreground text-sm">Score</p>
            <p className="text-3xl font-semibold">
              {formatPercent(summary.scorePercent)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-sm">Auto-graded</p>
            <p className="text-lg font-semibold">
              {summary.correctCount}/{summary.gradedQuestions} correct
            </p>
          </div>
          {durationLabel && (
            <div>
              <p className="text-muted-foreground text-sm">Duration</p>
              <p className="text-lg font-semibold">{durationLabel}</p>
            </div>
          )}
        </div>
        <Alert>
          <AlertTitle>Manual review</AlertTitle>
          <AlertDescription>
            Short or essay answers aren’t part of the auto-graded score. Share
            them with your mentor for feedback.
          </AlertDescription>
        </Alert>
        <div className="flex flex-wrap gap-3">
          <Button type="button" onClick={onRetake}>
            Start a new attempt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const AttemptHistoryList = ({
  attempts,
  isLoading,
}: {
  attempts: QuizAttemptSummary[];
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Previous attempts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </CardContent>
      </Card>
    );
  }

  if (!attempts.length) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">
          Previous attempts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {attempts.map((attempt, index) => (
          <div
            key={attempt._id}
            className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3"
          >
            <div>
              <p className="font-medium">Attempt {index + 1}</p>
              <p className="text-muted-foreground text-sm">
                {dateFormatter.format(attempt.completedAt)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg font-semibold">
                {formatPercent(attempt.scorePercent)}
              </p>
              <p className="text-muted-foreground text-xs">
                {attempt.correctCount}/{attempt.gradedQuestions} graded correct
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

const QuizIntro = ({
  onStart,
  questionCount,
  lastAttempt,
}: {
  onStart: () => void;
  questionCount: number;
  lastAttempt?: QuizAttemptSummary;
}) => (
  <Card>
    <CardHeader>
      <CardTitle className="text-xl font-semibold">Ready to begin?</CardTitle>
      <p className="text-muted-foreground text-sm">
        You’ll work through {questionCount} question
        {questionCount === 1 ? "" : "s"} in order. Answers can be reviewed once
        the quiz is submitted.
      </p>
    </CardHeader>
    <CardContent className="space-y-4">
      {lastAttempt && (
        <Alert>
          <AlertTitle>Latest score</AlertTitle>
          <AlertDescription>
            {formatPercent(lastAttempt.scorePercent)} — completed{" "}
            {dateFormatter.format(lastAttempt.completedAt)}
          </AlertDescription>
        </Alert>
      )}
      <Button type="button" onClick={onStart}>
        Start quiz
      </Button>
    </CardContent>
  </Card>
);
