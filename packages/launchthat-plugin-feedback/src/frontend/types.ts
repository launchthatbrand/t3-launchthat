export type FeedbackSort = "trending" | "new";

export type FeedbackThreadType = "feedback" | "issue";

export type FeedbackThreadRow = Record<string, unknown> & {
  _id: string;
  type?: FeedbackThreadType;
  title?: string;
  body?: string;
  status?: string;
  upvoteCount?: number;
  commentCount?: number;
  viewerHasUpvoted?: boolean;
  createdAt?: number;
  updatedAt?: number;
  authorUserId?: string;
};

export type FeedbackCommentRow = Record<string, unknown> & {
  _id: string;
  threadId?: string;
  body?: string;
  createdAt?: number;
  authorUserId?: string;
};

export type FeedbackAdapter = {
  api: {
    queries: {
      listThreads: any;
      getThread: any;
      listComments: any;
    };
    mutations: {
      createThread: any;
      toggleUpvote: any;
      addComment: any;
    };
  };
};

