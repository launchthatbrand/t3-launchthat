import { create } from "zustand";
import { shallow } from "zustand/shallow";

export interface Comment {
  _id: string;
  authorId: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  parentId?: string;
  likes: number;
  liked?: boolean;
}

export interface Post {
  _id: string;
  authorId: string;
  content: string;
  mediaUrls?: string[];
  createdAt: string;
  updatedAt?: string;
  likes: number;
  liked?: boolean;
  commentCount: number;
  shareCount: number;
  hashtags?: string[];
}

export interface User {
  _id: string;
  name: string;
  username?: string;
  avatar?: string;
  isBlocked?: boolean;
}

export interface PaginationState {
  cursor: string | null;
  hasMore: boolean;
}

export interface FilterSettings {
  hideBlockedUsers: boolean;
  hideBlockedContent: boolean;
  contentSensitivityLevel: "low" | "medium" | "high";
  showSensitiveContent: boolean;
}

interface SocialState {
  // Posts state
  posts: Post[];
  isLoadingPosts: boolean;
  postPagination: PaginationState;

  // Comments state
  commentsByPostId: Record<string, Comment[]>;
  activeCommentPostId: string | null;
  isSubmittingComment: boolean;

  // Users state
  userCache: Record<string, User>;
  blockedUsers: User[];
  isLoadingBlockedUsers: boolean;

  // UI state
  shareDialogOpen: boolean;
  shareDialogPostId: string | null;
  blockDialogOpen: boolean;
  blockDialogUserId: string | null;
  reportDialogOpen: boolean;
  reportDialogItemId: string | null;
  reportDialogType: "post" | "comment" | "user" | null;

  // Filter settings
  filterSettings: FilterSettings;
  isLoadingFilterSettings: boolean;

  // Actions - Posts
  setPosts: (posts: Post[]) => void;
  addPosts: (posts: Post[]) => void;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  removePost: (postId: string) => void;
  setPostPagination: (pagination: Partial<PaginationState>) => void;
  setIsLoadingPosts: (isLoading: boolean) => void;
  likePost: (postId: string) => void;
  unlikePost: (postId: string) => void;

  // Actions - Comments
  setComments: (postId: string, comments: Comment[]) => void;
  addComment: (postId: string, comment: Comment) => void;
  updateComment: (
    postId: string,
    commentId: string,
    updates: Partial<Comment>,
  ) => void;
  removeComment: (postId: string, commentId: string) => void;
  setActiveCommentPostId: (postId: string | null) => void;
  setIsSubmittingComment: (isSubmitting: boolean) => void;
  likeComment: (postId: string, commentId: string) => void;
  unlikeComment: (postId: string, commentId: string) => void;

  // Actions - Users
  addUserToCache: (user: User) => void;
  addUsersToCache: (users: User[]) => void;
  setBlockedUsers: (users: User[]) => void;
  addBlockedUser: (user: User) => void;
  removeBlockedUser: (userId: string) => void;
  setIsLoadingBlockedUsers: (isLoading: boolean) => void;

  // Actions - UI
  openShareDialog: (postId: string) => void;
  closeShareDialog: () => void;
  openBlockDialog: (userId: string) => void;
  closeBlockDialog: () => void;
  openReportDialog: (itemId: string, type: "post" | "comment" | "user") => void;
  closeReportDialog: () => void;

  // Actions - Filter settings
  setFilterSettings: (settings: Partial<FilterSettings>) => void;
  setIsLoadingFilterSettings: (isLoading: boolean) => void;

  // Reset and utility actions
  resetStore: () => void;
}

const DEFAULT_FILTER_SETTINGS: FilterSettings = {
  hideBlockedUsers: true,
  hideBlockedContent: true,
  contentSensitivityLevel: "medium",
  showSensitiveContent: false,
};

export const useSocialStore = create<SocialState>((set, get) => ({
  // Initial state - Posts
  posts: [],
  isLoadingPosts: false,
  postPagination: {
    cursor: null,
    hasMore: true,
  },

  // Initial state - Comments
  commentsByPostId: {},
  activeCommentPostId: null,
  isSubmittingComment: false,

  // Initial state - Users
  userCache: {},
  blockedUsers: [],
  isLoadingBlockedUsers: false,

  // Initial state - UI
  shareDialogOpen: false,
  shareDialogPostId: null,
  blockDialogOpen: false,
  blockDialogUserId: null,
  reportDialogOpen: false,
  reportDialogItemId: null,
  reportDialogType: null,

  // Initial state - Filter settings
  filterSettings: { ...DEFAULT_FILTER_SETTINGS },
  isLoadingFilterSettings: false,

  // Actions - Posts
  setPosts: (posts) => {
    // Skip if identical by reference
    if (posts === get().posts) return;

    // Skip if arrays are equal by shallow comparison
    if (shallow(posts, get().posts)) return;

    set({ posts });
  },

  addPosts: (newPosts) => {
    if (!newPosts.length) return;

    set((state) => {
      // Create a unique set of posts by ID
      const existingPostIds = new Set(state.posts.map((post) => post._id));
      const uniqueNewPosts = newPosts.filter(
        (post) => !existingPostIds.has(post._id),
      );

      if (!uniqueNewPosts.length) return state;

      const updatedPosts = [...state.posts, ...uniqueNewPosts];
      return { posts: updatedPosts };
    });
  },

  updatePost: (postId, updates) => {
    set((state) => {
      const postIndex = state.posts.findIndex((post) => post._id === postId);
      if (postIndex === -1) return state;

      const updatedPosts = [...state.posts];
      updatedPosts[postIndex] = {
        ...updatedPosts[postIndex],
        ...updates,
      } as Post; // Type assertion to ensure compatibility

      return { posts: updatedPosts };
    });
  },

  removePost: (postId) => {
    set((state) => {
      const filteredPosts = state.posts.filter((post) => post._id !== postId);

      // Skip if nothing changed
      if (filteredPosts.length === state.posts.length) return state;

      return { posts: filteredPosts };
    });
  },

  setPostPagination: (pagination) => {
    set((state) => ({
      postPagination: { ...state.postPagination, ...pagination },
    }));
  },

  setIsLoadingPosts: (isLoading) => {
    if (isLoading === get().isLoadingPosts) return;
    set({ isLoadingPosts: isLoading });
  },

  likePost: (postId) => {
    set((state) => {
      const postIndex = state.posts.findIndex((post) => post._id === postId);
      if (postIndex === -1) return state;

      const post = state.posts[postIndex];
      if (!post) return state;

      // Only increment likes if not already liked
      if (!post.liked) {
        const updatedPosts = [...state.posts];
        updatedPosts[postIndex] = {
          ...post,
          likes: post.likes + 1,
          liked: true,
        };

        return { posts: updatedPosts };
      }

      return state;
    });
  },

  unlikePost: (postId) => {
    set((state) => {
      const postIndex = state.posts.findIndex((post) => post._id === postId);
      if (postIndex === -1) return state;

      const post = state.posts[postIndex];
      if (!post) return state;

      // Only decrement likes if already liked
      if (post.liked) {
        const updatedPosts = [...state.posts];
        updatedPosts[postIndex] = {
          ...post,
          likes: Math.max(0, post.likes - 1),
          liked: false,
        };

        return { posts: updatedPosts };
      }

      return state;
    });
  },

  // Actions - Comments
  setComments: (postId, comments) => {
    // Skip if identical by reference
    const currentComments = get().commentsByPostId[postId] ?? [];
    if (comments === currentComments) return;

    // Skip if arrays are equal by shallow comparison
    if (shallow(comments, currentComments)) return;

    set((state) => ({
      commentsByPostId: {
        ...state.commentsByPostId,
        [postId]: comments,
      },
    }));
  },

  addComment: (postId, comment) => {
    set((state) => {
      const currentComments = state.commentsByPostId[postId] ?? [];
      const commentExists = currentComments.some((c) => c._id === comment._id);

      if (commentExists) return state;

      // If it's a reply, add it after its parent
      if (comment.parentId) {
        const parentIndex = currentComments.findIndex(
          (c) => c._id === comment.parentId,
        );
        if (parentIndex !== -1) {
          const updatedComments = [...currentComments];
          updatedComments.splice(parentIndex + 1, 0, comment);

          return {
            commentsByPostId: {
              ...state.commentsByPostId,
              [postId]: updatedComments,
            },
            // Also update the post comment count
            posts: state.posts.map((post) =>
              post._id === postId
                ? { ...post, commentCount: post.commentCount + 1 }
                : post,
            ),
          };
        }
      }

      // Otherwise add at the end
      return {
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: [...currentComments, comment],
        },
        // Also update the post comment count
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, commentCount: post.commentCount + 1 }
            : post,
        ),
      };
    });
  },

  updateComment: (postId, commentId, updates) => {
    set((state) => {
      const currentComments = state.commentsByPostId[postId] ?? [];
      const commentIndex = currentComments.findIndex(
        (c) => c._id === commentId,
      );

      if (commentIndex === -1) return state;

      const updatedComments = [...currentComments];
      updatedComments[commentIndex] = {
        ...updatedComments[commentIndex],
        ...updates,
      } as Comment; // Type assertion to ensure compatibility

      return {
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: updatedComments,
        },
      };
    });
  },

  removeComment: (postId, commentId) => {
    set((state) => {
      const currentComments = state.commentsByPostId[postId] ?? [];
      const filteredComments = currentComments.filter(
        (c) => c._id !== commentId,
      );

      // Skip if nothing changed
      if (filteredComments.length === currentComments.length) return state;

      return {
        commentsByPostId: {
          ...state.commentsByPostId,
          [postId]: filteredComments,
        },
        // Also update the post comment count
        posts: state.posts.map((post) =>
          post._id === postId
            ? { ...post, commentCount: Math.max(0, post.commentCount - 1) }
            : post,
        ),
      };
    });
  },

  setActiveCommentPostId: (postId) => {
    if (postId === get().activeCommentPostId) return;
    set({ activeCommentPostId: postId });
  },

  setIsSubmittingComment: (isSubmitting) => {
    if (isSubmitting === get().isSubmittingComment) return;
    set({ isSubmittingComment: isSubmitting });
  },

  likeComment: (postId, commentId) => {
    set((state) => {
      const currentComments = state.commentsByPostId[postId] ?? [];
      const commentIndex = currentComments.findIndex(
        (c) => c._id === commentId,
      );

      if (commentIndex === -1) return state;

      const comment = currentComments[commentIndex];
      if (!comment) return state;

      // Only increment likes if not already liked
      if (!comment.liked) {
        const updatedComments = [...currentComments];
        updatedComments[commentIndex] = {
          ...comment,
          likes: comment.likes + 1,
          liked: true,
        };

        return {
          commentsByPostId: {
            ...state.commentsByPostId,
            [postId]: updatedComments,
          },
        };
      }

      return state;
    });
  },

  unlikeComment: (postId, commentId) => {
    set((state) => {
      const currentComments = state.commentsByPostId[postId] ?? [];
      const commentIndex = currentComments.findIndex(
        (c) => c._id === commentId,
      );

      if (commentIndex === -1) return state;

      const comment = currentComments[commentIndex];
      if (!comment) return state;

      // Only decrement likes if already liked
      if (comment.liked) {
        const updatedComments = [...currentComments];
        updatedComments[commentIndex] = {
          ...comment,
          likes: Math.max(0, comment.likes - 1),
          liked: false,
        };

        return {
          commentsByPostId: {
            ...state.commentsByPostId,
            [postId]: updatedComments,
          },
        };
      }

      return state;
    });
  },

  // Actions - Users
  addUserToCache: (user) => {
    const currentUser = get().userCache[user._id];

    // Skip if identical by reference
    if (user === currentUser) return;

    // Skip if objects are equal by shallow comparison
    if (currentUser && shallow(user, currentUser)) return;

    set((state) => ({
      userCache: {
        ...state.userCache,
        [user._id]: user,
      },
    }));
  },

  addUsersToCache: (users) => {
    if (!users.length) return;

    set((state) => {
      const userCache = { ...state.userCache };
      let hasChanges = false;

      for (const user of users) {
        const currentUser = userCache[user._id];

        // Skip if identical by reference or shallow comparison
        if (
          user === currentUser ||
          (currentUser && shallow(user, currentUser))
        ) {
          continue;
        }

        userCache[user._id] = user;
        hasChanges = true;
      }

      return hasChanges ? { userCache } : state;
    });
  },

  setBlockedUsers: (users) => {
    // Skip if identical by reference
    if (users === get().blockedUsers) return;

    // Skip if arrays are equal by shallow comparison
    if (shallow(users, get().blockedUsers)) return;

    set({ blockedUsers: users });
  },

  addBlockedUser: (user) => {
    set((state) => {
      // Skip if already blocked
      if (state.blockedUsers.some((u) => u._id === user._id)) return state;

      // Add to blocked users and update the user in cache
      return {
        blockedUsers: [...state.blockedUsers, user],
        userCache: {
          ...state.userCache,
          [user._id]: { ...user, isBlocked: true },
        },
      };
    });
  },

  removeBlockedUser: (userId) => {
    set((state) => {
      // Skip if not blocked
      if (!state.blockedUsers.some((u) => u._id === userId)) return state;

      // Remove from blocked users and update the user in cache
      return {
        blockedUsers: state.blockedUsers.filter((u) => u._id !== userId),
        userCache: state.userCache[userId]
          ? {
              ...state.userCache,
              [userId]: { ...state.userCache[userId], isBlocked: false },
            }
          : state.userCache,
      };
    });
  },

  setIsLoadingBlockedUsers: (isLoading) => {
    if (isLoading === get().isLoadingBlockedUsers) return;
    set({ isLoadingBlockedUsers: isLoading });
  },

  // Actions - UI
  openShareDialog: (postId) => {
    set({
      shareDialogOpen: true,
      shareDialogPostId: postId,
    });
  },

  closeShareDialog: () => {
    set({
      shareDialogOpen: false,
      shareDialogPostId: null,
    });
  },

  openBlockDialog: (userId) => {
    set({
      blockDialogOpen: true,
      blockDialogUserId: userId,
    });
  },

  closeBlockDialog: () => {
    set({
      blockDialogOpen: false,
      blockDialogUserId: null,
    });
  },

  openReportDialog: (itemId, type) => {
    set({
      reportDialogOpen: true,
      reportDialogItemId: itemId,
      reportDialogType: type,
    });
  },

  closeReportDialog: () => {
    set({
      reportDialogOpen: false,
      reportDialogItemId: null,
      reportDialogType: null,
    });
  },

  // Actions - Filter settings
  setFilterSettings: (settings) => {
    set((state) => ({
      filterSettings: {
        ...state.filterSettings,
        ...settings,
      },
    }));
  },

  setIsLoadingFilterSettings: (isLoading) => {
    if (isLoading === get().isLoadingFilterSettings) return;
    set({ isLoadingFilterSettings: isLoading });
  },

  // Reset and utility actions
  resetStore: () => {
    set({
      posts: [],
      isLoadingPosts: false,
      postPagination: {
        cursor: null,
        hasMore: true,
      },
      commentsByPostId: {},
      activeCommentPostId: null,
      isSubmittingComment: false,
      shareDialogOpen: false,
      shareDialogPostId: null,
      blockDialogOpen: false,
      blockDialogUserId: null,
      reportDialogOpen: false,
      reportDialogItemId: null,
      reportDialogType: null,
      filterSettings: { ...DEFAULT_FILTER_SETTINGS },
      isLoadingFilterSettings: false,
    });
  },
}));
