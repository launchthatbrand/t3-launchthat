/**
 * Tests for the RuleEngine class
 */

import { RuleEngine } from "../lib/engine";
import {
  Action,
  ActionFactory,
  ActionResult,
  Condition,
  ConditionFactory,
  Rule,
  Trigger,
  TriggerFactory,
} from "../lib/interfaces";
import { RuleEngineRegistry } from "../lib/registry";

// Mock rule for testing
const createMockRule = (): Rule => ({
  id: "test-rule-id",
  name: "Test Rule",
  description: "Test rule for unit tests",
  enabled: true,
  priority: 1,
  integrationId: "test-integration",
  integrationName: "Test Integration",
  triggerType: "test-trigger",
  triggerConfig: { field: "value" },
  conditions: [{ type: "test-condition", config: { field: "value" } }],
  actions: [{ type: "test-action", config: { field: "value" } }],
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

describe("RuleEngine", () => {
  let registry: RuleEngineRegistry;
  let engine: RuleEngine;

  // Mock factories
  const mockTriggerFactory: TriggerFactory = {
    create: jest.fn((_config) => ({
      type: "test-trigger",
      // eslint-disable-next-line @typescript-eslint/require-await
      evaluate: jest.fn(async () => true),
    })),
  };

  const mockConditionFactory: ConditionFactory = {
    create: jest.fn((_config) => ({
      type: "test-condition",
      config: { field: "value" },
      // eslint-disable-next-line @typescript-eslint/require-await
      evaluate: jest.fn(async () => true),
    })),
  };

  const mockActionFactory: ActionFactory = {
    create: jest.fn((_config) => ({
      type: "test-action",
      config: { field: "value" },
      // eslint-disable-next-line @typescript-eslint/require-await
      execute: jest.fn(async () => ({
        actionType: "test-action",
        success: true,
        message: "Action executed successfully",
        timeTaken: 0,
      })),
    })),
  };

  beforeEach(() => {
    // Create registry with mock components
    registry = new RuleEngineRegistry();

    // Register test integration
    registry.registerIntegration("test-integration");

    // Register factories
    registry.registerTrigger(
      "test-integration",
      "test-trigger",
      mockTriggerFactory,
    );
    registry.registerCondition(
      "test-integration",
      "test-condition",
      mockConditionFactory,
    );
    registry.registerAction(
      "test-integration",
      "test-action",
      mockActionFactory,
    );

    // Create engine with registry
    engine = new RuleEngine(registry);

    // Reset mock function calls
    jest.clearAllMocks();
  });

  describe("evaluateRule", () => {
    test("should evaluate rule and return triggered=true when trigger and conditions pass", async () => {
      // Arrange
      const rule = createMockRule();
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Mock trigger evaluation to return true
      const trigger = registry.createTrigger(
        rule.integrationId,
        rule.triggerType,
        rule.triggerConfig,
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (trigger!.evaluate as jest.Mock).mockResolvedValueOnce(true);

      // Mock condition evaluation to return true
      const condition = registry.createCondition(
        rule.integrationId,
        rule.conditions[0].type,
        rule.conditions[0].config,
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (condition!.evaluate as jest.Mock).mockResolvedValueOnce(true);

      // Act
      const result = await engine.evaluateRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.ruleId).toBe(rule.id);
      expect(result.triggered).toBe(true);
      expect(result.conditionsMet).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test("should return triggered=false when trigger fails", async () => {
      // Arrange
      const rule = createMockRule();
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Mock trigger evaluation to return false
      const trigger = registry.createTrigger(
        rule.integrationId,
        rule.triggerType,
        rule.triggerConfig,
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (trigger!.evaluate as jest.Mock).mockResolvedValueOnce(false);

      // Act
      const result = await engine.evaluateRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.triggered).toBe(false);
      expect(result.conditionsMet).toBe(false);
    });

    test("should return triggered=true but conditionsMet=false when conditions fail", async () => {
      // Arrange
      const rule = createMockRule();
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Mock trigger evaluation to return true
      const trigger = registry.createTrigger(
        rule.integrationId,
        rule.triggerType,
        rule.triggerConfig,
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (trigger!.evaluate as jest.Mock).mockResolvedValueOnce(true);

      // Mock condition evaluation to return false
      const condition = registry.createCondition(
        rule.integrationId,
        rule.conditions[0].type,
        rule.conditions[0].config,
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (condition!.evaluate as jest.Mock).mockResolvedValueOnce(false);

      // Act
      const result = await engine.evaluateRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.triggered).toBe(true);
      expect(result.conditionsMet).toBe(false);
    });

    test("should not evaluate disabled rules", async () => {
      // Arrange
      const rule = createMockRule();
      rule.enabled = false;
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Act
      const result = await engine.evaluateRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.triggered).toBe(false);
      expect(result.conditionsMet).toBe(false);
      expect(result.details.reason).toBe("Rule is disabled");
    });
  });

  describe("executeRule", () => {
    test("should execute rule actions when evaluation passes", async () => {
      // Arrange
      const rule = createMockRule();
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Mock evaluateRule to return success
      jest.spyOn(engine, "evaluateRule").mockResolvedValueOnce({
        ruleId: rule.id,
        triggered: true,
        conditionsMet: true,
        details: {},
        timeTaken: 0,
      });

      // Act
      const result = await engine.executeRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.ruleId).toBe(rule.id);
      expect(result.status).toBe("success");
      expect(result.actionsExecuted).toBe(1);
      expect(result.actionResults).toHaveLength(1);
      expect(result.actionResults[0].success).toBe(true);
    });

    test("should skip execution when rule evaluation fails", async () => {
      // Arrange
      const rule = createMockRule();
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Mock evaluateRule to return failure
      jest.spyOn(engine, "evaluateRule").mockResolvedValueOnce({
        ruleId: rule.id,
        triggered: false,
        conditionsMet: false,
        details: { reason: "Trigger not met" },
        timeTaken: 0,
      });

      // Act
      const result = await engine.executeRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.status).toBe("skipped");
      expect(result.actionsExecuted).toBe(0);
      expect(result.actionResults).toHaveLength(0);
    });

    test("should handle action execution failures", async () => {
      // Arrange
      const rule = createMockRule();
      const triggerData = { event: "test" };
      const integrationData = { connection: "active" };

      // Mock evaluateRule to return success
      jest.spyOn(engine, "evaluateRule").mockResolvedValueOnce({
        ruleId: rule.id,
        triggered: true,
        conditionsMet: true,
        details: {},
        timeTaken: 0,
      });

      // Mock action execute to fail
      const action = registry.createAction(
        rule.integrationId,
        rule.actions[0].type,
        rule.actions[0].config,
      );
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      (action!.execute as jest.Mock).mockResolvedValueOnce({
        actionType: "test-action",
        success: false,
        error: "Action failed",
        timeTaken: 0,
      });

      // Act
      const result = await engine.executeRule(
        rule,
        triggerData,
        integrationData,
      );

      // Assert
      expect(result.status).toBe("error");
      expect(result.actionsExecuted).toBe(1);
      expect(result.actionResults).toHaveLength(1);
      expect(result.actionResults[0].success).toBe(false);
    });
  });
});
