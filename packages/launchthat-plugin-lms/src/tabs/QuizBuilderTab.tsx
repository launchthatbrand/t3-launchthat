"use client";

import type { PluginSingleViewComponentProps } from "launchthat-plugin-core";
import { useEffect, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { api } from "@portal/convexspec";
import { useMutation, useQuery } from "convex/react";
import { AlertTriangle, Pencil, Plus, Trash2 } from "lucide-react";

import { BuilderDndProvider, SortableList } from "@acme/dnd";
import { Alert, AlertDescription, AlertTitle } from "@acme/ui/alert";
import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@acme/ui/card";
import { Checkbox } from "@acme/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@acme/ui/dialog";
import { Input } from "@acme/ui/input";
import { Label } from "@acme/ui/label";
import { RadioGroup, RadioGroupItem } from "@acme/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@acme/ui/select";
import { Separator } from "@acme/ui/separator";
import { Skeleton } from "@acme/ui/skeleton";
import { Textarea } from "@acme/ui/textarea";
import { toast } from "@acme/ui/toast";

import type { Id } from "../lib/convexId";
import type { LmsPostId } from "../types";
import type {
  QuizQuestion,
  QuizQuestionInput,
  QuizQuestionOption,
  QuizQuestionType,
} from "../types";
import {
  DEFAULT_QUIZ_QUESTION_TYPE,
  questionTypeSupportsAnswerText,
  questionTypeSupportsOptions,
  QUIZ_QUESTION_TYPES,
} from "../types";

export const QuizBuilderTab = ({
  postId,
  organizationId,
}: PluginSingleViewComponentProps) => {
  const normalizedOrganizationId = organizationId
    ? (organizationId as unknown as Id<"organizations">)
    : undefined;

  if (!postId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Save required</CardTitle>
          <CardDescription>
            Save this quiz entry first, then reopen the Builder tab to add
            questions.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <QuizBuilderScreen
      quizId={postId as LmsPostId}
      organizationId={normalizedOrganizationId}
    />
  );
};

interface QuizBuilderScreenProps {
  quizId: LmsPostId;
  organizationId?: Id<"organizations">;
}

interface QuestionFormState {
  prompt: string;
  questionType: QuizQuestionType;
  options: QuizQuestionOption[];
  correctOptionIds: string[];
  answerText: string;
  questionId?: LmsPostId;
}

const QUESTION_TYPE_LABELS: Record<QuizQuestionType, string> = {
  singleChoice: "Single choice",
  multipleChoice: "Multiple choice",
  shortText: "Short text",
  longText: "Long text",
};

const createOptionId = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `opt_${Math.random().toString(36).slice(-6)}`;

const createBlankOption = (): QuizQuestionOption => ({
  id: createOptionId(),
  label: "",
});

const buildDefaultFormState = (): QuestionFormState => ({
  prompt: "",
  questionType: DEFAULT_QUIZ_QUESTION_TYPE,
  options: [createBlankOption(), createBlankOption()],
  correctOptionIds: [],
  answerText: "",
});

const mapQuestionToFormState = (question: QuizQuestion): QuestionFormState => ({
  prompt: question.prompt,
  questionType: question.questionType,
  options:
    questionTypeSupportsOptions(question.questionType) &&
    question.options.length > 0
      ? question.options
      : [createBlankOption(), createBlankOption()],
  correctOptionIds: question.correctOptionIds,
  answerText: question.answerText ?? "",
  questionId: question._id,
});

const QuizBuilderScreen = ({
  quizId,
  organizationId,
}: QuizBuilderScreenProps) => {
  const queryArgs = useMemo(
    () => (organizationId ? { quizId, organizationId } : { quizId }),
    [quizId, organizationId],
  );

  const quizState = useQuery(
    api.plugins.lms.queries.getQuizBuilderState,
    queryArgs,
  );
  const createQuestion = useMutation(
    api.plugins.lms.mutations.createQuizQuestion,
  );
  const updateQuestion = useMutation(
    api.plugins.lms.mutations.updateQuizQuestion,
  );
  const deleteQuestion = useMutation(
    api.plugins.lms.mutations.deleteQuizQuestion,
  );
  const reorderQuestions = useMutation(
    api.plugins.lms.mutations.reorderQuizQuestions,
  );

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formState, setFormState] = useState<QuestionFormState>(
    buildDefaultFormState,
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<LmsPostId | null>(
    null,
  );

  useEffect(() => {
    if (quizState?.questions) {
      setQuestions(quizState.questions);
    }
  }, [quizState?.questions]);

  const quizTitle = quizState?.quiz.title ?? "Quiz";
  const isLoading = !quizState;

  const handleDialogClose = (nextOpen: boolean) => {
    if (!nextOpen && isSaving) {
      return;
    }
    setIsDialogOpen(nextOpen);
  };

  const handleOpenCreate = () => {
    setFormState(buildDefaultFormState());
    setIsDialogOpen(true);
  };

  const handleEditQuestion = (question: QuizQuestion) => {
    setFormState(mapQuestionToFormState(question));
    setIsDialogOpen(true);
  };

  const handleQuestionTypeChange = (nextType: QuizQuestionType) => {
    setFormState((prev) => {
      const baseOptions =
        questionTypeSupportsOptions(nextType) && prev.options.length > 0
          ? prev.options
          : [createBlankOption(), createBlankOption()];
      return {
        ...prev,
        questionType: nextType,
        options: questionTypeSupportsOptions(nextType) ? baseOptions : [],
        correctOptionIds: questionTypeSupportsOptions(nextType)
          ? prev.correctOptionIds.slice(
              0,
              nextType === "singleChoice" ? 1 : prev.correctOptionIds.length,
            )
          : [],
        answerText: questionTypeSupportsAnswerText(nextType)
          ? prev.answerText
          : "",
      };
    });
  };

  const handleOptionLabelChange = (optionId: string, value: string) => {
    setFormState((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, label: value } : option,
      ),
    }));
  };

  const handleAddOption = () => {
    setFormState((prev) => ({
      ...prev,
      options: [...prev.options, createBlankOption()],
    }));
  };

  const handleRemoveOption = (optionId: string) => {
    setFormState((prev) => {
      if (prev.options.length <= 2) {
        toast.error("A multiple-choice question needs at least two options.");
        return prev;
      }
      const filteredOptions = prev.options.filter(
        (option) => option.id !== optionId,
      );
      const filteredCorrect = prev.correctOptionIds.filter(
        (id) => id !== optionId,
      );
      return {
        ...prev,
        options: filteredOptions,
        correctOptionIds: filteredCorrect,
      };
    });
  };

  const handleSingleChoiceSelect = (value: string) => {
    setFormState((prev) => ({
      ...prev,
      correctOptionIds: value ? [value] : [],
    }));
  };

  const handleMultipleChoiceToggle = (optionId: string, checked: boolean) => {
    setFormState((prev) => {
      const existing = new Set(prev.correctOptionIds);
      if (checked) {
        existing.add(optionId);
      } else {
        existing.delete(optionId);
      }
      return {
        ...prev,
        correctOptionIds: Array.from(existing),
      };
    });
  };

  const resetDialog = () => {
    setFormState(buildDefaultFormState());
    setIsDialogOpen(false);
  };

  const buildPayload = (): QuizQuestionInput | null => {
    const trimmedPrompt = formState.prompt.trim();
    if (!trimmedPrompt) {
      toast.error("Question prompt is required.");
      return null;
    }

    const payload: QuizQuestionInput = {
      prompt: trimmedPrompt,
      questionType: formState.questionType,
    };

    if (questionTypeSupportsOptions(formState.questionType)) {
      const normalizedOptions = formState.options.map((option) => ({
        id: option.id,
        label: option.label.trim(),
      }));
      if (normalizedOptions.length < 2) {
        toast.error("Add at least two answer options.");
        return null;
      }
      if (normalizedOptions.some((option) => option.label.length === 0)) {
        toast.error("All answer options need a label.");
        return null;
      }
      const normalizedCorrect = formState.correctOptionIds.filter((id) =>
        normalizedOptions.some((option) => option.id === id),
      );
      if (normalizedCorrect.length === 0) {
        toast.error("Mark at least one correct answer.");
        return null;
      }
      payload.options = normalizedOptions;
      payload.correctOptionIds = normalizedCorrect;
    }

    if (questionTypeSupportsAnswerText(formState.questionType)) {
      if (!formState.answerText.trim()) {
        toast.error("Provide the expected answer text.");
        return null;
      }
      payload.answerText = formState.answerText.trim();
    }

    return payload;
  };

  const handleSaveQuestion = async () => {
    const payload = buildPayload();
    if (!payload) {
      return;
    }
    setIsSaving(true);
    try {
      if (formState.questionId) {
        await updateQuestion({
          quizId,
          questionId: formState.questionId,
          question: payload,
        });
        toast.success("Question updated");
      } else {
        await createQuestion({
          quizId,
          organizationId,
          question: payload,
        });
        toast.success("Question added");
      }
      resetDialog();
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Please try again.";
      toast.error("Unable to save question", { description });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteQuestion = async (question: QuizQuestion) => {
    const confirmed = window.confirm(
      "Delete this question? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }
    setPendingDeleteId(question._id);
    try {
      await deleteQuestion({ quizId, questionId: question._id });
      toast.success("Question deleted");
    } catch (error) {
      const description =
        error instanceof Error ? error.message : "Please try again.";
      toast.error("Unable to delete question", { description });
    } finally {
      setPendingDeleteId(null);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    const oldIndex = questions.findIndex(
      (question) => question._id === active.id,
    );
    const newIndex = questions.findIndex(
      (question) => question._id === over.id,
    );
    if (oldIndex === -1 || newIndex === -1) {
      return;
    }
    const reordered = arrayMove(questions, oldIndex, newIndex);
    setQuestions(reordered);
    setIsReordering(true);
    reorderQuestions({
      quizId,
      orderedQuestionIds: reordered.map((question) => question._id),
    })
      .then(() => {
        toast.success("Question order updated");
      })
      .catch((error) => {
        const description =
          error instanceof Error ? error.message : "Please try again.";
        toast.error("Unable to reorder questions", { description });
        setQuestions(questions);
      })
      .finally(() => {
        setIsReordering(false);
      });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Quiz Builder</CardTitle>
          <CardDescription>Loading quiz details…</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-6 w-40" />
          <Skeleton className="mt-4 h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{quizTitle}</CardTitle>
          <CardDescription>
            Drag and drop to reorder questions. Use the builder to manage
            prompts, answer options, and correct responses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <p className="text-sm font-medium">
                {questions.length} questions
              </p>
              <p className="text-muted-foreground text-xs">
                Learners will encounter questions in this order.
              </p>
            </div>
            <Button onClick={handleOpenCreate}>
              <Plus className="mr-2 h-4 w-4" />
              Add question
            </Button>
          </div>
          {questions.length === 0 ? (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>No questions yet</AlertTitle>
              <AlertDescription>
                Build your first question to start evaluating learners.
              </AlertDescription>
            </Alert>
          ) : (
            <BuilderDndProvider onDragEnd={handleDragEnd}>
              <SortableList<QuizQuestion>
                items={questions}
                getId={(question) => question._id}
                itemClassName="mb-2 w-full"
                renderItem={(question) => (
                  <div className="bg-card flex w-full items-center gap-3 rounded-md border p-3 shadow-sm">
                    <div className="flex flex-1 flex-col">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {QUESTION_TYPE_LABELS[question.questionType]}
                        </Badge>
                        <p className="font-medium">{question.prompt}</p>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {questionTypeSupportsOptions(question.questionType)
                          ? `${question.options.length} answer option${
                              question.options.length === 1 ? "" : "s"
                            }`
                          : "Text response"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuestion(question)}
                        aria-label="Edit question"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuestion(question)}
                        aria-label="Delete question"
                        disabled={pendingDeleteId === question._id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
              />
            </BuilderDndProvider>
          )}
          {isReordering && (
            <p className="text-muted-foreground text-xs">Saving new order…</p>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogClose}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {formState.questionId ? "Edit question" : "New question"}
            </DialogTitle>
            <DialogDescription>
              Configure the prompt, answer type, and correct response.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="question-prompt">Question prompt</Label>
              <Textarea
                id="question-prompt"
                rows={3}
                value={formState.prompt}
                onChange={(event) =>
                  setFormState((prev) => ({
                    ...prev,
                    prompt: event.target.value,
                  }))
                }
                placeholder="Enter the quiz question prompt"
              />
            </div>

            <div className="space-y-2">
              <Label>Question type</Label>
              <Select
                value={formState.questionType}
                onValueChange={(value) =>
                  handleQuestionTypeChange(value as QuizQuestionType)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {QUIZ_QUESTION_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {QUESTION_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {questionTypeSupportsOptions(formState.questionType) && (
              <div className="space-y-3 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Answer options</p>
                    <p className="text-muted-foreground text-xs">
                      Provide at least two options and mark the correct ones.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleAddOption}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add option
                  </Button>
                </div>
                <Separator />
                <div className="space-y-2">
                  {formState.questionType === "singleChoice" ? (
                    <RadioGroup
                      value={formState.correctOptionIds[0] ?? ""}
                      onValueChange={handleSingleChoiceSelect}
                    >
                      {formState.options.map((option, index) => (
                        <div
                          key={option.id}
                          className="flex items-center gap-3 rounded-md border p-2"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={`correct-${option.id}`}
                          />
                          <Label
                            htmlFor={`correct-${option.id}`}
                            className="sr-only"
                          >
                            Mark option {index + 1} as correct
                          </Label>
                          <Input
                            value={option.label}
                            onChange={(event) =>
                              handleOptionLabelChange(
                                option.id,
                                event.target.value,
                              )
                            }
                            placeholder={`Option ${index + 1}`}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove option"
                            disabled={formState.options.length <= 2}
                            onClick={() => handleRemoveOption(option.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </RadioGroup>
                  ) : (
                    formState.options.map((option, index) => (
                      <div
                        key={option.id}
                        className="flex items-center gap-3 rounded-md border p-2"
                      >
                        <Checkbox
                          checked={formState.correctOptionIds.includes(
                            option.id,
                          )}
                          onCheckedChange={(checked) =>
                            handleMultipleChoiceToggle(
                              option.id,
                              Boolean(checked),
                            )
                          }
                          id={`correct-${option.id}`}
                        />
                        <Label
                          htmlFor={`correct-${option.id}`}
                          className="sr-only"
                        >
                          Toggle option {index + 1} correctness
                        </Label>
                        <Input
                          value={option.label}
                          onChange={(event) =>
                            handleOptionLabelChange(
                              option.id,
                              event.target.value,
                            )
                          }
                          placeholder={`Option ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          aria-label="Remove option"
                          disabled={formState.options.length <= 2}
                          onClick={() => handleRemoveOption(option.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {questionTypeSupportsAnswerText(formState.questionType) && (
              <div className="space-y-2">
                <Label htmlFor="answer-text">Expected answer</Label>
                {formState.questionType === "longText" ? (
                  <Textarea
                    id="answer-text"
                    rows={3}
                    value={formState.answerText}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        answerText: event.target.value,
                      }))
                    }
                    placeholder="Provide a model answer"
                  />
                ) : (
                  <Input
                    id="answer-text"
                    value={formState.answerText}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        answerText: event.target.value,
                      }))
                    }
                    placeholder="Provide the correct answer"
                  />
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleDialogClose(false)}
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion} disabled={isSaving}>
              {isSaving ? "Saving…" : "Save question"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export { QuizBuilderScreen };
