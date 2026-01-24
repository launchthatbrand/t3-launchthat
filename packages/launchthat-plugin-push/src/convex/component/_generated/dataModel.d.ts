/* eslint-disable */
/**
 * Placeholder data model types for Convex component compilation.
 *
 * Most component code in this repo avoids relying on generated table typings directly.
 */

export type Id<TableName extends string> = string & { __tableName: TableName };

