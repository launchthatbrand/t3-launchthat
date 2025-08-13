"use node";

/**
 * Query Analyzer utility
 *
 * Provides functions for measuring and analyzing query performance
 */
import { v } from "convex/values";

import { internalAction } from "../_generated/server";

type QueryContext = {
  db: any;
  auth: any;
  scheduler: any;
  storage: any;
};

/**
 * Runs a performance analysis on queries and logs the results
 */
export const analyzeQueryPerformance = internalAction({
  args: {
    moduleName: v.optional(v.string()),
    outputFile: v.optional(v.string()),
  },
  returns: v.string(),
  handler: async (ctx, args) => {
    const startTime = Date.now();
    const outputFile = args.outputFile ?? "query_performance_analysis.json";
    const moduleName = args.moduleName ?? null;

    console.log(
      `Starting query performance analysis${moduleName ? ` for module: ${moduleName}` : ""}`,
    );

    try {
      // Query performance data will be stored here
      const performanceData = await collectPerformanceData(moduleName);

      console.log("Query performance analysis complete");

      // Calculate execution time
      const executionTime = Date.now() - startTime;
      console.log(`Analysis took ${executionTime}ms`);

      // Return a summary of the analysis
      return JSON.stringify({
        message: "Query performance analysis complete",
        executionTime,
        outputFile,
        queriesAnalyzed: performanceData.summary.totalQueries,
      });
    } catch (error) {
      console.error("Error during query performance analysis:", error);
      throw error;
    }
  },
});

/**
 * Helper function to collect performance data
 */
async function collectPerformanceData(moduleName: string | null) {
  // In a real implementation, this would analyze real queries
  // For now, return mock data
  return {
    timestamp: new Date().toISOString(),
    module: moduleName,
    queries: [],
    slowestQueries: [],
    summary: {
      totalQueries: 0,
      avgExecutionTime: 0,
      maxExecutionTime: 0,
    },
  };
}

/**
 * Measure the execution time of a query
 *
 * Utility function to be used in queries to measure performance
 */
export async function measureQueryPerformance<T>(
  name: string,
  queryFn: () => Promise<T>,
): Promise<{ result: T; executionTime: number }> {
  const startTime = Date.now();

  try {
    const result = await queryFn();
    const executionTime = Date.now() - startTime;

    // Log the performance data
    console.log(`Query '${name}' execution time: ${executionTime}ms`);

    return { result, executionTime };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.error(`Query '${name}' failed after ${executionTime}ms:`, error);
    throw error;
  }
}

/**
 * A decorator function to wrap query handlers for performance measurement
 * To be used in development/testing
 */
export function withPerformanceTracking<T, A>(
  name: string,
  handler: (ctx: QueryContext, args: A) => Promise<T>,
): (ctx: QueryContext, args: A) => Promise<T> {
  return async (ctx: QueryContext, args: A) => {
    const startTime = Date.now();

    try {
      const result = await handler(ctx, args);
      const executionTime = Date.now() - startTime;

      // Log the performance data
      console.log(`Handler '${name}' execution time: ${executionTime}ms`);

      return result;
    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error(
        `Handler '${name}' failed after ${executionTime}ms:`,
        error,
      );
      throw error;
    }
  };
}
