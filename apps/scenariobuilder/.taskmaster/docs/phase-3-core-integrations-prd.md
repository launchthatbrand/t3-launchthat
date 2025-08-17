# Phase 3: Core Integrations - Scenario Builder

## Product Requirements Document (PRD)

### Version: 1.0

### Date: January 16, 2025

### Phase: 3 - Core Integrations

### Duration: Weeks 7-10

---

## Executive Summary

Phase 3 focuses on creating the core integration packages that provide essential functionality for the Scenario Builder platform. This phase will implement Stripe (payments), Monday.com (project management), System (delays/conditions), and Router (flow control) integrations. The goal is to have a comprehensive set of integrations that cover the most common automation use cases.

## Success Criteria

**Phase 3 is complete when:**

- ✅ `@acme/integration-stripe` package is created and functional
- ✅ `@acme/integration-monday` package is created and functional
- ✅ `@acme/integration-system` package is created and functional
- ✅ `@acme/integration-router` package is created and functional
- ✅ All integrations can be used together in scenarios
- ✅ `pnpm build` runs successfully with no errors
- ✅ Core automation patterns are demonstrated and working

---

## Technical Requirements

### 1. Stripe Integration Package

#### **Package Structure**

```
packages/
├── integration-nodes/
│   └── stripe/
│       ├── package.json               # @acme/integration-stripe
│       ├── src/
│       │   ├── index.ts              # Main exports
│       │   ├── manifest.ts           # Integration manifest
│       │   ├── actions/
│       │   │   ├── index.ts          # Export all actions
│       │   │   ├── createCustomer.ts # Create Stripe customer
│       │   │   ├── createPayment.ts  # Create payment intent
│       │   │   ├── createSubscription.ts # Create subscription
│       │   │   ├── refundPayment.ts  # Refund payment
│       │   │   └── getCustomer.ts    # Get customer details
│       │   ├── triggers/
│       │   │   ├── index.ts
│       │   │   ├── paymentSucceeded.ts # Webhook trigger
│       │   │   ├── paymentFailed.ts  # Webhook trigger
│       │   │   └── subscriptionCreated.ts # Webhook trigger
│       │   ├── connections/
│       │   │   ├── index.ts
│       │   │   └── apiKey.ts         # Stripe API key auth
│       │   ├── types.ts              # Stripe-specific types
│       │   ├── utils/
│       │   │   ├── api.ts            # Stripe API client
│       │   │   ├── validation.ts     # Input validation
│       │   │   └── webhooks.ts       # Webhook handling
│       │   └── constants.ts          # Stripe API constants
│       ├── tests/
│       └── README.md
```

#### **Stripe Actions Implementation**

**Create Customer Action:**

```typescript
import { z } from "zod";

import { defineAction } from "@acme/scenario-builder-core";

import { StripeAPIClient } from "../utils/api.js";

export const createCustomer = defineAction({
  id: "create_customer",
  name: "Create Customer",
  description: "Create a new Stripe customer",
  category: "customers",

  configSchema: {
    input: z.object({
      email: z.string().email("Invalid email address"),
      name: z.string().min(1, "Name is required"),
      phone: z.string().optional(),
      description: z.string().optional(),
    }),

    settings: z.object({
      metadata: z.record(z.string()).optional(),
      taxId: z.string().optional(),
      address: z
        .object({
          line1: z.string().optional(),
          line2: z.string().optional(),
          city: z.string().optional(),
          state: z.string().optional(),
          postal_code: z.string().optional(),
          country: z.string().optional(),
        })
        .optional(),
    }),

    output: z.object({
      success: z.boolean(),
      customerId: z.string().optional(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const api = new StripeAPIClient(connection);

      const customerData = {
        email: input.email,
        name: input.name,
        phone: input.phone,
        description: input.description,
        metadata: settings.metadata,
        tax_id_data: settings.taxId
          ? [{ type: "eu_vat", value: settings.taxId }]
          : undefined,
        address: settings.address,
      };

      const customer = await api.customers.create(customerData);

      return {
        success: true,
        customerId: customer.id,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

**Create Payment Action:**

```typescript
export const createPayment = defineAction({
  id: "create_payment",
  name: "Create Payment",
  description: "Create a Stripe payment intent",
  category: "payments",

  configSchema: {
    input: z.object({
      amount: z.number().positive("Amount must be positive"),
      currency: z.string().length(3, "Currency must be 3 characters"),
      customerId: z.string().optional(),
      description: z.string().optional(),
    }),

    settings: z.object({
      paymentMethodTypes: z.array(z.string()).default(["card"]),
      captureMethod: z.enum(["automatic", "manual"]).default("automatic"),
      confirmationMethod: z.enum(["automatic", "manual"]).default("automatic"),
      metadata: z.record(z.string()).optional(),
    }),

    output: z.object({
      success: z.boolean(),
      paymentIntentId: z.string().optional(),
      clientSecret: z.string().optional(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const api = new StripeAPIClient(connection);

      const paymentData = {
        amount: Math.round(input.amount * 100), // Convert to cents
        currency: input.currency.toLowerCase(),
        customer: input.customerId,
        description: input.description,
        payment_method_types: settings.paymentMethodTypes,
        capture_method: settings.captureMethod,
        confirmation_method: settings.confirmationMethod,
        metadata: settings.metadata,
      };

      const paymentIntent = await api.paymentIntents.create(paymentData);

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 2. Monday.com Integration Package

#### **Package Structure**

```
packages/
├── integration-nodes/
│   └── monday/
│       ├── package.json               # @acme/integration-monday
│       ├── src/
│       │   ├── index.ts              # Main exports
│       │   ├── manifest.ts           # Integration manifest
│       │   ├── actions/
│       │   │   ├── index.ts          # Export all actions
│       │   │   ├── createItem.ts     # Create board item
│       │   │   ├── updateItem.ts     # Update board item
│       │   │   ├── createBoard.ts    # Create new board
│       │   │   ├── getItems.ts       # Get board items
│       │   │   └── getBoards.ts      # Get boards (dynamic field)
│       │   ├── triggers/
│       │   │   ├── index.ts
│       │   │   ├── itemCreated.ts    # Webhook trigger
│       │   │   └── itemUpdated.ts    # Webhook trigger
│       │   ├── connections/
│       │   │   ├── index.ts
│       │   │   └── apiToken.ts       # Monday.com API token
│       │   ├── types.ts              # Monday.com types
│       │   ├── utils/
│       │   │   ├── api.ts            # Monday.com API client
│       │   │   ├── validation.ts     # Input validation
│       │   │   └── webhooks.ts       # Webhook handling
│       │   └── constants.ts          # Monday.com API constants
│       ├── tests/
│       └── README.md
```

#### **Monday.com Actions Implementation**

**Create Item Action:**

```typescript
export const createItem = defineAction({
  id: "create_item",
  name: "Create Item",
  description: "Create a new item in a Monday.com board",
  category: "items",

  configSchema: {
    input: z.object({
      boardId: z.string().min(1, "Board ID is required"),
      itemName: z.string().min(1, "Item name is required"),
      columnValues: z.record(z.any()).optional(),
    }),

    settings: z.object({
      groupId: z.string().optional(),
      position: z.enum(["top", "bottom"]).default("bottom"),
    }),

    output: z.object({
      success: z.boolean(),
      itemId: z.string().optional(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const api = new MondayAPIClient(connection);

      const itemData = {
        board_id: parseInt(input.boardId),
        item_name: input.itemName,
        column_values: JSON.stringify(input.columnValues || {}),
        group_id: settings.groupId,
        position: settings.position,
      };

      const item = await api.items.create(itemData);

      return {
        success: true,
        itemId: item.id.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 3. System Integration Package

#### **Package Structure**

```
packages/
├── integration-nodes/
│   └── system/
│       ├── package.json               # @acme/integration-system
│       ├── src/
│       │   ├── index.ts              # Main exports
│       │   ├── manifest.ts           # Integration manifest
│       │   ├── actions/
│       │   │   ├── index.ts          # Export all actions
│       │   │   ├── delay.ts          # Delay execution
│       │   │   ├── condition.ts      # Conditional logic
│       │   │   ├── transform.ts      # Data transformation
│       │   │   ├── httpRequest.ts    # HTTP requests
│       │   │   └── email.ts          # Send emails
│       │   ├── triggers/
│       │   │   ├── index.ts
│       │   │   ├── schedule.ts       # Scheduled triggers
│       │   │   └── webhook.ts        # Generic webhook
│       │   ├── connections/
│       │   │   ├── index.ts
│       │   │   ├── smtp.ts           # SMTP configuration
│       │   │   └── http.ts           # HTTP configuration
│       │   ├── types.ts              # System types
│       │   ├── utils/
│       │   │   ├── delay.ts          # Delay utilities
│       │   │   ├── conditions.ts     # Condition evaluation
│       │   │   ├── transforms.ts     # Data transformation
│       │   │   └── http.ts           # HTTP utilities
│       │   └── constants.ts          # System constants
│       ├── tests/
│       └── README.md
```

#### **System Actions Implementation**

**Delay Action:**

```typescript
export const delay = defineAction({
  id: "delay",
  name: "Delay",
  description: "Delay execution for a specified time",
  category: "flow-control",

  configSchema: {
    input: z.object({
      duration: z.number().positive("Duration must be positive"),
      unit: z.enum(["seconds", "minutes", "hours", "days"]).default("seconds"),
    }),

    settings: z.object({
      reason: z.string().optional(),
    }),

    output: z.object({
      success: z.boolean(),
      delayedUntil: z.string().optional(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const durationMs = input.duration * getDurationMultiplier(input.unit);

      await new Promise((resolve) => setTimeout(resolve, durationMs));

      const delayedUntil = new Date(Date.now() + durationMs).toISOString();

      return {
        success: true,
        delayedUntil,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

function getDurationMultiplier(unit: string): number {
  switch (unit) {
    case "seconds":
      return 1000;
    case "minutes":
      return 60 * 1000;
    case "hours":
      return 60 * 60 * 1000;
    case "days":
      return 24 * 60 * 60 * 1000;
    default:
      return 1000;
  }
}
```

**Condition Action:**

```typescript
export const condition = defineAction({
  id: "condition",
  name: "Condition",
  description: "Evaluate a condition and route accordingly",
  category: "flow-control",

  configSchema: {
    input: z.object({
      value: z.any(),
      operator: z.enum([
        "equals",
        "not_equals",
        "contains",
        "greater_than",
        "less_than",
        "exists",
      ]),
      compareValue: z.any().optional(),
    }),

    settings: z.object({
      description: z.string().optional(),
    }),

    output: z.object({
      success: z.boolean(),
      result: z.boolean(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const result = evaluateCondition(
        input.value,
        input.operator,
        input.compareValue,
      );

      return {
        success: true,
        result,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});

function evaluateCondition(
  value: any,
  operator: string,
  compareValue?: any,
): boolean {
  switch (operator) {
    case "equals":
      return value === compareValue;
    case "not_equals":
      return value !== compareValue;
    case "contains":
      return String(value).includes(String(compareValue));
    case "greater_than":
      return Number(value) > Number(compareValue);
    case "less_than":
      return Number(value) < Number(compareValue);
    case "exists":
      return value !== null && value !== undefined;
    default:
      return false;
  }
}
```

### 4. Router Integration Package

#### **Package Structure**

```
packages/
├── integration-nodes/
│   └── router/
│       ├── package.json               # @acme/integration-router
│       ├── src/
│       │   ├── index.ts              # Main exports
│       │   ├── manifest.ts           # Integration manifest
│       │   ├── actions/
│       │   │   ├── index.ts          # Export all actions
│       │   │   ├── ifElse.ts         # If/else routing
│       │   │   ├── switch.ts         # Switch case routing
│       │   │   ├── loop.ts           # Loop control
│       │   │   ├── parallel.ts       # Parallel execution
│       │   │   └── merge.ts          # Merge multiple paths
│       │   ├── triggers/
│       │   │   ├── index.ts
│       │   │   └── manual.ts         # Manual trigger
│       │   ├── connections/
│       │   │   └── index.ts          # No external connections needed
│       │   ├── types.ts              # Router types
│       │   ├── utils/
│       │   │   ├── routing.ts        # Routing logic
│       │   │   ├── loops.ts          # Loop control
│       │   │   └── parallel.ts       # Parallel execution
│       │   └── constants.ts          # Router constants
│       ├── tests/
│       └── README.md
```

#### **Router Actions Implementation**

**If/Else Action:**

```typescript
export const ifElse = defineAction({
  id: "if_else",
  name: "If/Else",
  description: "Route execution based on a condition",
  category: "flow-control",

  configSchema: {
    input: z.object({
      condition: z.any(),
    }),

    settings: z.object({
      truePath: z.string().optional(),
      falsePath: z.string().optional(),
    }),

    output: z.object({
      success: z.boolean(),
      path: z.string(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const condition = Boolean(input.condition);
      const path = condition ? "true" : "false";

      return {
        success: true,
        path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

**Switch Action:**

```typescript
export const switchAction = defineAction({
  id: "switch",
  name: "Switch",
  description: "Route execution based on multiple conditions",
  category: "flow-control",

  configSchema: {
    input: z.object({
      value: z.any(),
    }),

    settings: z.object({
      cases: z.array(
        z.object({
          value: z.any(),
          path: z.string(),
        }),
      ),
      defaultPath: z.string().optional(),
    }),

    output: z.object({
      success: z.boolean(),
      path: z.string(),
      error: z.string().optional(),
    }),
  },

  async execute({ input, settings, connection }) {
    try {
      const matchingCase = settings.cases.find((c) => c.value === input.value);
      const path = matchingCase
        ? matchingCase.path
        : settings.defaultPath || "default";

      return {
        success: true,
        path,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
});
```

### 5. Integration Testing & Scenarios

#### **Multi-Integration Scenario Example**

```typescript
// Example scenario: Customer onboarding workflow
const onboardingScenario = {
  id: "customer-onboarding",
  name: "Customer Onboarding",
  description: "Automated customer onboarding workflow",
  nodes: [
    // Trigger: New customer signup
    {
      id: "trigger-signup",
      type: "trigger",
      integration: "stripe",
      action: "customer_created",
      position: { x: 100, y: 100 },
    },

    // Action: Create Monday.com item
    {
      id: "create-monday-item",
      type: "action",
      integration: "monday",
      action: "create_item",
      position: { x: 300, y: 100 },
      config: {
        boardId: "{{trigger.board_id}}",
        itemName: "New Customer: {{trigger.customer_name}}",
        columnValues: {
          customer_email: "{{trigger.customer_email}}",
          status: "New",
          priority: "High",
        },
      },
    },

    // Condition: Check if customer has payment method
    {
      id: "check-payment-method",
      type: "action",
      integration: "system",
      action: "condition",
      position: { x: 500, y: 100 },
      config: {
        value: "{{trigger.has_payment_method}}",
        operator: "equals",
        compareValue: true,
      },
    },

    // Router: If/else based on payment method
    {
      id: "payment-router",
      type: "action",
      integration: "router",
      action: "if_else",
      position: { x: 700, y: 100 },
      config: {
        condition: "{{check-payment-method.result}}",
      },
    },

    // Action: Send welcome email (if has payment method)
    {
      id: "send-welcome-email",
      type: "action",
      integration: "system",
      action: "email",
      position: { x: 900, y: 50 },
      config: {
        to: "{{trigger.customer_email}}",
        subject: "Welcome to our platform!",
        template: "welcome-with-payment",
      },
    },

    // Action: Send payment setup email (if no payment method)
    {
      id: "send-payment-email",
      type: "action",
      integration: "system",
      action: "email",
      position: { x: 900, y: 150 },
      config: {
        to: "{{trigger.customer_email}}",
        subject: "Complete your account setup",
        template: "payment-setup",
      },
    },

    // Delay: Wait 24 hours
    {
      id: "wait-24h",
      type: "action",
      integration: "system",
      action: "delay",
      position: { x: 1100, y: 100 },
      config: {
        duration: 24,
        unit: "hours",
      },
    },

    // Action: Follow-up check
    {
      id: "follow-up-check",
      type: "action",
      integration: "monday",
      action: "update_item",
      position: { x: 1300, y: 100 },
      config: {
        itemId: "{{create-monday-item.item_id}}",
        columnValues: {
          status: "Follow-up Required",
          last_contact: "{{now}}",
        },
      },
    },
  ],

  connections: [
    { from: "trigger-signup", to: "create-monday-item" },
    { from: "create-monday-item", to: "check-payment-method" },
    { from: "check-payment-method", to: "payment-router" },
    { from: "payment-router", to: "send-welcome-email", condition: "true" },
    { from: "payment-router", to: "send-payment-email", condition: "false" },
    { from: "send-welcome-email", to: "wait-24h" },
    { from: "send-payment-email", to: "wait-24h" },
    { from: "wait-24h", to: "follow-up-check" },
  ],
};
```

### 6. Enhanced UI Components

#### **Scenario Builder Canvas**

```typescript
// Enhanced scenario builder with all integrations
export function ScenarioBuilder() {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const availableIntegrations = [
    'wordpress',
    'stripe',
    'monday',
    'system',
    'router',
  ];

  const handleNodeAdd = (integrationId: string, position: { x: number, y: number }) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: 'default',
      position,
      data: {
        integrationId,
        label: `New ${integrationId} node`,
      },
    };

    setNodes(prev => [...prev, newNode]);
    setSelectedNode(newNode.id);
  };

  const handleNodeUpdate = (nodeId: string, updates: any) => {
    setNodes(prev =>
      prev.map(node =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, ...updates } }
          : node
      )
    );
  };

  return (
    <div className="scenario-builder">
      <div className="toolbar">
        <h2>Scenario Builder</h2>
        <div className="integration-palette">
          {availableIntegrations.map(integrationId => (
            <button
              key={integrationId}
              onClick={() => handleNodeAdd(integrationId, { x: 100, y: 100 })}
              className="integration-button"
            >
              {integrationId}
            </button>
          ))}
        </div>
      </div>

      <div className="canvas">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={setNodes}
          onEdgesChange={setEdges}
          onNodeClick={(_, node) => setSelectedNode(node.id)}
        >
          <Background />
          <Controls />
          <MiniMap />
        </ReactFlow>
      </div>

      {selectedNode && (
        <div className="node-panel">
          <NodeConfigPanel
            node={nodes.find(n => n.id === selectedNode)}
            onUpdate={(updates) => handleNodeUpdate(selectedNode, updates)}
          />
        </div>
      )}
    </div>
  );
}
```

---

## Deliverables

### **Code Deliverables**

- [ ] `@acme/integration-stripe` package with payment actions
- [ ] `@acme/integration-monday` package with project management actions
- [ ] `@acme/integration-system` package with utility actions
- [ ] `@acme/integration-router` package with flow control actions
- [ ] Multi-integration scenario examples
- [ ] Enhanced UI components for complex scenarios
- [ ] Integration testing framework

### **Testing Deliverables**

- [ ] Unit tests for all integration packages
- [ ] Integration tests with external services
- [ ] Multi-integration scenario tests
- [ ] End-to-end workflow testing

### **Documentation Deliverables**

- [ ] README files for all integration packages
- [ ] API documentation for all actions
- [ ] Scenario examples and templates
- [ ] Integration setup guides

### **Quality Gates**

- [ ] `pnpm build` runs successfully with no errors
- [ ] All TypeScript compilation passes
- [ ] Unit tests pass for all packages
- [ ] Integration tests pass
- [ ] Multi-integration scenarios work correctly
- [ ] All packages can be imported and used together

---

## Success Metrics

### **Technical Metrics**

- ✅ **Build Success**: 100% successful builds across all packages
- ✅ **Type Safety**: Zero TypeScript compilation errors
- ✅ **Test Coverage**: >90% test coverage for all integrations
- ✅ **Integration Success**: All packages work together seamlessly

### **Functional Metrics**

- ✅ **Payment Processing**: Stripe actions work correctly
- ✅ **Project Management**: Monday.com actions work correctly
- ✅ **Flow Control**: System and router actions work correctly
- ✅ **Complex Scenarios**: Multi-integration workflows function properly

---

## Phase 3 Completion Checklist

- [ ] Create Stripe integration package
- [ ] Create Monday.com integration package
- [ ] Create System integration package
- [ ] Create Router integration package
- [ ] Implement all core actions for each integration
- [ ] Add webhook triggers for real-time events
- [ ] Create multi-integration scenario examples
- [ ] Enhance UI components for complex scenarios
- [ ] Write comprehensive tests for all packages
- [ ] Test multi-integration workflows
- [ ] Run `pnpm build` and fix all errors
- [ ] Verify all integrations work together
- [ ] Test end-to-end scenarios
- [ ] Create documentation and examples

**Phase 3 is complete when all items above are checked, `pnpm build` runs successfully with no errors, and all core integrations can be used together to create complex automation scenarios.**
