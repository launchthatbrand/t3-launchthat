import { StoreSystemClient } from "../StoreSystemClient";

interface StorePageProps {
  params: { segments?: string[] } | Promise<{ segments?: string[] }>;
  searchParams?:
    | Record<string, string | string[] | undefined>
    | Promise<Record<string, string | string[] | undefined>>;
}

const isPromise = <T,>(value: T | Promise<T>): value is Promise<T> =>
  typeof value === "object" && value !== null && "then" in (value as object);

export default async function StorePage({
  params,
  searchParams,
}: StorePageProps) {
  const resolvedParams = isPromise(params) ? await params : params;
  const resolvedSearchParams = searchParams
    ? isPromise(searchParams)
      ? await searchParams
      : searchParams
    : undefined;

  const segmentKey = (resolvedParams.segments ?? []).join("/") || "root";
  const queryKey = JSON.stringify(resolvedSearchParams ?? {});

  return (
    <StoreSystemClient
      key={`${segmentKey}?${queryKey}`}
      params={resolvedParams}
      searchParams={resolvedSearchParams}
    />
  );
}
