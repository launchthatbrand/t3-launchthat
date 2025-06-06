/**
 * Error Handling System for Scenario Executions
 *
 * This file provides functions for classifying errors, determining recovery actions,
 * and managing error handling in scenario executions.
 */

import { v } from "convex/values";

import { internalAction } from "../../_generated/server";
import {
  classifyError as baseClassifyError,
  ErrorCategory,
  ErrorClassification,
  ErrorPersistence,
  ErrorSeverity,
} from "../lib/errorHandling";

// Action types for error recovery
export type RecoveryAction = "retry" | "skip" | "abort" | "fallback" | "notify";

// Context for error handling
export interface ErrorHandlingContext {
  isEssentialNode?: boolean;
  [key: string]: any;
}

/**
 * Action to classify an error and determine appropriate handling
 */
export const classifyError = internalAction({
  args: {
    error: v.union(v.string(), v.object({})),
  },
  returns: v.object({
    category: v.string(),
    severity: v.string(),
    persistence: v.string(),
    retryable: v.boolean(),
    message: v.string(),
    details: v.optional(v.object({})),
  }),
  handler: async (ctx, args) => {
    let errorObj: unknown;

    // Convert error to appropriate format
    if (typeof args.error === "string") {
      errorObj = new Error(args.error);
    } else {
      errorObj = args.error;
    }

    // Classify the error
    return baseClassifyError(errorObj);
  },
});

/**
 * Get recommended recovery action for an error
 */
export const getRecoveryAction = internalAction({
  args: {
    errorClassification: v.object({
      category: v.string(),
      severity: v.string(),
      persistence: v.string(),
      retryable: v.boolean(),
      message: v.string(),
      details: v.optional(v.object({})),
    }),
    retryAttempt: v.number(),
    nodeType: v.optional(v.string()),
    context: v.optional(v.object({})),
  },
  returns: v.object({
    action: v.union(
      v.literal("retry"),
      v.literal("skip"),
      v.literal("abort"),
      v.literal("fallback"),
      v.literal("notify"),
    ),
    delay: v.optional(v.number()),
    reason: v.string(),
    fallbackValue: v.optional(v.any()),
  }),
  handler: async (ctx, args) => {
    // Determine the appropriate recovery action based on error classification
    const { category, severity, persistence, retryable } =
      args.errorClassification;

    // Get retry attempt
    const retryAttempt = args.retryAttempt;
    const maxRetries = 3; // This could be configurable in the future

    // Convert context to typed interface
    const context: ErrorHandlingContext = args.context || {};

    // For network/timeout errors that are temporary, retry with backoff
    if (
      retryable &&
      (category === ErrorCategory.NETWORK ||
        category === ErrorCategory.TIMEOUT ||
        category === ErrorCategory.SERVER) &&
      persistence === ErrorPersistence.TEMPORARY &&
      retryAttempt < maxRetries
    ) {
      // Calculate exponential backoff
      const delay = Math.min(Math.pow(2, retryAttempt) * 1000, 30000);
      return {
        action: "retry" as RecoveryAction,
        delay,
        reason: `${category} error is temporary and retryable, attempt ${retryAttempt + 1}/${maxRetries}`,
      };
    }

    // For validation errors, we can't retry as the input won't change
    if (category === ErrorCategory.VALIDATION) {
      return {
        action: "abort" as RecoveryAction,
        reason:
          "Validation error indicates a problem with the input data that won't resolve with retries",
      };
    }

    // For authorization errors, we need to notify and abort
    if (category === ErrorCategory.AUTHORIZATION) {
      return {
        action: "notify" as RecoveryAction,
        reason:
          "Authorization error requires manual intervention to fix credentials or permissions",
      };
    }

    // For rate limiting (usually falls under CLIENT category with specific error codes)
    if (
      category === ErrorCategory.CLIENT &&
      args.errorClassification.details &&
      "status" in args.errorClassification.details &&
      args.errorClassification.details.status === 429
    ) {
      // For rate limiting, use a longer backoff
      const delay = Math.min(Math.pow(2, retryAttempt + 2) * 1000, 60000);
      return {
        action: "retry" as RecoveryAction,
        delay,
        reason: "Rate limit encountered, using longer backoff",
      };
    }

    // For permanent errors that aren't going to resolve
    if (persistence === ErrorPersistence.PERMANENT) {
      // For transformers and some conditions, we might have fallback values
      if (args.nodeType === "transformer" || args.nodeType === "condition") {
        return {
          action: "fallback" as RecoveryAction,
          reason:
            "Using fallback value for permanent error in transformer/condition",
          fallbackValue: args.nodeType === "transformer" ? {} : false,
        };
      }

      // For critical errors, abort the execution
      if (
        severity === ErrorSeverity.CRITICAL ||
        severity === ErrorSeverity.HIGH
      ) {
        return {
          action: "abort" as RecoveryAction,
          reason: `${severity} severity error requires aborting execution`,
        };
      }

      // For other permanent errors, we might be able to skip non-essential nodes
      if (context.isEssentialNode !== true) {
        return {
          action: "skip" as RecoveryAction,
          reason: "Non-essential node with permanent error can be skipped",
        };
      }
    }

    // For intermittent errors with retry attempts left
    if (
      persistence === ErrorPersistence.INTERMITTENT &&
      retryable &&
      retryAttempt < maxRetries
    ) {
      // Calculate progressive backoff
      const delay = Math.min(1000 + retryAttempt * 2000, 15000);
      return {
        action: "retry" as RecoveryAction,
        delay,
        reason: `Intermittent error, retry with ${delay}ms delay, attempt ${retryAttempt + 1}/${maxRetries}`,
      };
    }

    // Default fallback for cases not specifically handled
    if (retryAttempt < maxRetries && retryable) {
      return {
        action: "retry" as RecoveryAction,
        delay: 5000,
        reason: "Generic retry for retryable error",
      };
    }

    // If we've exhausted retries or no specific handling matches
    return {
      action: "abort" as RecoveryAction,
      reason: "Max retries reached or no recovery action available",
    };
  },
});

/**
 * Format an error for user display
 */
export const formatErrorForDisplay = internalAction({
  args: {
    error: v.any(),
    errorClassification: v.optional(
      v.object({
        category: v.string(),
        severity: v.string(),
        persistence: v.string(),
        retryable: v.boolean(),
        message: v.string(),
        details: v.optional(v.object({})),
      }),
    ),
    context: v.optional(v.object({})),
  },
  returns: v.object({
    title: v.string(),
    message: v.string(),
    details: v.optional(v.string()),
    suggestions: v.optional(v.array(v.string())),
    documentationLinks: v.optional(
      v.array(
        v.object({
          title: v.string(),
          url: v.string(),
        }),
      ),
    ),
  }),
  handler: async (ctx, args) => {
    // Extract error message
    const errorMessage =
      typeof args.error === "string"
        ? args.error
        : args.error instanceof Error
          ? args.error.message
          : JSON.stringify(args.error);

    // If we have a classification, use it for better error formatting
    if (args.errorClassification) {
      const { category, severity, message } = args.errorClassification;

      // Format based on error category
      switch (category) {
        case ErrorCategory.NETWORK:
          return {
            title: "Network Error",
            message: "There was a problem connecting to the service.",
            details: message,
            suggestions: [
              "Check your internet connection",
              "Verify the service endpoint is correct",
              "Check if the service is currently experiencing downtime",
            ],
          };

        case ErrorCategory.SERVER:
          return {
            title: "Server Error",
            message: "The external service encountered an error.",
            details: message,
            suggestions: [
              "Try again later",
              "Check the service status page for any reported issues",
            ],
          };

        case ErrorCategory.AUTHORIZATION:
          return {
            title: "Authorization Error",
            message: "Unable to authenticate with the service.",
            details: message,
            suggestions: [
              "Check your API credentials",
              "Verify your account has the necessary permissions",
              "Your token may have expired, try reconnecting the integration",
            ],
          };

        case ErrorCategory.VALIDATION:
          return {
            title: "Data Validation Error",
            message: "The data format or values are incorrect.",
            details: message,
            suggestions: [
              "Check the input data format",
              "Verify required fields are provided",
              "Check for proper data types in your inputs",
            ],
          };

        case ErrorCategory.TIMEOUT:
          return {
            title: "Request Timeout",
            message: "The request took too long to complete.",
            details: message,
            suggestions: [
              "Try again later when the service might be less busy",
              "Check if your request is too complex or large",
            ],
          };

        default:
          return {
            title:
              severity === ErrorSeverity.CRITICAL
                ? "Critical Error"
                : severity === ErrorSeverity.HIGH
                  ? "Serious Error"
                  : "Error",
            message: "An error occurred during execution.",
            details: message,
            suggestions: [
              "Check the node configuration",
              "Verify input data is correct",
              "Try running the scenario again",
            ],
          };
      }
    }

    // Default formatting if we don't have a classification
    return {
      title: "Execution Error",
      message: "An error occurred during scenario execution.",
      details: errorMessage,
      suggestions: [
        "Check the node configuration",
        "Verify all connections are properly set up",
        "Try running the scenario again",
      ],
    };
  },
});
