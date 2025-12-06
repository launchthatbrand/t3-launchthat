/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-argument */
import type { Id } from "../../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../../_generated/server";
import type {
  MetaValue,
  QuizQuestionInput,
  QuizQuestionType,
} from "../../../../../packages/launchthat-plugin-lms/src/types";
import {
  DEFAULT_QUIZ_QUESTION_TYPE,
  parseQuizQuestionAnswers,
  parseQuizQuestionOptions,
  questionTypeSupportsAnswerText,
  questionTypeSupportsOptions,
  QUIZ_QUESTION_TYPES,
  serializeQuizQuestionAnswers,
  serializeQuizQuestionOptions,
} from "../../../../../packages/launchthat-plugin-lms/src/types";

type Ctx = QueryCtx | MutationCtx;

interface StoredQuizQuestion {
  _id: Id<"posts">;
  title: string;
  prompt: string;
  quizId: Id<"posts">;
  questionType: QuizQuestionType;
  options: ReturnType<typeof parseQuizQuestionOptions>;
  correctOptionIds: string[];
  answerText?: string | null;
  order: number;
}

export async function getPostMetaMap(
  ctx: Ctx,
  postId: Id<"posts">,
): Promise<Map<string, MetaValue>> {
  const metaEntries = await ctx.db
    .query("postsMeta")
    .withIndex("by_post", (q) => q.eq("postId", postId))
    .collect();

  return new Map(
    metaEntries.map((entry) => [entry.key, entry.value ?? null] as const),
  );
}

export async function setPostMetaValue(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
  value: MetaValue,
): Promise<void> {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  const timestamp = Date.now();
  if (existing) {
    await ctx.db.patch(existing._id, { value, updatedAt: timestamp });
    return;
  }

  await ctx.db.insert("postsMeta", {
    postId,
    key,
    value,
    createdAt: timestamp,
    updatedAt: timestamp,
  });
}

export async function deletePostMetaValue(
  ctx: MutationCtx,
  postId: Id<"posts">,
  key: string,
): Promise<void> {
  const existing = await ctx.db
    .query("postsMeta")
    .withIndex("by_post_and_key", (q) => q.eq("postId", postId).eq("key", key))
    .unique();

  if (existing) {
    await ctx.db.delete(existing._id);
  }
}

export function parseCourseStructureMeta(value: MetaValue): Id<"posts">[] {
  if (typeof value !== "string") {
    return [];
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (Array.isArray(parsed)) {
      return parsed.filter(
        (item): item is Id<"posts"> => typeof item === "string",
      );
    }
  } catch {
    // ignore malformed JSON
  }

  return [];
}

export function serializeCourseStructureMeta(lessonIds: Id<"posts">[]): string {
  return JSON.stringify(lessonIds);
}

export const QUIZ_QUESTION_META_KEYS = {
  quizId: "quizId",
  type: "questionType",
  order: "questionOrder",
  options: "questionOptions",
  correctAnswers: "questionCorrectAnswers",
  answerText: "questionAnswerText",
} as const;

const QUIZ_QUESTION_TYPE_SET = new Set<QuizQuestionType>(QUIZ_QUESTION_TYPES);

const resolveQuestionType = (
  value: MetaValue | undefined,
): QuizQuestionType => {
  if (
    typeof value === "string" &&
    QUIZ_QUESTION_TYPE_SET.has(value as QuizQuestionType)
  ) {
    return value as QuizQuestionType;
  }
  return DEFAULT_QUIZ_QUESTION_TYPE;
};

const resolveQuestionOrder = (value: MetaValue | undefined): number => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return 0;
};

const resolveAnswerText = (value: MetaValue | undefined): string | null => {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }
  return null;
};

const normalizeCorrectOptionIds = (payload: QuizQuestionInput): string[] => {
  if (!questionTypeSupportsOptions(payload.questionType)) {
    return [];
  }
  const source = payload.correctOptionIds ?? [];
  if (payload.questionType === "singleChoice") {
    const [first] = source;
    return first ? [first] : [];
  }
  return Array.from(new Set(source));
};

export const buildQuizQuestionMetaPayload = (
  quizId: Id<"posts">,
  payload: QuizQuestionInput,
  order: number,
): Record<string, MetaValue> => {
  return {
    [QUIZ_QUESTION_META_KEYS.quizId]: quizId,
    [QUIZ_QUESTION_META_KEYS.type]: payload.questionType,
    [QUIZ_QUESTION_META_KEYS.order]: order,
    [QUIZ_QUESTION_META_KEYS.options]: serializeQuizQuestionOptions(
      questionTypeSupportsOptions(payload.questionType)
        ? (payload.options ?? [])
        : [],
    ),
    [QUIZ_QUESTION_META_KEYS.correctAnswers]: serializeQuizQuestionAnswers(
      normalizeCorrectOptionIds(payload),
    ),
    [QUIZ_QUESTION_META_KEYS.answerText]: questionTypeSupportsAnswerText(
      payload.questionType,
    )
      ? (payload.answerText ?? "")
      : "",
  };
};

export async function buildQuizQuestionFromPost(
  ctx: Ctx,
  post: { _id: Id<"posts">; title?: string },
  metaOverride?: Map<string, MetaValue>,
): Promise<StoredQuizQuestion | null> {
  const meta = metaOverride ?? (await getPostMetaMap(ctx, post._id));
  const quizIdValue = meta.get(QUIZ_QUESTION_META_KEYS.quizId);
  if (typeof quizIdValue !== "string") {
    return null;
  }
  const questionType = resolveQuestionType(
    meta.get(QUIZ_QUESTION_META_KEYS.type) ?? null,
  );
  const order = resolveQuestionOrder(
    meta.get(QUIZ_QUESTION_META_KEYS.order) ?? null,
  );
  const options = parseQuizQuestionOptions(
    meta.get(QUIZ_QUESTION_META_KEYS.options) ?? null,
  );
  const correctOptionIds = parseQuizQuestionAnswers(
    meta.get(QUIZ_QUESTION_META_KEYS.correctAnswers) ?? null,
  );
  const answerText = resolveAnswerText(
    meta.get(QUIZ_QUESTION_META_KEYS.answerText) ?? null,
  );
  const prompt = post.title ?? "Untitled question";

  return {
    _id: post._id,
    title: prompt,
    prompt,
    quizId: quizIdValue as Id<"posts">,
    questionType,
    options,
    correctOptionIds,
    answerText,
    order,
  };
}

export async function loadQuizQuestionById(
  ctx: Ctx,
  questionId: Id<"posts">,
): Promise<StoredQuizQuestion | null> {
  const post = await ctx.db.get(questionId);
  if (!post || post.postTypeSlug !== "lms-quiz-question") {
    return null;
  }
  return buildQuizQuestionFromPost(ctx, post);
}

export async function fetchQuizQuestionsForQuiz(
  ctx: Ctx,
  quizId: Id<"posts">,
  organizationId?: Id<"organizations">,
): Promise<StoredQuizQuestion[]> {
  let queryBuilder = ctx.db
    .query("posts")
    .withIndex("by_postTypeSlug", (q) =>
      q.eq("postTypeSlug", "lms-quiz-question"),
    );

  if (organizationId) {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), organizationId),
    );
  } else {
    queryBuilder = queryBuilder.filter((q) =>
      q.eq(q.field("organizationId"), undefined),
    );
  }

  const posts = await queryBuilder.collect();
  const questions: StoredQuizQuestion[] = [];
  for (const post of posts) {
    const meta = await getPostMetaMap(ctx, post._id);
    const question = await buildQuizQuestionFromPost(ctx, post, meta);
    if (question && question.quizId === quizId) {
      questions.push(question);
    }
  }

  questions.sort((a, b) => a.order - b.order);
  return questions;
}
