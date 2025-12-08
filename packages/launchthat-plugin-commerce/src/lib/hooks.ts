"use client";

export type HookContext = {
  postType?: string;
  postId?: string;
  postTitle?: string;
  isSubmitting?: boolean;
  formData?: unknown;
};

export function usePluginTabs<T>(baseTabs: T[], _context: HookContext) {
  return baseTabs;
}
