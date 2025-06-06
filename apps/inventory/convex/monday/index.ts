/**
 * Monday.com Integration Public API
 *
 * This module exposes the public API for the Monday.com integration.
 */

export {
  getIntegration,
  getIntegrations,
  getBoardMappings,
  getBoardMapping,
  getColumnMappings,
  getSyncStats,
  getSyncLogs,
  getSyncLogDetails,
  getSyncLogsSummary,
  getRecentSyncErrors,
  getTableFields,
  getAvailableTables,
} from "./queries";

export {
  createIntegration,
  updateIntegration,
  createBoardMapping,
  updateBoardMapping,
  deleteBoardMapping,
  saveColumnMapping,
  deleteColumnMapping,
  updateIntegrationLastSync,
  pullFromMonday,
  pushToMonday,
  syncAll,
  logRecordChange,
  logError,
  logPerformanceMetric,
  logMessage,
  logSyncPhase,
  endSyncPhase,
  calculateSyncMetrics,
  createSyncLog,
  updateSyncLog,
  syncAllBoards,
  syncAllOrders,
  saveIntegration,
} from "./mutations";

// Re-export public action functions
export * from "./actions";

// Re-export internal functions
export * as internal from "./internal";

// Re-export schema (used internally by Convex)
export { default as schema } from "./schema";

// Re-export value exports
export { SYNC_DIRECTIONS, COLUMN_TYPES, SYNC_STATUS } from "./lib/types";

// Re-export type exports
export type {
  MondayWorkspace,
  MondayBoard,
  MondayColumn,
  MondayItem,
  MondayUser,
  SyncDirection,
  ColumnType,
  SyncStatus,
} from "./lib/types";

/**
 * For backward compatibility with client-side code
 */
export const queries = {
  getIntegrationConfig: "monday/queries:getIntegrationConfig",
  getAvailableTables: "monday/queries:getAvailableTables",
};

/**
 * For backward compatibility with client-side code
 */
export const mutations = {
  pullFromMonday: "monday/mutations:pullFromMonday",
  pushToMonday: "monday/mutations:pushToMonday",
};
