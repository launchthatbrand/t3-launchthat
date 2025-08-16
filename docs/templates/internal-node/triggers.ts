import { z } from "zod";

import type {
  TriggerDefinition,
  TriggerSetupContext,
  TriggerTeardownContext,
} from "../../../packages/integration-sdk/src/node-types.js";

/**
 * Internal Node Triggers Template
 *
 * This file defines all triggers (events) that this internal service can emit.
 * Internal triggers typically respond to database changes, file system events,
 * or other internal system events.
 */

// =====================================================
// TRIGGER 1: User Created (Database Event)
// =====================================================

const UserCreatedOutputSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user", "guest"]),
  createdAt: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

export const UserCreatedTrigger: TriggerDefinition = {
  id: "user_created",
  name: "User Created",
  description: "Triggered when a new user account is created in the system",
  outputSchema: UserCreatedOutputSchema,
  type: "event", // Internal event-based trigger

  async setup(context: TriggerSetupContext): Promise<void> {
    try {
      // Setup database listener for user creation events
      // This is a placeholder - replace with your actual event system
      console.log(`Setting up user created trigger: ${context.triggerId}`);

      // Example: Register with your event system
      // eventBus.subscribe('user.created', (data) => {
      //   context.emit(data);
      // });

      // Store any necessary state for this trigger
      // context.storage.set('trigger_active', true);
    } catch (error) {
      console.error("Failed to setup user created trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    try {
      // Cleanup database listener
      console.log(`Tearing down user created trigger: ${context.triggerId}`);

      // Example: Unregister from your event system
      // eventBus.unsubscribe('user.created', triggerId);

      // Clean up any stored state
      // context.storage.delete('trigger_active');
    } catch (error) {
      console.error("Error during user created trigger teardown:", error);
      // Don't throw - teardown should be best effort
    }
  },

  ui: {
    category: "User Events",
    featured: true,
    examples: [
      {
        name: "New User Notification",
        description: "Send email when new user registers",
        settings: {},
      },
    ],
    documentation: {
      description:
        "This trigger fires whenever a new user account is created in the system",
      setup: "Automatically monitors database for new user records",
      notes: [
        "Fires immediately after user creation",
        "Includes all user data except sensitive information",
        "Can be used to trigger welcome emails, notifications, etc.",
      ],
    },
  },
};

// =====================================================
// TRIGGER 2: User Updated (Database Event)
// =====================================================

const UserUpdatedOutputSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(["admin", "user", "guest"]),
  updatedAt: z.string(),
  changes: z
    .record(
      z.object({
        from: z.unknown(),
        to: z.unknown(),
      }),
    )
    .optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const UserUpdatedTrigger: TriggerDefinition = {
  id: "user_updated",
  name: "User Updated",
  description: "Triggered when a user account is updated",
  outputSchema: UserUpdatedOutputSchema,
  type: "event",

  async setup(context: TriggerSetupContext): Promise<void> {
    try {
      console.log(`Setting up user updated trigger: ${context.triggerId}`);

      // Setup database change listener
      // eventBus.subscribe('user.updated', (data) => {
      //   context.emit(data);
      // });
    } catch (error) {
      console.error("Failed to setup user updated trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    try {
      console.log(`Tearing down user updated trigger: ${context.triggerId}`);

      // eventBus.unsubscribe('user.updated', triggerId);
    } catch (error) {
      console.error("Error during user updated trigger teardown:", error);
    }
  },

  ui: {
    category: "User Events",
    documentation: {
      description: "This trigger fires whenever a user account is updated",
      notes: [
        "Includes information about what fields were changed",
        "Only fires for actual data changes, not metadata updates",
        "Useful for audit trails and sync operations",
      ],
    },
  },
};

// =====================================================
// TRIGGER 3: User Deleted (Database Event)
// =====================================================

const UserDeletedOutputSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  name: z.string(),
  deletedAt: z.string(),
  softDelete: z.boolean(),
  deletedBy: z
    .object({
      id: z.string(),
      name: z.string(),
    })
    .optional(),
});

export const UserDeletedTrigger: TriggerDefinition = {
  id: "user_deleted",
  name: "User Deleted",
  description: "Triggered when a user account is deleted or deactivated",
  outputSchema: UserDeletedOutputSchema,
  type: "event",

  async setup(context: TriggerSetupContext): Promise<void> {
    try {
      console.log(`Setting up user deleted trigger: ${context.triggerId}`);

      // Setup database deletion listener
      // eventBus.subscribe('user.deleted', (data) => {
      //   context.emit(data);
      // });
    } catch (error) {
      console.error("Failed to setup user deleted trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    try {
      console.log(`Tearing down user deleted trigger: ${context.triggerId}`);

      // eventBus.unsubscribe('user.deleted', triggerId);
    } catch (error) {
      console.error("Error during user deleted trigger teardown:", error);
    }
  },

  ui: {
    category: "User Events",
    documentation: {
      description:
        "This trigger fires whenever a user account is deleted or deactivated",
      notes: [
        "Fires for both soft and hard deletes",
        "Includes information about who performed the deletion",
        "Useful for cleanup operations and audit logging",
      ],
    },
  },
};

// =====================================================
// TRIGGER 4: Scheduled Report (Cron/Timer)
// =====================================================

const ScheduledReportOutputSchema = z.object({
  reportId: z.string(),
  reportType: z.string(),
  generatedAt: z.string(),
  data: z.object({
    totalUsers: z.number(),
    newUsersToday: z.number(),
    activeUsers: z.number(),
    deletedUsers: z.number(),
  }),
  period: z.object({
    start: z.string(),
    end: z.string(),
  }),
});

const ScheduledReportSettingsSchema = z.object({
  reportType: z.enum(["daily", "weekly", "monthly"]).default("daily"),
  includeDeleted: z.boolean().default(false),
  emailRecipients: z.array(z.string().email()).optional(),
});

export const ScheduledReportTrigger: TriggerDefinition = {
  id: "scheduled_report",
  name: "Scheduled Report",
  description: "Generate periodic user reports",
  outputSchema: ScheduledReportOutputSchema,
  settingsSchema: ScheduledReportSettingsSchema,
  type: "schedule",

  async setup(context: TriggerSetupContext): Promise<void> {
    try {
      console.log(`Setting up scheduled report trigger: ${context.triggerId}`);

      // Validate settings
      const settings = context.settings as any;
      if (settings?.emailRecipients?.length === 0) {
        console.warn("No email recipients configured for scheduled report");
      }

      // Setup cron job or scheduler
      // scheduler.schedule(context.cronExpression, () => {
      //   generateReport(context);
      // });
    } catch (error) {
      console.error("Failed to setup scheduled report trigger:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    try {
      console.log(
        `Tearing down scheduled report trigger: ${context.triggerId}`,
      );

      // Cancel scheduled job
      // scheduler.cancel(context.triggerId);
    } catch (error) {
      console.error("Error during scheduled report trigger teardown:", error);
    }
  },

  ui: {
    category: "Reports",
    examples: [
      {
        name: "Daily User Report",
        description: "Generate daily user statistics report",
        settings: {
          reportType: "daily",
          includeDeleted: false,
          emailRecipients: ["admin@company.com"],
        },
      },
      {
        name: "Weekly Summary",
        description: "Generate weekly user activity summary",
        settings: {
          reportType: "weekly",
          includeDeleted: true,
          emailRecipients: ["management@company.com", "analytics@company.com"],
        },
      },
    ],
    documentation: {
      description:
        "Automatically generates periodic reports about user activity and statistics",
      setup: "Configure report frequency and email recipients",
      notes: [
        "Reports are generated automatically based on the schedule",
        "Can be configured for daily, weekly, or monthly frequency",
        "Includes user counts, activity metrics, and trends",
      ],
    },
  },
};

// =====================================================
// TRIGGER 5: File System Watcher (File Events)
// =====================================================

const FileSystemEventOutputSchema = z.object({
  eventType: z.enum(["created", "modified", "deleted"]),
  filePath: z.string(),
  fileName: z.string(),
  fileSize: z.number().optional(),
  timestamp: z.string(),
  metadata: z.record(z.unknown()).optional(),
});

const FileSystemWatcherSettingsSchema = z.object({
  watchPath: z.string().default("/uploads"),
  fileExtensions: z.array(z.string()).default(["jpg", "png", "pdf", "txt"]),
  includeSubdirectories: z.boolean().default(true),
});

export const FileSystemWatcherTrigger: TriggerDefinition = {
  id: "file_system_watcher",
  name: "File System Watcher",
  description: "Monitor file system changes",
  outputSchema: FileSystemEventOutputSchema,
  settingsSchema: FileSystemWatcherSettingsSchema,
  type: "event",

  async setup(context: TriggerSetupContext): Promise<void> {
    try {
      console.log(`Setting up file system watcher: ${context.triggerId}`);

      const settings = context.settings as any;
      const watchPath = settings?.watchPath || "/uploads";

      // Setup file system watcher
      // const watcher = fs.watch(watchPath, { recursive: settings?.includeSubdirectories });
      // watcher.on('change', (eventType, filename) => {
      //   context.emit({
      //     eventType,
      //     filePath: path.join(watchPath, filename),
      //     fileName: filename,
      //     timestamp: new Date().toISOString(),
      //   });
      // });

      console.log(`Watching directory: ${watchPath}`);
    } catch (error) {
      console.error("Failed to setup file system watcher:", error);
      throw error;
    }
  },

  async teardown(context: TriggerTeardownContext): Promise<void> {
    try {
      console.log(`Tearing down file system watcher: ${context.triggerId}`);

      // Close file system watcher
      // watcher.close();
    } catch (error) {
      console.error("Error during file system watcher teardown:", error);
    }
  },

  ui: {
    category: "File System",
    examples: [
      {
        name: "Upload Monitor",
        description: "Monitor uploads directory for new files",
        settings: {
          watchPath: "/uploads",
          fileExtensions: ["jpg", "png", "pdf"],
          includeSubdirectories: true,
        },
      },
      {
        name: "Config Watcher",
        description: "Monitor configuration files for changes",
        settings: {
          watchPath: "/config",
          fileExtensions: ["json", "yaml", "env"],
          includeSubdirectories: false,
        },
      },
    ],
    documentation: {
      description: "Monitors specified directories for file system changes",
      setup: "Configure watch path and file type filters",
      notes: [
        "Monitors file creation, modification, and deletion",
        "Can filter by file extension",
        "Supports recursive directory watching",
      ],
    },
  },
};

// =====================================================
// EXPORT ALL TRIGGERS
// =====================================================

export const InternalServiceTriggers = {
  user_created: UserCreatedTrigger,
  user_updated: UserUpdatedTrigger,
  user_deleted: UserDeletedTrigger,
  scheduled_report: ScheduledReportTrigger,
  file_system_watcher: FileSystemWatcherTrigger,
  // Add more triggers as needed
};

// Default export for convenience
export default InternalServiceTriggers;
