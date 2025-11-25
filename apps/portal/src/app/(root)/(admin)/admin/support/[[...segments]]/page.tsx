import { SupportSystemClient } from "./SupportSystemClient";

interface SupportPageProps {
  params: { segments?: string[] } | Promise<{ segments?: string[] }>;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}

export default async function SupportPage({
  params,
  searchParams,
}: SupportPageProps) {
  const resolvedParams =
    typeof (params as Promise<unknown>)?.then === "function"
      ? await (params as Promise<{ segments?: string[] }>)
      : (params as { segments?: string[] });
  const resolvedSearchParams =
    typeof searchParams?.then === "function"
      ? await searchParams
      : searchParams;
  const segmentKey = (resolvedParams.segments ?? []).join("/") || "root";
  const queryKey = JSON.stringify(resolvedSearchParams ?? {});

  return (
    <SupportSystemClient
      key={`${segmentKey}?${queryKey}`}
      params={resolvedParams}
      searchParams={resolvedSearchParams}
    />
  );
}
