/**
 * Tests for the RuleEngineRegistry class
 */

import {
  RuleExecutionContext,
  Trigger,
  TriggerFactory,
} from "../lib/interfaces";
import { RuleEngineRegistry } from "../lib/registry";

describe("RuleEngineRegistry", () => {
  let registry: RuleEngineRegistry;

  // Mock trigger factory
  const mockTriggerFactory: TriggerFactory = {
    create: jest.fn((_config) => {
      const mockTrigger: Trigger = {
        type: "test-trigger",
        // eslint-disable-next-line @typescript-eslint/require-await
        evaluate: jest.fn(async () => true),
      };
      return mockTrigger;
    }),
  };

  beforeEach(() => {
    registry = new RuleEngineRegistry();
  });

  test("should register an integration", () => {
    // Act
    registry.registerIntegration("test-integration");

    // Assert
    expect(registry.hasIntegration("test-integration")).toBe(true);
    expect(registry.getRegisteredIntegrations()).toContain("test-integration");
  });

  test("should register a trigger factory", () => {
    // Arrange
    registry.registerIntegration("test-integration");

    // Act
    registry.registerTrigger(
      "test-integration",
      "test-trigger",
      mockTriggerFactory,
    );

    // Assert
    const triggerFactory = registry.getTrigger(
      "test-integration",
      "test-trigger",
    );
    expect(triggerFactory).toBe(mockTriggerFactory);
  });

  test("should register trigger factory for non-registered integration", () => {
    // Act - should automatically register the integration
    registry.registerTrigger(
      "test-integration",
      "test-trigger",
      mockTriggerFactory,
    );

    // Assert
    expect(registry.hasIntegration("test-integration")).toBe(true);
    const triggerFactory = registry.getTrigger(
      "test-integration",
      "test-trigger",
    );
    expect(triggerFactory).toBe(mockTriggerFactory);
  });

  test("should create a trigger instance", () => {
    // Arrange
    registry.registerTrigger(
      "test-integration",
      "test-trigger",
      mockTriggerFactory,
    );

    // Act
    const trigger = registry.createTrigger("test-integration", "test-trigger", {
      param: "value",
    });

    // Assert
    expect(trigger).toBeDefined();
    expect(mockTriggerFactory.create).toHaveBeenCalledWith({ param: "value" });
  });

  test("should return undefined for non-existent trigger type", () => {
    // Arrange
    registry.registerIntegration("test-integration");

    // Act
    const trigger = registry.createTrigger(
      "test-integration",
      "non-existent",
      {},
    );

    // Assert
    expect(trigger).toBeUndefined();
  });

  test("should return undefined for non-existent integration", () => {
    // Act
    const trigger = registry.createTrigger("non-existent", "test-trigger", {});

    // Assert
    expect(trigger).toBeUndefined();
  });

  test("should get all trigger types for an integration", () => {
    // Arrange
    registry.registerTrigger(
      "test-integration",
      "trigger1",
      mockTriggerFactory,
    );
    registry.registerTrigger(
      "test-integration",
      "trigger2",
      mockTriggerFactory,
    );

    // Act
    const triggerTypes = registry.getTriggerTypes("test-integration");

    // Assert
    expect(triggerTypes).toHaveLength(2);
    expect(triggerTypes.includes("trigger1")).toBe(true);
    expect(triggerTypes.includes("trigger2")).toBe(true);
  });

  test("should return empty array for non-existent integration", () => {
    // Act
    const triggerTypes = registry.getTriggerTypes("non-existent");

    // Assert
    expect(triggerTypes).toEqual([]);
  });
});
