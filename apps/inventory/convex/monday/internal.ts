/**
 * Monday.com Integration Internal API
 *
 * This module exports the internal API for the Monday.com integration.
 * These functions are only used internally by the Monday.com integration.
 */

import { api, internal } from "../_generated/api";

export default {
  // Internal queries
  getIntegration: internal.monday.queries.getIntegration,
  getBoardMapping: internal.monday.queries.getBoardMapping,
  getColumnMappings: internal.monday.queries.getColumnMappings,
  getLatestSyncLog: internal.monday.queries.getLatestSyncLog,

  // Internal mutations
  updateConnection: internal.monday.mutations.updateIntegration,
  updateConnectionStatus: internal.monday.mutations.updateConnectionStatus,
  startSync: internal.monday.mutations.startSync,
  completeSyncWithError: internal.monday.mutations.completeSyncWithError,
  executePullSync: internal.monday.mutations.executePullSync,

  // Internal actions
  testAndUpdateConnection: internal.monday.actions.testAndUpdateConnection,

  // Public API
  api: {
    saveBoardMapping: api.monday.mutations.saveBoardMapping,
    saveColumnMapping: api.monday.mutations.saveColumnMapping,
    deleteColumnMapping: api.monday.mutations.deleteColumnMapping,
  },
};
