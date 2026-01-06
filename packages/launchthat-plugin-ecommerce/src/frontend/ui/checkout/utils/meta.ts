export const getMetaValue = (
  meta: Array<{ key: string; value: unknown }>,
  key: string,
): unknown => meta.find((m) => m.key === key)?.value;


