# Phase 4: Advanced Features - Scenario Builder

## Product Requirements Document (PRD)

### Version: 1.0

### Date: January 16, 2025

### Phase: 4 - Advanced Features

### Duration: Weeks 11-14

---

## Executive Summary

Phase 4 focuses on implementing advanced features that transform the Scenario Builder from a basic automation platform into a production-ready system. This phase will implement the scenario execution engine, comprehensive error handling and retry logic, advanced monitoring and logging, and enhanced dynamic field features. The goal is to have a robust, scalable automation platform that can handle complex production workloads.

## Success Criteria

**Phase 4 is complete when:**

- ✅ Scenario execution engine is fully functional
- ✅ Comprehensive error handling and retry logic is implemented
- ✅ Advanced monitoring and logging system is operational
- ✅ Enhanced dynamic field features are working
- ✅ `pnpm build` runs successfully with no errors
- ✅ Production-ready automation platform is demonstrated

---

## Technical Requirements

### 1. Scenario Execution Engine

#### **Core Execution Architecture**

```typescript
// packages/scenario-builder-core/src/execution/engine.ts
export interface ExecutionEngine {
  executeScenario(
    scenarioId: string,
    triggerData?: any,
  ): Promise<ExecutionResult>;
  executeNode(
    nodeId: string,
    context: ExecutionContext,
  ): Promise<NodeExecutionResult>;
  pauseExecution(executionId: string): Promise<void>;
  resumeExecution(executionId: string): Promise<void>;
  cancelExecution(executionId: string): Promise<void>;
}

export class ProductionExecutionEngine implements ExecutionEngine {
  private activeExecutions: Map<string, ExecutionState> = new Map();
  private nodeExecutors: Map<string, NodeExecutor> = new Map();
  private retryManager: RetryManager;
  private errorHandler: ErrorHandler;
  private metricsCollector: MetricsCollector;

  constructor(
    retryManager: RetryManager,
    errorHandler: ErrorHandler,
    metricsCollector: MetricsCollector,
  ) {
    this.retryManager = retryManager;
    this.errorHandler = errorHandler;
    this.metricsCollector = metricsCollector;
  }

  async executeScenario(
    scenarioId: string,
    triggerData?: any,
  ): Promise<ExecutionResult> {
    const executionId = generateExecutionId();
    const startTime = Date.now();

    try {
      // Initialize execution state
      const executionState: ExecutionState = {
        id: executionId,
        scenarioId,
        status: "running",
        startTime,
        currentNode: null,
        completedNodes: [],
        failedNodes: [],
        context: { triggerData, executionId },
        metrics: {},
      };

      this.activeExecutions.set(executionId, executionState);

      // Load scenario definition
      const scenario = await this.loadScenario(scenarioId);
      if (!scenario) {
        throw new Error(`Scenario ${scenarioId} not found`);
      }

      // Execute nodes in topological order
      const executionOrder = this.calculateExecutionOrder(
        scenario.nodes,
        scenario.connections,
      );

      for (const nodeId of executionOrder) {
        const node = scenario.nodes.find((n) => n.id === nodeId);
        if (!node) continue;

        executionState.currentNode = nodeId;

        try {
          const result = await this.executeNode(nodeId, {
            executionId,
            scenarioId,
            nodeId,
            input: this.buildNodeInput(node, executionState),
            settings: node.configuration,
            connection: await this.getNodeConnection(node),
          });

          if (result.success) {
            executionState.completedNodes.push({
              nodeId,
              result,
              timestamp: Date.now(),
            });
            executionState.context[nodeId] = result.output;
          } else {
            executionState.failedNodes.push({
              nodeId,
              error: result.error,
              timestamp: Date.now(),
            });

            // Handle node failure based on retry policy
            const shouldRetry = await this.retryManager.shouldRetry(
              executionId,
              nodeId,
              result.error,
            );
            if (shouldRetry) {
              // Add to retry queue
              await this.retryManager.scheduleRetry(executionId, nodeId);
            }
          }

          // Update metrics
          this.metricsCollector.recordNodeExecution(nodeId, result);
        } catch (error) {
          const errorResult = await this.errorHandler.handleNodeError(
            error,
            executionId,
            nodeId,
          );
          executionState.failedNodes.push({
            nodeId,
            error: errorResult,
            timestamp: Date.now(),
          });
        }
      }

      // Determine final execution status
      const finalStatus =
        executionState.failedNodes.length === 0 ? "completed" : "failed";

      const executionResult: ExecutionResult = {
        id: executionId,
        scenarioId,
        status: finalStatus,
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        completedNodes: executionState.completedNodes.length,
        failedNodes: executionState.failedNodes.length,
        totalNodes: executionOrder.length,
        context: executionState.context,
      };

      // Clean up execution state
      this.activeExecutions.delete(executionId);

      // Record final metrics
      this.metricsCollector.recordScenarioExecution(executionResult);

      return executionResult;
    } catch (error) {
      const errorResult = await this.errorHandler.handleScenarioError(
        error,
        executionId,
      );

      // Clean up execution state
      this.activeExecutions.delete(executionId);

      return {
        id: executionId,
        scenarioId,
        status: "failed",
        startTime,
        endTime: Date.now(),
        duration: Date.now() - startTime,
        completedNodes: 0,
        failedNodes: 0,
        totalNodes: 0,
        error: errorResult,
      };
    }
  }

  private calculateExecutionOrder(nodes: any[], connections: any[]): string[] {
    // Implement topological sort for dependency-based execution
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    // Initialize graph and in-degree
    nodes.forEach((node) => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });

    // Build dependency graph
    connections.forEach((conn) => {
      const from = conn.fromNodeId;
      const to = conn.toNodeId;

      if (graph.has(from) && graph.has(to)) {
        graph.get(from)!.push(to);
        inDegree.set(to, (inDegree.get(to) || 0) + 1);
      }
    });

    // Topological sort
    const queue: string[] = [];
    const result: string[] = [];

    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      result.push(current);

      graph.get(current)!.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 1) - 1;
        inDegree.set(neighbor, newDegree);

        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });
    }

    return result;
  }
}
```

#### **Node Execution System**

```typescript
// packages/scenario-builder-core/src/execution/nodeExecutor.ts
export interface NodeExecutor {
  execute(node: any, context: ExecutionContext): Promise<NodeExecutionResult>;
  validate(node: any): ValidationResult;
  getCapabilities(): NodeCapabilities;
}

export class IntegrationNodeExecutor implements NodeExecutor {
  private integrationRegistry: IntegrationRegistry;
  private connectionManager: ConnectionManager;

  constructor(
    integrationRegistry: IntegrationRegistry,
    connectionManager: ConnectionManager,
  ) {
    this.integrationRegistry = integrationRegistry;
    this.connectionManager = connectionManager;
  }

  async execute(
    node: any,
    context: ExecutionContext,
  ): Promise<NodeExecutionResult> {
    const startTime = Date.now();

    try {
      // Get integration manifest
      const integration = this.integrationRegistry.get(node.integrationId);
      if (!integration) {
        throw new Error(`Integration ${node.integrationId} not found`);
      }

      // Get action definition
      const action = integration.actions[node.actionId];
      if (!action) {
        throw new Error(
          `Action ${node.actionId} not found in ${node.integrationId}`,
        );
      }

      // Get connection
      const connection = await this.connectionManager.getConnection(
        node.connectionId,
      );
      if (!connection) {
        throw new Error(`Connection ${node.connectionId} not found`);
      }

      // Execute action
      const result = await action.execute({
        input: context.input,
        settings: node.configuration,
        connection: connection.credentials,
        context: {
          executionId: context.executionId,
          scenarioId: context.scenarioId,
          nodeId: context.nodeId,
        },
      });

      return {
        success: true,
        output: result,
        duration: Date.now() - startTime,
        metadata: {
          integrationId: node.integrationId,
          actionId: node.actionId,
          connectionId: node.connectionId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        duration: Date.now() - startTime,
        metadata: {
          integrationId: node.integrationId,
          actionId: node.actionId,
          connectionId: node.connectionId,
        },
      };
    }
  }

  validate(node: any): ValidationResult {
    const errors: string[] = [];

    if (!node.integrationId) {
      errors.push("Integration ID is required");
    }

    if (!node.actionId) {
      errors.push("Action ID is required");
    }

    if (!node.connectionId) {
      errors.push("Connection ID is required");
    }

    // Validate integration exists
    const integration = this.integrationRegistry.get(node.integrationId);
    if (!integration) {
      errors.push(`Integration ${node.integrationId} not found`);
    } else {
      // Validate action exists
      const action = integration.actions[node.actionId];
      if (!action) {
        errors.push(
          `Action ${node.actionId} not found in ${node.integrationId}`,
        );
      } else {
        // Validate configuration against action schema
        const configValidation = this.validateConfiguration(
          action,
          node.configuration,
        );
        errors.push(...configValidation.errors);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateConfiguration(
    action: any,
    configuration: any,
  ): ValidationResult {
    try {
      // Validate against action's config schema
      if (action.configSchema && action.configSchema.settings) {
        action.configSchema.settings.parse(configuration);
      }
      return { valid: true, errors: [] };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          valid: false,
          errors: error.errors.map((e) => `${e.path.join(".")}: ${e.message}`),
        };
      }
      return {
        valid: false,
        errors: ["Configuration validation failed"],
      };
    }
  }
}
```

### 2. Advanced Error Handling & Retry Logic

#### **Comprehensive Error Handling System**

```typescript
// packages/scenario-builder-core/src/error/errorHandler.ts
export interface ErrorContext {
  executionId: string;
  scenarioId: string;
  nodeId?: string;
  integrationId?: string;
  actionId?: string;
  connectionId?: string;
  timestamp: number;
  attempt: number;
  maxAttempts: number;
}

export class ErrorHandler {
  private errorTypes: Map<string, ErrorType> = new Map();
  private retryPolicies: Map<string, RetryPolicy> = new Map();
  private errorNotifier: ErrorNotifier;

  constructor(errorNotifier: ErrorNotifier) {
    this.errorNotifier = errorNotifier;
    this.initializeErrorTypes();
    this.initializeRetryPolicies();
  }

  async handleNodeError(
    error: Error,
    context: ErrorContext,
  ): Promise<ErrorResult> {
    const errorType = this.classifyError(error);
    const retryPolicy = this.getRetryPolicy(errorType);

    const errorResult: ErrorResult = {
      type: errorType,
      message: error.message,
      context,
      retryable: retryPolicy.retryable,
      retryAfter: retryPolicy.retryAfter,
      maxRetries: retryPolicy.maxRetries,
      timestamp: Date.now(),
    };

    // Log error
    await this.logError(errorResult);

    // Notify if critical
    if (errorType.severity === "critical") {
      await this.errorNotifier.notify(errorResult);
    }

    return errorResult;
  }

  async handleScenarioError(
    error: Error,
    context: ErrorContext,
  ): Promise<ErrorResult> {
    const errorType = this.classifyError(error);

    const errorResult: ErrorResult = {
      type: errorType,
      message: error.message,
      context,
      retryable: false, // Scenario-level errors are not retryable
      timestamp: Date.now(),
    };

    // Log error
    await this.logError(errorResult);

    // Always notify for scenario errors
    await this.errorNotifier.notify(errorResult);

    return errorResult;
  }

  private classifyError(error: Error): ErrorType {
    // Classify errors based on message, type, and context
    const message = error.message.toLowerCase();

    if (message.includes("rate limit") || message.includes("429")) {
      return this.errorTypes.get("rate_limited")!;
    }

    if (message.includes("unauthorized") || message.includes("401")) {
      return this.errorTypes.get("authentication_failed")!;
    }

    if (message.includes("not found") || message.includes("404")) {
      return this.errorTypes.get("resource_not_found")!;
    }

    if (message.includes("timeout") || message.includes("timed out")) {
      return this.errorTypes.get("timeout")!;
    }

    if (message.includes("network") || message.includes("connection")) {
      return this.errorTypes.get("network_error")!;
    }

    // Default to generic error
    return this.errorTypes.get("generic_error")!;
  }

  private initializeErrorTypes(): void {
    this.errorTypes.set("rate_limited", {
      id: "rate_limited",
      name: "Rate Limited",
      description: "API rate limit exceeded",
      severity: "warning",
      category: "external",
      retryable: true,
      defaultRetryAfter: 60000, // 1 minute
    });

    this.errorTypes.set("authentication_failed", {
      id: "authentication_failed",
      name: "Authentication Failed",
      description: "Invalid or expired credentials",
      severity: "high",
      category: "security",
      retryable: false,
      requiresAction: "update_credentials",
    });

    this.errorTypes.set("resource_not_found", {
      id: "resource_not_found",
      name: "Resource Not Found",
      description: "Requested resource does not exist",
      severity: "medium",
      category: "data",
      retryable: false,
      requiresAction: "verify_resource",
    });

    this.errorTypes.set("timeout", {
      id: "timeout",
      name: "Request Timeout",
      description: "Request timed out",
      severity: "medium",
      category: "performance",
      retryable: true,
      defaultRetryAfter: 5000, // 5 seconds
    });

    this.errorTypes.set("network_error", {
      id: "network_error",
      name: "Network Error",
      description: "Network connectivity issue",
      severity: "medium",
      category: "infrastructure",
      retryable: true,
      defaultRetryAfter: 10000, // 10 seconds
    });

    this.errorTypes.set("generic_error", {
      id: "generic_error",
      name: "Generic Error",
      description: "An unexpected error occurred",
      severity: "medium",
      category: "unknown",
      retryable: true,
      defaultRetryAfter: 30000, // 30 seconds
    });
  }
}
```

#### **Advanced Retry Logic**

```typescript
// packages/scenario-builder-core/src/retry/retryManager.ts
export interface RetryPolicy {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  jitter: boolean;
  retryableErrors: string[];
  nonRetryableErrors: string[];
}

export class RetryManager {
  private retryPolicies: Map<string, RetryPolicy> = new Map();
  private retryQueue: Map<string, RetryEntry[]> = new Map();
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor() {
    this.initializeDefaultPolicies();
  }

  async shouldRetry(
    executionId: string,
    nodeId: string,
    error: any,
  ): Promise<boolean> {
    const context = `${executionId}:${nodeId}`;
    const policy = this.getRetryPolicy(context);

    if (!policy) return false;

    // Check if error is retryable
    if (!this.isErrorRetryable(error, policy)) {
      return false;
    }

    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(context);
    if (circuitBreaker.isOpen()) {
      return false;
    }

    // Check retry attempts
    const attempts = this.getRetryAttempts(context);
    if (attempts >= policy.maxAttempts) {
      return false;
    }

    return true;
  }

  async scheduleRetry(executionId: string, nodeId: string): Promise<void> {
    const context = `${executionId}:${nodeId}`;
    const policy = this.getRetryPolicy(context);

    if (!policy) return;

    const attempts = this.getRetryAttempts(context);
    const delay = this.calculateRetryDelay(attempts, policy);

    const retryEntry: RetryEntry = {
      executionId,
      nodeId,
      attempts: attempts + 1,
      scheduledAt: Date.now(),
      executeAt: Date.now() + delay,
    };

    if (!this.retryQueue.has(context)) {
      this.retryQueue.set(context, []);
    }

    this.retryQueue.get(context)!.push(retryEntry);

    // Schedule retry execution
    setTimeout(() => {
      this.executeRetry(retryEntry);
    }, delay);
  }

  private calculateRetryDelay(attempts: number, policy: RetryPolicy): number {
    let delay =
      policy.baseDelay * Math.pow(policy.backoffMultiplier, attempts - 1);

    // Add jitter if enabled
    if (policy.jitter) {
      const jitter = Math.random() * 0.1 * delay; // 10% jitter
      delay += jitter;
    }

    // Cap at max delay
    return Math.min(delay, policy.maxDelay);
  }

  private async executeRetry(retryEntry: RetryEntry): Promise<void> {
    try {
      // Re-execute the failed node
      // This will be implemented with the execution engine
      console.log(
        `Retrying node ${retryEntry.nodeId} (attempt ${retryEntry.attempts})`,
      );

      // Remove from retry queue
      const context = `${retryEntry.executionId}:${retryEntry.nodeId}`;
      const queue = this.retryQueue.get(context);
      if (queue) {
        const index = queue.findIndex(
          (entry) =>
            entry.executionId === retryEntry.executionId &&
            entry.nodeId === retryEntry.nodeId,
        );
        if (index !== -1) {
          queue.splice(index, 1);
        }
      }
    } catch (error) {
      console.error(`Retry execution failed for ${retryEntry.nodeId}:`, error);

      // If retry fails, check if we should try again
      if (retryEntry.attempts < this.getRetryPolicy(context)?.maxAttempts) {
        await this.scheduleRetry(retryEntry.executionId, retryEntry.nodeId);
      }
    }
  }
}
```

### 3. Advanced Monitoring & Logging

#### **Comprehensive Metrics Collection**

```typescript
// packages/scenario-builder-core/src/monitoring/metricsCollector.ts
export interface MetricsData {
  timestamp: number;
  type: "scenario" | "node" | "integration" | "system";
  id: string;
  data: Record<string, any>;
}

export class MetricsCollector {
  private metrics: MetricsData[] = [];
  private aggregators: Map<string, MetricsAggregator> = new Map();
  private exporters: MetricsExporter[] = [];

  constructor(exporters: MetricsExporter[] = []) {
    this.exporters = exporters;
    this.initializeAggregators();
  }

  recordScenarioExecution(execution: ExecutionResult): void {
    const metric: MetricsData = {
      timestamp: Date.now(),
      type: "scenario",
      id: execution.id,
      data: {
        scenarioId: execution.scenarioId,
        status: execution.status,
        duration: execution.duration,
        completedNodes: execution.completedNodes,
        failedNodes: execution.failedNodes,
        totalNodes: execution.totalNodes,
        success: execution.status === "completed",
      },
    };

    this.metrics.push(metric);
    this.updateAggregators(metric);
    this.exportMetrics(metric);
  }

  recordNodeExecution(nodeId: string, result: NodeExecutionResult): void {
    const metric: MetricsData = {
      timestamp: Date.now(),
      type: "node",
      id: nodeId,
      data: {
        success: result.success,
        duration: result.duration,
        error: result.error,
        metadata: result.metadata,
      },
    };

    this.metrics.push(metric);
    this.updateAggregators(metric);
    this.exportMetrics(metric);
  }

  recordIntegrationMetrics(
    integrationId: string,
    data: Record<string, any>,
  ): void {
    const metric: MetricsData = {
      timestamp: Date.now(),
      type: "integration",
      id: integrationId,
      data,
    };

    this.metrics.push(metric);
    this.updateAggregators(metric);
    this.exportMetrics(metric);
  }

  getMetrics(
    type?: string,
    timeRange?: { start: number; end: number },
  ): MetricsData[] {
    let filtered = this.metrics;

    if (type) {
      filtered = filtered.filter((m) => m.type === type);
    }

    if (timeRange) {
      filtered = filtered.filter(
        (m) => m.timestamp >= timeRange.start && m.timestamp <= timeRange.end,
      );
    }

    return filtered;
  }

  getAggregatedMetrics(type: string, aggregation: string): any {
    const aggregator = this.aggregators.get(`${type}_${aggregation}`);
    return aggregator ? aggregator.getResult() : null;
  }

  private updateAggregators(metric: MetricsData): void {
    this.aggregators.forEach((aggregator) => {
      aggregator.update(metric);
    });
  }

  private async exportMetrics(metric: MetricsData): Promise<void> {
    for (const exporter of this.exporters) {
      try {
        await exporter.export(metric);
      } catch (error) {
        console.error(
          `Failed to export metrics via ${exporter.constructor.name}:`,
          error,
        );
      }
    }
  }

  private initializeAggregators(): void {
    // Success rate aggregator
    this.aggregators.set(
      "scenario_success_rate",
      new SuccessRateAggregator("scenario"),
    );
    this.aggregators.set(
      "node_success_rate",
      new SuccessRateAggregator("node"),
    );

    // Performance aggregator
    this.aggregators.set(
      "scenario_performance",
      new PerformanceAggregator("scenario"),
    );
    this.aggregators.set("node_performance", new PerformanceAggregator("node"));

    // Error aggregator
    this.aggregators.set("error_summary", new ErrorSummaryAggregator());
  }
}
```

#### **Advanced Logging System**

```typescript
// packages/scenario-builder-core/src/logging/logger.ts
export interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error" | "critical";
  category: "execution" | "integration" | "system" | "security" | "performance";
  message: string;
  context: Record<string, any>;
  traceId?: string;
  spanId?: string;
}

export class Logger {
  private appenders: LogAppender[] = [];
  private filters: LogFilter[] = [];
  private formatters: LogFormatter[] = [];

  constructor(appenders: LogAppender[] = []) {
    this.appenders = appenders;
    this.initializeDefaultAppenders();
  }

  log(
    level: LogEntry["level"],
    category: LogEntry["category"],
    message: string,
    context: Record<string, any> = {},
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      category,
      message,
      context,
      traceId: this.getCurrentTraceId(),
      spanId: this.getCurrentSpanId(),
    };

    // Apply filters
    if (this.shouldLog(entry)) {
      // Apply formatters
      const formattedEntry = this.formatLogEntry(entry);

      // Send to appenders
      this.appenders.forEach((appender) => {
        try {
          appender.append(formattedEntry);
        } catch (error) {
          console.error(
            `Failed to append log via ${appender.constructor.name}:`,
            error,
          );
        }
      });
    }
  }

  debug(
    category: LogEntry["category"],
    message: string,
    context?: Record<string, any>,
  ): void {
    this.log("debug", category, message, context);
  }

  info(
    category: LogEntry["category"],
    message: string,
    context?: Record<string, any>,
  ): void {
    this.log("info", category, message, context);
  }

  warn(
    category: LogEntry["category"],
    message: string,
    context?: Record<string, any>,
  ): void {
    this.log("warn", category, message, context);
  }

  error(
    category: LogEntry["category"],
    message: string,
    context?: Record<string, any>,
  ): void {
    this.log("error", category, message, context);
  }

  critical(
    category: LogEntry["category"],
    message: string,
    context?: Record<string, any>,
  ): void {
    this.log("critical", category, message, context);
  }

  private shouldLog(entry: LogEntry): boolean {
    return this.filters.every((filter) => filter.shouldLog(entry));
  }

  private formatLogEntry(entry: LogEntry): LogEntry {
    let formatted = entry;
    this.formatters.forEach((formatter) => {
      formatted = formatter.format(formatted);
    });
    return formatted;
  }

  private getCurrentTraceId(): string | undefined {
    // Get from async context or request headers
    return undefined;
  }

  private getCurrentSpanId(): string | undefined {
    // Get from async context or request headers
    return undefined;
  }

  private initializeDefaultAppenders(): void {
    if (this.appenders.length === 0) {
      this.appenders.push(new ConsoleAppender());
      this.appenders.push(new FileAppender());
    }
  }
}
```

### 4. Enhanced Dynamic Field Features

#### **Advanced Dynamic Field System**

```typescript
// packages/scenario-builder-core/src/dynamicFields/dynamicFieldManager.ts
export interface DynamicFieldConfig {
  fieldName: string;
  type:
    | "select"
    | "multi-select"
    | "input"
    | "textarea"
    | "date"
    | "datetime"
    | "number"
    | "boolean";
  label: string;
  description: string;
  required?: boolean;
  defaultValue?: any;
  validation?: ValidationRule[];
  fetchOptions?: {
    action: string;
    dependsOn: string[];
    cacheTimeout: number;
    transform?: (data: any[]) => Array<{ label: string; value: any }>;
    allowCustom?: boolean;
    customValidator?: (value: any) => boolean;
  };
  ui?: {
    placeholder?: string;
    helpText?: string;
    width?: string;
    height?: string;
    rows?: number;
    min?: number;
    max?: number;
    step?: number;
    format?: string;
  };
}

export class DynamicFieldManager {
  private fieldCache: Map<string, CachedFieldData> = new Map();
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private fieldValidators: Map<string, FieldValidator> = new Map();

  async getFieldOptions(
    integrationId: string,
    actionId: string,
    fieldName: string,
    connectionId: string,
    dependencyValues: Record<string, any> = {},
  ): Promise<DynamicFieldOptions> {
    const cacheKey = this.generateCacheKey(
      integrationId,
      actionId,
      fieldName,
      connectionId,
      dependencyValues,
    );

    // Check cache first
    const cached = this.fieldCache.get(cacheKey);
    if (cached && !this.isCacheExpired(cached)) {
      return cached.data;
    }

    // Fetch fresh data
    const options = await this.fetchFieldOptions(
      integrationId,
      actionId,
      fieldName,
      connectionId,
      dependencyValues,
    );

    // Cache the result
    this.fieldCache.set(cacheKey, {
      data: options,
      timestamp: Date.now(),
      ttl: this.getFieldCacheTTL(integrationId, actionId, fieldName),
    });

    return options;
  }

  async validateFieldValue(
    fieldConfig: DynamicFieldConfig,
    value: any,
    context: Record<string, any> = {},
  ): Promise<ValidationResult> {
    const validator = this.getFieldValidator(fieldConfig);
    return await validator.validate(value, context);
  }

  async processFieldDependencies(
    fields: DynamicFieldConfig[],
    values: Record<string, any>,
  ): Promise<ProcessedDependencies> {
    const processed: ProcessedDependencies = {
      resolved: new Set<string>(),
      unresolved: new Set<string>(),
      circular: new Set<string>(),
    };

    // Build dependency graph
    this.buildDependencyGraph(fields);

    // Check for circular dependencies
    this.detectCircularDependencies(fields, processed);

    // Resolve dependencies
    for (const field of fields) {
      if (field.fetchOptions?.dependsOn) {
        const resolved = this.resolveDependencies(
          field.fetchOptions.dependsOn,
          values,
        );
        if (resolved) {
          processed.resolved.add(field.fieldName);
        } else {
          processed.unresolved.add(field.fieldName);
        }
      }
    }

    return processed;
  }

  private async fetchFieldOptions(
    integrationId: string,
    actionId: string,
    fieldName: string,
    connectionId: string,
    dependencyValues: Record<string, any>,
  ): Promise<DynamicFieldOptions> {
    // This will be implemented with the execution engine
    // For now, return mock data
    return {
      options: [
        { label: "Option 1", value: "1" },
        { label: "Option 2", value: "2" },
        { label: "Option 3", value: "3" },
      ],
      allowCustom: false,
      customValidator: undefined,
    };
  }

  private generateCacheKey(
    integrationId: string,
    actionId: string,
    fieldName: string,
    connectionId: string,
    dependencyValues: Record<string, any>,
  ): string {
    const dependencyHash = JSON.stringify(dependencyValues);
    return `${integrationId}:${actionId}:${fieldName}:${connectionId}:${dependencyHash}`;
  }

  private isCacheExpired(cached: CachedFieldData): boolean {
    return Date.now() - cached.timestamp > cached.ttl;
  }

  private getFieldCacheTTL(
    integrationId: string,
    actionId: string,
    fieldName: string,
  ): number {
    // Default TTL is 5 minutes
    return 5 * 60 * 1000;
  }
}
```

---

## Deliverables

### **Code Deliverables**

- [ ] Complete scenario execution engine
- [ ] Advanced error handling and retry system
- [ ] Comprehensive monitoring and metrics collection
- [ ] Advanced logging system
- [ ] Enhanced dynamic field management
- [ ] Production-ready automation platform

### **Testing Deliverables**

- [ ] Execution engine tests
- [ ] Error handling and retry tests
- [ ] Monitoring and logging tests
- [ ] Dynamic field tests
- [ ] End-to-end scenario tests
- [ ] Performance and stress tests

### **Documentation Deliverables**

- [ ] Execution engine documentation
- [ ] Error handling and retry guides
- [ ] Monitoring and logging guides
- [ ] Dynamic field configuration guide
- [ ] Production deployment guide

### **Quality Gates**

- [ ] `pnpm build` runs successfully with no errors
- [ ] All TypeScript compilation passes
- [ ] Execution engine handles complex scenarios correctly
- [ ] Error handling and retry logic works properly
- [ ] Monitoring and logging systems are operational
- [ ] Dynamic fields work with complex dependencies
- [ ] Performance meets production requirements

---

## Success Metrics

### **Technical Metrics**

- ✅ **Build Success**: 100% successful builds across all packages
- ✅ **Type Safety**: Zero TypeScript compilation errors
- ✅ **Test Coverage**: >95% test coverage for advanced features
- ✅ **Performance**: <100ms for simple node execution, <1s for complex scenarios

### **Functional Metrics**

- ✅ **Execution Engine**: Handles complex, multi-node scenarios correctly
- ✅ **Error Handling**: Gracefully handles and recovers from failures
- ✅ **Monitoring**: Provides comprehensive visibility into execution
- ✅ **Dynamic Fields**: Supports complex dependency chains and caching

---

## Phase 4 Completion Checklist

- [ ] Implement complete scenario execution engine
- [ ] Build advanced error handling and retry system
- [ ] Create comprehensive monitoring and metrics collection
- [ ] Implement advanced logging system
- [ ] Enhance dynamic field management system
- [ ] Write comprehensive tests for all advanced features
- [ ] Test complex, production-like scenarios
- [ ] Run `pnpm build` and fix all errors
- [ ] Verify all advanced features work correctly
- [ ] Test performance under load
- [ ] Create production deployment documentation
- [ ] Demonstrate production-ready automation platform

**Phase 4 is complete when all items above are checked, `pnpm build` runs successfully with no errors, and the platform demonstrates production-ready capabilities for complex automation scenarios.**
