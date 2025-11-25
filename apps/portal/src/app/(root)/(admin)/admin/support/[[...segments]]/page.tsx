import { SupportSystemClient } from "./SupportSystemClient";

interface SupportPageProps {
  params: { segments?: string[] } | Promise<{ segments?: string[] }>;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}

const isPromise = (
  value:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>
    | undefined,
): value is Promise<Record<string, string | string[] | undefined>> =>
  typeof value === "object" && value !== null && "then" in value;

export default async function SupportPage({
  params,
  searchParams,
}: SupportPageProps) {
  const resolvedParams =
    typeof (params as Promise<unknown>)?.then === "function"
      ? await (params as Promise<{ segments?: string[] }>)
      : (params as { segments?: string[] });
  const resolvedSearchParams = isPromise(searchParams)
    ? await searchParams
    : (searchParams as
        | Record<string, string | string[] | undefined>
        | undefined);
  const segmentKey = (resolvedParams.segments ?? []).join("/") || "root";
  const sanitizedSearchParams = resolvedSearchParams
    ? Object.fromEntries(
        Object.entries(resolvedSearchParams).filter(
          ([key]) => key !== "sessionId",
        ),
      )
    : {};
  const queryKey = JSON.stringify(sanitizedSearchParams);

  return (
    <SupportSystemClient
      key={`${segmentKey}?${queryKey}`}
      params={resolvedParams}
      searchParams={resolvedSearchParams}
    />
  );
}
