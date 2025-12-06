import {
  contentAccessLogTable,
  contentAccessRulesTable,
} from "./contentAccess/schema";

export const lmsSchema = {
  contentAccessRules: contentAccessRulesTable,
  contentAccessLog: contentAccessLogTable,
};
