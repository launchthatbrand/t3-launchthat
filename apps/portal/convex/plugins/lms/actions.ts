"use node";

import { v } from "convex/values";
import {
  buildSupportOpenAiOwnerKey,
  SUPPORT_OPENAI_NODE_TYPE,
} from "launchthat-plugin-support/assistant/openai";

import type { Id } from "../../_generated/dataModel";
import type { MetaValue } from "../../../../../packages/launchthat-plugin-lms/src/types";
import { api, internal } from "../../_generated/api";
import { action } from "../../_generated/server";
import {
  buildQuizPrompt,
  quizResponseSchema,
} from "../../../../../packages/launchthat-ai/src";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    .slice(0, 48);

const buildQuizSlug = (title: string) => {
  const base = slugify(title || "lesson-quiz");
  return `${base}-${Math.random().toString(36).slice(-6)}`;
};

type QuizQuestionInput = {
  prompt: string;
  questionType: "singleChoice" | "shortText";
  options?: Array<{ id: string; label: string }>;
  correctOptionIds?: string[];
  answerText?: string | null;
};

export const generateQuizFromTranscript = action({
  args: {
    organizationId: v.id("organizations"),
    lessonId: v.id("posts"),
    questionCount: v.optional(v.number()),
  },
  returns: v.object({
    quizId: v.id("posts"),
    quizTitle: v.string(),
    questionCount: v.number(),
    builderUrl: v.string(),
  }),
  handler: async (ctx, args) => {
    const openaiApiKey = await resolveOrganizationOpenAiApiKey(
      ctx,
      args.organizationId,
    );
    if (!openaiApiKey) {
      throw new Error(
        "OpenAI key is not connected for this organization. Add one under Support → Settings → AI assistant.",
      );
    }

    const lesson = await ctx.runQuery(api.core.posts.queries.getPostById, {
      id: args.lessonId,
      organizationId: args.organizationId,
    });
    if (!lesson || lesson.postTypeSlug !== "lessons") {
      throw new Error("Quiz generation currently supports lesson posts only.");
    }

    const metaMap = await fetchPostMetaMap(
      ctx,
      args.lessonId,
      args.organizationId,
    );
    const transcriptRaw = metaMap.get("vimeoTranscript");
    if (typeof transcriptRaw !== "string" || transcriptRaw.length < 200) {
      throw new Error(
        "Lesson transcript missing or too short. Save a transcript before generating quizzes.",
      );
    }

    const prompt = buildQuizPrompt({
      lessonTitle: lesson.title ?? "Untitled lesson",
      transcript: transcriptRaw,
      questionCount: args.questionCount ?? 5,
    });

    const quizResponse = await requestQuizFromOpenAi({
      apiKey: openaiApiKey,
      prompt,
    });

    const parsed = quizResponseSchema.safeParse(quizResponse);
    if (!parsed.success) {
      throw new Error("Quiz assistant returned an invalid response.");
    }

    const questions = parsed.data.questions ?? [];
    if (questions.length === 0) {
      throw new Error("The quiz assistant was unable to generate questions.");
    }

    const quizTitle =
      lesson.title && lesson.title.length > 0
        ? `${lesson.title} Quiz`
        : "Auto-generated Quiz";

    const quizOrganizationId = lesson.organizationId ?? undefined;
    const quizId = await ctx.runMutation(
      internal.core.posts.mutations.createPost,
      {
        title: quizTitle,
        slug: buildQuizSlug(quizTitle),
        status: "draft",
        postTypeSlug: "quizzes",
        organizationId: quizOrganizationId,
        meta: {
          source: "assistant",
          sourceLessonId: args.lessonId,
        },
      },
    );

    await ctx.runMutation(internal.plugins.lms.mutations.attachQuizToLesson, {
      lessonId: args.lessonId,
      quizId,
      order: 0,
      isFinal: false,
    });

    let createdQuestions = 0;
    for (const question of questions) {
      const promptText = question.prompt?.trim();
      if (!promptText) {
        continue;
      }
      const options = Array.isArray(question.choices)
        ? question.choices.slice(0, 5).map((choice, index) => ({
            id: `opt-${index}-${Math.random().toString(36).slice(-4)}`,
            label: choice,
          }))
        : [];
      const normalizedCorrect = question.correctAnswer?.trim().toLowerCase();
      const resolvedCorrect =
        options.find(
          (option) =>
            option.label.trim().toLowerCase() === normalizedCorrect &&
            normalizedCorrect.length > 0,
        ) ?? options[0];

      const payload: QuizQuestionInput = {
        prompt: promptText,
        questionType: options.length > 0 ? "singleChoice" : "shortText",
        options: options.length > 0 ? options : undefined,
        correctOptionIds:
          options.length > 0 && resolvedCorrect
            ? [resolvedCorrect.id]
            : undefined,
        answerText: question.explanation ?? question.correctAnswer ?? null,
      };

      await ctx.runMutation(internal.plugins.lms.mutations.createQuizQuestion, {
        quizId,
        organizationId: quizOrganizationId,
        question: payload,
      });
      createdQuestions += 1;
    }

    if (createdQuestions === 0) {
      throw new Error("No usable questions were generated for this lesson.");
    }

    return {
      quizId,
      quizTitle,
      questionCount: createdQuestions,
      builderUrl: `/admin/edit?post_type=quizzes&post_id=${quizId}`,
    };
  },
});

const resolveOrganizationOpenAiApiKey = async (
  ctx: Parameters<typeof generateQuizFromTranscript.handler>[0],
  organizationId: Id<"organizations">,
) => {
  const ownerId = buildSupportOpenAiOwnerKey(organizationId);
  console.log("[lms] resolve OpenAI key", { organizationId, ownerId });
  const connection = await ctx.runQuery(
    internal.integrations.connections.queries.getConnectionByNodeTypeAndOwner,
    {
      nodeType: SUPPORT_OPENAI_NODE_TYPE,
      ownerId,
    },
  );
  if (!connection) {
    console.warn("[lms] no org OpenAI connection found, falling back", {
      ownerId,
    });
    const fallbackConnections = await ctx.runQuery(
      api.integrations.connections.queries.list,
      {
        nodeType: SUPPORT_OPENAI_NODE_TYPE,
      },
    );
    const fallback = fallbackConnections[0];
    if (!fallback) {
      return null;
    }
    return await resolveApiKeyFromConnection(ctx, fallback._id);
  }
  return await resolveApiKeyFromConnection(ctx, connection._id);
};

const resolveApiKeyFromConnection = async (
  ctx: Parameters<typeof generateQuizFromTranscript.handler>[0],
  connectionId: Id<"connections">,
) => {
  const decrypted = await ctx.runAction(
    internal.integrations.connections.cryptoActions.getDecryptedSecrets,
    {
      connectionId,
    },
  );
  if (!decrypted?.credentials) {
    return null;
  }
  return (
    decrypted.credentials.token ??
    decrypted.credentials.apiKey ??
    decrypted.credentials.api_key ??
    decrypted.credentials.key ??
    null
  );
};

const fetchPostMetaMap = async (
  ctx: Parameters<typeof generateQuizFromTranscript.handler>[0],
  postId: Id<"posts">,
  organizationId: Id<"organizations">,
) => {
  const entries = await ctx.runQuery(api.core.posts.queries.getPostMeta, {
    postId,
    organizationId,
  });
  return new Map<string, MetaValue>(
    entries.map((entry) => [entry.key, entry.value ?? null]),
  );
};

const QUIZ_SYSTEM_PROMPT =
  "You are an LMS assistant that turns lesson transcripts into high-quality quizzes. " +
  "Return strictly formatted JSON matching the provided schema.";

const requestQuizFromOpenAi = async ({
  apiKey,
  prompt,
}: {
  apiKey: string;
  prompt: string;
}) => {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.3,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: QUIZ_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `OpenAI request failed (${response.status}): ${errorBody.slice(0, 2000)}`,
    );
  }

  const json = (await response.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OpenAI returned an empty response.");
  }

  try {
    return JSON.parse(content) as unknown;
  } catch {
    throw new Error("OpenAI response was not valid JSON.");
  }
};
