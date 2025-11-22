const BUILT_IN_POST_TYPE_SLUGS = new Set<string>([
  "post",
  "posts",
  "page",
  "pages",
  "template",
  "templates",
  "page-template",
  "page-templates",
  "attachment",
  "attachments",
  "revision",
  "revisions",
  "nav_menu_item",
  "nav-menu-item",
  "course",
  "courses",
  "lesson",
  "lessons",
  "topic",
  "topics",
  "quiz",
  "quizzes",
]);

export const isBuiltInPostTypeSlug = (slug?: string | null) => {
  if (!slug) {
    return false;
  }
  return BUILT_IN_POST_TYPE_SLUGS.has(slug.toLowerCase());
};

export { BUILT_IN_POST_TYPE_SLUGS };
