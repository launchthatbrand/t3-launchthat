# Integration Webhooks System

This document describes the new webhook integration system that enables sending HTTP webhooks when events occur in the portal.

## Overview

The system includes:

1. **TraderLaunchpad App** - Internal app with order triggers
2. **Webhooks App** - External webhook sender
3. **Order Created (Instant) Trigger** - Fires immediately when orders are created

## Apps

### TraderLaunchpad App

- **Name**: TraderLaunchpad
- **Type**: Internal integration app for the portal
- **Auth**: Internal (no external authentication required)
- **Features**:
  - Order Created (Instant) trigger
  - Automatic webhook firing when orders are created

### Webhooks App

- **Name**: Webhooks
- **Type**: HTTP webhook sender
- **Auth**: None (URL-based)
- **Configuration**:
  - `webhookUrl` (required): Target URL for webhook POST requests
  - `secret` (optional): Secret for webhook signature verification
  - `headers` (optional): Custom HTTP headers as JSON object
  - `retryAttempts` (optional): Number of retry attempts (0-5, default: 3)
  - `timeout` (optional): Request timeout in seconds (5-300, default: 30)

## Triggers

### Order Created (Instant)

- **Event**: `order.created`
- **Trigger**: Fires immediately when a new order is created
- **Payload Structure**:

```json
{
  "event": "order.created",
  "timestamp": 1234567890000,
  "data": {
    "order": {
      "_id": "order_convex_id",
      "orderId": "ORD-123456-789",
      "email": "customer@example.com",
      "customerInfo": {
        "firstName": "John",
        "lastName": "Doe",
        "phone": "+1234567890"
      },
      "items": [...],
      "total": 99.99,
      "paymentStatus": "pending",
      "status": "pending",
      "createdAt": 1234567890000
    },
    "orderId": "order_convex_id"
  },
  "source": "traderlaunchpad",
  "version": "1.0"
}
```

## Webhook Security

### Signature Verification

When a secret is provided, webhooks include signature headers:

- `X-Webhook-Timestamp`: Unix timestamp of when the webhook was sent
- `X-Webhook-Signature`: HMAC-SHA256 signature of `{timestamp}.{payload}`
- `X-Webhook-Event`: Event type (e.g., "order.created")

### Example Verification (Node.js)

```javascript
const crypto = require("crypto");

function verifyWebhook(payload, signature, secret, timestamp) {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(`${timestamp}.${payload}`)
    .digest("hex");

  return `sha256=${expectedSignature}` === signature;
}
```

## Setup Instructions

### 1. Create a Scenario

1. Go to Integrations → Scenarios
2. Create a new scenario with:
   - **Trigger Node**: TraderLaunchpad → Order Created (Instant)
   - **Action Node**: Webhooks → Send Webhook

### 2. Configure Trigger Node

```json
{
  "triggerType": "orderCreated",
  "enabled": true
}
```

### 3. Configure Webhook Action Node

```json
{
  "webhookUrl": "https://your-service.com/webhook",
  "secret": "your-webhook-secret",
  "headers": {
    "Authorization": "Bearer your-token",
    "Content-Type": "application/json"
  },
  "retryAttempts": 3,
  "timeout": 30
}
```

### 4. Activate Scenario

Set the scenario status to "active" to start receiving webhooks.

## Testing

### Test Webhook Trigger

```bash
npx convex run integrations/triggers/orderEvents:testOrderCreatedTrigger
```

### Create Test Order

```bash
npx convex run ecommerce/orders/mockData:createMockOrder
```

## Implementation Details

### Files Added/Modified

- `apps/portal/convex/integrations/apps/seed.ts` - Added Webhooks and TraderLaunchpad apps
- `apps/portal/convex/integrations/actions/webhooks.ts` - Webhook sender action
- `apps/portal/convex/integrations/triggers/orderEvents.ts` - Order event triggers
- `apps/portal/convex/ecommerce/orders/index.ts` - Added trigger to createOrder
- `apps/portal/convex/ecommerce/orders/mockData.ts` - Added trigger to createMockOrder

### Automatic Triggers

The system automatically fires webhooks when:

- New orders are created via `createOrder` mutation
- Mock orders are created via `createMockOrder` mutation
- Any other order creation flow that uses the standard order insertion

### Error Handling

- Exponential backoff retry mechanism
- No retries on 4xx HTTP errors (client errors)
- Retries on 5xx HTTP errors (server errors) and network failures
- Comprehensive error logging and reporting

## Troubleshooting

### Common Issues

1. **Webhook not firing**: Check that the scenario is "active" and nodes are properly configured
2. **Authentication failures**: Verify webhook URL and custom headers
3. **Timeout errors**: Increase timeout value or check target server performance
4. **Signature verification fails**: Ensure secret matches and timestamp is recent

### Debug Functions

- Use `testOrderCreatedTrigger` to test the complete webhook flow
- Check Convex logs for detailed error messages
- Monitor webhook response codes and retry attempts
