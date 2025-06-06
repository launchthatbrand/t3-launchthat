/**
 * Rule Execution Logger
 *
 * This module provides a logger for rule execution, which can be used to
 * track the execution of rules and store logs in the database.
 */

import { LogEntry, LogLevel, RuleLogger } from "./interfaces";

/**
 * Rule execution logger
 */
export class RuleExecutionLogger implements RuleLogger {
  private entries: LogEntry[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Creates a new instance of RuleExecutionLogger
   */
  constructor() {
    this.entries = [];
    this.timers = new Map<string, number>();
  }

  /**
   * Logs an info message
   * @param message The message to log
   * @param data Additional data for the log entry
   */
  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  /**
   * Logs a warning message
   * @param message The message to log
   * @param data Additional data for the log entry
   */
  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  /**
   * Logs an error message
   * @param message The message to log
   * @param error The error object
   * @param data Additional data for the log entry
   */
  error(message: string, error: Error, data?: Record<string, unknown>): void {
    this.log("error", message, data, error);
  }

  /**
   * Starts a timer for measuring execution time
   * @param label The label for the timer
   */
  startTimer(label: string): void {
    this.timers.set(label, Date.now());
  }

  /**
   * Ends a timer and returns the elapsed time in milliseconds
   * @param label The label for the timer
   * @returns The elapsed time in milliseconds
   */
  endTimer(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      this.warn(`Timer '${label}' not found`);
      return 0;
    }

    const endTime = Date.now();
    const elapsed = endTime - startTime;
    this.timers.delete(label);
    return elapsed;
  }

  /**
   * Gets all log entries
   * @returns The log entries
   */
  getEntries(): LogEntry[] {
    return [...this.entries];
  }

  /**
   * Converts the log entries to a format suitable for storing in the database
   * @param executionId The ID of the rule execution
   * @returns The log entries formatted for database storage
   */
  toDbFormat(executionId: string): Array<{
    executionId: string;
    timestamp: number;
    level: string;
    message: string;
    data?: string;
    component: string;
    componentId?: string;
  }> {
    return this.entries.map((entry) => ({
      executionId,
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      data: entry.data ? JSON.stringify(entry.data) : undefined,
      component: (entry.data?.component as string) || "unknown",
      componentId: entry.data?.componentId as string,
    }));
  }

  /**
   * Gets the entries as a string
   * @returns The log entries as a string
   */
  toString(): string {
    return this.entries
      .map((entry) => {
        const timestamp = new Date(entry.timestamp).toISOString();
        let message = `[${timestamp}] [${entry.level.toUpperCase()}] ${entry.message}`;
        if (entry.error) {
          message += `\nError: ${entry.error.message}`;
          if (entry.error.stack) {
            message += `\nStack: ${entry.error.stack}`;
          }
        }
        if (entry.data) {
          message += `\nData: ${JSON.stringify(entry.data, null, 2)}`;
        }
        return message;
      })
      .join("\n");
  }

  /**
   * Logs a message with the specified level
   * @param level The log level
   * @param message The message to log
   * @param data Additional data for the log entry
   * @param error The error object (for error logs)
   */
  private log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
    error?: Error,
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      data,
      error,
    };
    this.entries.push(entry);

    // Log to console in development
    if (process.env.NODE_ENV !== "production") {
      const prefix = `[${level.toUpperCase()}]`;
      if (level === "error") {
        console.error(prefix, message, error, data);
      } else if (level === "warn") {
        console.warn(prefix, message, data);
      } else {
        console.log(prefix, message, data);
      }
    }
  }
}
