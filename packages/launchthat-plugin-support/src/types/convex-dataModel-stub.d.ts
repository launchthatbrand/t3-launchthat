declare module "@convex-config/_generated/dataModel" {
  // Minimal stubs for Convex Id/Doc used by the support plugin.
  export type Id<TableName extends string = string> = string & {
    __tableName: TableName;
  };
  export type Doc<TableName extends string = string> = Record<string, any> & {
    _id: Id<TableName>;
    _creationTime: number;
  };
}

