# Integration System Environment Setup

This document explains how to set up the required environment variables for the Integration System.

## Security Configuration

The Integration System requires the following environment variables for secure credential storage:

### Required Environment Variables

| Variable                      | Description                                     | Example                    |
| ----------------------------- | ----------------------------------------------- | -------------------------- |
| `INTEGRATION_ENCRYPTION_KEY`  | Master encryption key for credential encryption | Random 32-character string |
| `INTEGRATION_ENCRYPTION_SALT` | Salt for key derivation                         | Random 16-character string |

### Generating Secure Values

You can generate secure random values for these environment variables using the following methods:

**Using Node.js:**

```js
const crypto = require("crypto");

// Generate encryption key (32 bytes = 256 bits)
const encryptionKey = crypto.randomBytes(32).toString("hex");
console.log("INTEGRATION_ENCRYPTION_KEY:", encryptionKey);

// Generate salt (16 bytes)
const salt = crypto.randomBytes(16).toString("hex");
console.log("INTEGRATION_ENCRYPTION_SALT:", salt);
```

**Using OpenSSL (command line):**

```bash
# Generate encryption key
openssl rand -hex 32

# Generate salt
openssl rand -hex 16
```

### Adding to Convex Environment

1. Go to the Convex dashboard
2. Navigate to your project
3. Click on "Settings" > "Environment Variables"
4. Add the environment variables with the generated values
5. Click "Save"

### Security Best Practices

- **Never commit these values to your repository**
- Store these values in a secure password manager
- Rotate these values periodically (approximately every 6-12 months)
- When rotating, ensure you re-encrypt all stored credentials with the new keys

## Third-Party Service Configuration

Each third-party service integration may require additional environment variables specific to that service. These will be documented in the setup guide for each integration.

## Verifying Configuration

You can verify that your encryption configuration is properly set up by running the following Convex action:

```js
// From browser console or application
await convex.action("integrations.security.testEncryption", {});
```

The action should return `true` if the configuration is working correctly.
