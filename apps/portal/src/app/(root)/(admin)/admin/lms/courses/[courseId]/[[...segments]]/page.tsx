import { redirect } from "next/navigation";

interface CourseSingleRouteProps {
  params: {
    courseId: string;
    segments?: string[];
  };
  searchParams?: Record<string, string | string[] | undefined>;
}

export default function CourseSingleRoute({
  params,
  searchParams,
}: CourseSingleRouteProps) {
  const [pathTab] = params.segments ?? [];
  const query = new URLSearchParams({
    post_type: "courses",
    post_id: params.courseId,
    plugin: "lms",
  });

  const queryTabParam = searchParams?.tab;
  const queryTab =
    typeof queryTabParam === "string" && queryTabParam.length > 0
      ? queryTabParam
      : undefined;
  const normalizedPathTab =
    typeof pathTab === "string" && pathTab.length > 0 ? pathTab : undefined;
  const resolvedTab = queryTab ?? normalizedPathTab;

  if (resolvedTab) {
    query.set("tab", resolvedTab);
  }

  redirect(`/admin/edit?${query.toString()}`);
}
