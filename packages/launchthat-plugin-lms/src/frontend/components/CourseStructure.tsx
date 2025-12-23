"use client";

import Link from "next/link";
import { useMemo } from "react";

import { Badge } from "@acme/ui/badge";
import { Button } from "@acme/ui/button";
import { Card, CardContent } from "@acme/ui/card";
import { EntityList } from "@acme/ui/entity-list/EntityList";
import type { ColumnDefinition } from "@acme/ui/entity-list/types";
import { Separator } from "@acme/ui/separator";

import type {
  LmsBuilderLesson,
  LmsBuilderQuiz,
  LmsBuilderTopic,
} from "../../types";

export interface StructuredLessonEntry {
  lesson: LmsBuilderLesson;
  topics: LmsBuilderTopic[];
  quizzes: LmsBuilderQuiz[];
}

interface CourseStructureProps {
  lessons: StructuredLessonEntry[];
  baseCoursePath: string;
  standaloneQuizzes?: LmsBuilderQuiz[];
}

const LESSON_LEVEL_QUIZ_KEY = "__lesson__";

type LessonListItem = {
  id: string;
  title: string;
  excerpt?: string;
  path: string;
  imageUrl?: string;
  topicsCount: number;
  quizzesCount: number;
  topics: Array<Pick<LmsBuilderTopic, "_id" | "title" | "slug">>;
  quizzes: Array<Pick<LmsBuilderQuiz, "_id" | "title" | "slug" | "topicId">>;
};

export function CourseStructure({
  lessons,
  baseCoursePath,
  standaloneQuizzes = [],
}: CourseStructureProps) {
  if (lessons.length === 0 && standaloneQuizzes.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-muted-foreground">
          This course does not have any lessons yet.
        </CardContent>
      </Card>
    );
  }

  const lessonItems = useMemo<LessonListItem[]>(() => {
    return lessons.map(({ lesson, topics, quizzes }) => ({
      id: String(lesson._id),
      title: lesson.title,
      excerpt: lesson.excerpt ?? undefined,
      path: `${baseCoursePath}/lesson/${lesson.slug ?? lesson._id}`,
      imageUrl:
        typeof (lesson as unknown as { firstAttachmentUrl?: unknown })
          .firstAttachmentUrl === "string"
          ? ((lesson as unknown as { firstAttachmentUrl?: string })
              .firstAttachmentUrl as string)
          : undefined,
      topicsCount: topics.length,
      quizzesCount: quizzes.length,
      topics: topics.map((topic) => ({
        _id: topic._id,
        title: topic.title,
        slug: topic.slug ?? undefined,
      })),
      quizzes: quizzes.map((quiz) => ({
        _id: quiz._id,
        title: quiz.title,
        slug: quiz.slug ?? undefined,
        topicId: quiz.topicId ?? undefined,
      })),
    }));
  }, [baseCoursePath, lessons]);

  const lessonColumns = useMemo<ColumnDefinition<LessonListItem>[]>(() => {
    return [
      {
        id: "title",
        header: "Lesson",
        accessorKey: "title",
        sortable: true,
        cell: (item: LessonListItem) => (
          <div className="space-y-1">
            <p className="font-medium">{item.title}</p>
            {item.excerpt ? (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {item.excerpt}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        id: "topicsCount",
        header: "Topics",
        accessorKey: "topicsCount",
        sortable: true,
        cell: (item: LessonListItem) => (
          <Badge variant="outline" className="text-xs">
            {item.topicsCount}
          </Badge>
        ),
      },
      {
        id: "quizzesCount",
        header: "Quizzes",
        accessorKey: "quizzesCount",
        sortable: true,
        cell: (item: LessonListItem) => (
          <Badge variant="outline" className="text-xs">
            {item.quizzesCount}
          </Badge>
        ),
      },
      {
        id: "actions",
        header: "",
        cell: (item: LessonListItem) => (
          <div className="flex justify-end">
            <Button size="sm" variant="outline" asChild>
              <Link href={item.path}>View lesson</Link>
            </Button>
          </div>
        ),
      },
    ];
  }, []);

  return (
    <div className="space-y-6">
      {lessons.length > 0 ? (
        <EntityList<LessonListItem>
          data={lessonItems}
          columns={lessonColumns}
          isLoading={false}
          enableSearch
          viewModes={["grid", "custom"]}
          defaultViewMode="grid"
          customViewLabel="Lesson flow"
          gridColumns={{ sm: 1, md: 2, lg: 2, xl: 3 }}
          itemRender={(item) => (
            <Card className="rounded-3xl">
              <CardContent className="space-y-4 p-5">
                {item.imageUrl ? (
                  <div className="bg-muted relative overflow-hidden rounded-2xl">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="h-40 w-full object-cover"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                ) : null}
                <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Lesson
                  </p>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  {item.excerpt ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {item.excerpt}
                    </p>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Badge variant="outline">{item.topicsCount} topics</Badge>
                  <Badge variant="outline">{item.quizzesCount} quizzes</Badge>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <Button size="sm" asChild>
                    <Link href={item.path}>View lesson</Link>
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    {item.topicsCount} topics · {item.quizzesCount} quizzes
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
          customViewRender={(items) => (
            <div className="space-y-4">
              {items.map((item) => {
                const quizzesByTopic = groupQuizzesByTopic(item.quizzes);
            const lessonLevelQuizzes =
              quizzesByTopic.get(LESSON_LEVEL_QUIZ_KEY) ?? [];

            return (
                  <Card key={item.id} className="rounded-3xl">
                    <CardContent className="space-y-4 p-5">
                      {item.imageUrl ? (
                        <div className="bg-muted relative overflow-hidden rounded-2xl">
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="h-44 w-full object-cover"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      ) : null}
                      <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Lesson
                    </p>
                          <h3 className="text-lg font-semibold">{item.title}</h3>
                          {item.excerpt ? (
                            <p className="line-clamp-3 text-sm text-muted-foreground">
                              {item.excerpt}
                      </p>
                          ) : null}
                  </div>
                        <Button size="sm" asChild>
                          <Link href={item.path}>View lesson</Link>
                        </Button>
                  </div>

                      <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-muted-foreground">
                        <Badge variant="outline">{item.topicsCount} topics</Badge>
                        <Badge variant="outline">
                          {item.quizzesCount} quizzes
                        </Badge>
                      </div>

                      <div className="rounded-2xl border bg-muted/20 px-4 py-3">
                        <div className="flex items-center justify-between gap-3">
                          <HeaderLabel title="Lesson content" compact />
                          <p className="text-xs text-muted-foreground">
                            Scroll horizontally
                          </p>
                        </div>

                        <div className="mt-3 flex gap-3 overflow-x-auto pb-2">
                          {item.topics.map((topic) => {
                            const topicPath = `${item.path}/topic/${topic.slug ?? topic._id}`;
                            const topicQuizzes =
                              quizzesByTopic.get(String(topic._id)) ?? [];

                            return (
                              <div
                                key={String(topic._id)}
                                className="min-w-[260px] shrink-0 rounded-2xl border bg-background p-3"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                      Topic
                                    </p>
                                    <p className="truncate font-medium">
                                      {topic.title}
                                    </p>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    asChild
                                  >
                                    <Link href={topicPath}>Open</Link>
                                  </Button>
                    </div>

                                {topicQuizzes.length > 0 ? (
                                  <div className="mt-3 space-y-2">
                                    <Separator />
                                    <HeaderLabel
                                      title="Quizzes"
                                      compact
                                    />
                                    <div className="flex flex-wrap gap-2">
                                      {topicQuizzes.map((quiz) => {
                                        const quizPath = `${item.path}/quiz/${quiz.slug ?? quiz._id}`;
                                        return (
                                          <Button
                                            key={String(quiz._id)}
                                            size="sm"
                                            variant="ghost"
                                            asChild
                                          >
                                            <Link href={quizPath}>
                                              {quiz.title}
                                            </Link>
                                          </Button>
                                        );
                                      })}
                                    </div>
                                  </div>
                                ) : null}
                    </div>
                            );
                          })}

                          {lessonLevelQuizzes.length > 0 ? (
                            <div className="min-w-[260px] shrink-0 rounded-2xl border bg-background p-3">
                              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Lesson quizzes
                              </p>
                              <div className="mt-2 space-y-2">
                                {lessonLevelQuizzes.map((quiz) => {
                                  const quizPath = `${item.path}/quiz/${quiz.slug ?? quiz._id}`;
                                  return (
                                    <Button
                                      key={String(quiz._id)}
                                      size="sm"
                                      variant="outline"
                                      asChild
                                      className="w-full justify-between"
                                    >
                                      <Link href={quizPath}>{quiz.title}</Link>
                    </Button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                  </div>
                    </CardContent>
                  </Card>
            );
          })}
            </div>
          )}
          emptyState={
            <div className="py-10 text-center text-muted-foreground">
              This course does not have any lessons yet.
            </div>
          }
          initialSort={{ id: "title", direction: "asc" }}
        />
      ) : null}

      {standaloneQuizzes.length > 0 && (
        <Card className="border-primary/30 bg-primary/5">
          <CardContent className="space-y-4 py-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                Final assessment
              </p>
              <h3 className="text-lg font-semibold">Course-wide quizzes</h3>
              <p className="text-sm text-muted-foreground">
                These quizzes are not tied to a specific lesson and typically
                act as final exams or certification checkpoints.
              </p>
            </div>
            <QuizList lessonPath={baseCoursePath} quizzes={standaloneQuizzes} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function TopicItem({
  lessonPath,
  topic,
  topicQuizzes,
}: {
  lessonPath: string;
  topic: LmsBuilderTopic;
  topicQuizzes: LmsBuilderQuiz[];
}) {
  const topicPath = `${lessonPath}/topic/${topic.slug ?? topic._id}`;
  const hasQuizzes = topicQuizzes.length > 0;

  return (
    <div className="rounded-2xl border px-4 py-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Topic
          </p>
          <p className="font-medium">{topic.title}</p>
        </div>
        <Button size="sm" variant="outline" asChild>
          <Link href={topicPath}>View topic</Link>
        </Button>
      </div>
      {topic.excerpt && (
        <p className="mt-2 text-sm text-muted-foreground">{topic.excerpt}</p>
      )}

      {hasQuizzes && (
        <div className="mt-3 space-y-2">
          <Separator />
          <HeaderLabel title="Topic quizzes" compact />
          <QuizList lessonPath={lessonPath} quizzes={topicQuizzes} dense />
        </div>
      )}
    </div>
  );
}

function QuizList({
  lessonPath,
  quizzes,
  dense = false,
}: {
  lessonPath: string;
  quizzes: LmsBuilderQuiz[];
  dense?: boolean;
}) {
  return (
    <div className="space-y-2">
      {quizzes.map((quiz) => {
        const quizPath = `${lessonPath}/quiz/${quiz.slug ?? quiz._id}`;
        return (
          <div
            key={quiz._id}
            className="flex items-center justify-between rounded-xl border px-3 py-2 text-sm"
          >
            <div>
              <p className="font-medium">{quiz.title}</p>
              {quiz.excerpt && !dense && (
                <p className="text-xs text-muted-foreground">{quiz.excerpt}</p>
              )}
            </div>
            <Button size="sm" variant="ghost" asChild>
              <Link href={quizPath}>Start</Link>
            </Button>
          </div>
        );
      })}
      {quizzes.length === 0 && (
        <p className="text-sm text-muted-foreground">No quizzes available.</p>
      )}
    </div>
  );
}

function HeaderLabel({
  title,
  compact = false,
}: {
  title: string;
  compact?: boolean;
}) {
  return (
    <p
      className={`text-xs font-semibold uppercase tracking-wide text-muted-foreground ${
        compact ? "" : "mt-1"
      }`}
    >
      {title}
    </p>
  );
}

function groupQuizzesByTopic(quizzes: LmsBuilderQuiz[]) {
  const map = new Map<string, LmsBuilderQuiz[]>();
  for (const quiz of quizzes) {
    const key = quiz.topicId ?? LESSON_LEVEL_QUIZ_KEY;
    const list = map.get(key) ?? [];
    list.push(quiz);
    map.set(key, list);
  }
  return map;
}
