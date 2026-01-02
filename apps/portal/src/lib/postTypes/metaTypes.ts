export interface AdminMetaEntry {
  key: string;
  value: unknown;
}

export type AdminMetaMap = Record<
  string,
  // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
  string | number | boolean | null | ""
>;


