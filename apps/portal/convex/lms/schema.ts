import {
  contentAccessLogTable,
  contentAccessRulesTable,
} from "./contentAccess/schema";
import { progressSchema } from "./progress/schema";

export const lmsSchema = {
  contentAccessRules: contentAccessRulesTable,
  contentAccessLog: contentAccessLogTable,
  ...progressSchema,
};
