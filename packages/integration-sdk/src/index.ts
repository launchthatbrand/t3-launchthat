// Core types
export type {
  NodeType,
  NodeMetadata,
  NodeConfigSchema,
  NodeExecutionContext,
  NodeExecutionResult,
  IntegrationNodeDefinition,
  ConnectionDefinition,
  NodeRegistryEntry,
  IntegrationRegistry,
  EnhancedIntegrationRegistry,
  ReactFlowNodeData,
  FormFieldDefinition,
  DynamicFormSchema,
  ConfigFieldDefinition,
  IODefinition,
  AuthConfiguration,
  NodeProcessor,
  NodeDiscoveryResult,
  NodeDiscoveryError,
  NodeLoader,
} from "./types.js";

// Node types for external integrations
export type {
  ActionDefinition,
  ActionExecutionContext,
  ActionExecutionResult,
} from "./node-types.js";

// Registry implementation
export {
  IntegrationNodeRegistry,
  globalNodeRegistry,
  registerSystemNode,
  registerExternalNode,
  discoverAndRegisterNodes,
} from "./registry.js";

// Validation utilities
export {
  createFormFieldSchema,
  createDynamicFormSchema,
  commonValidationSchemas,
  validateNodeConfig,
  validateInput,
  createTextField,
  createSelectField,
  createNumberField,
  createBooleanField,
} from "./validation.js";

// External node framework
export type {
  RateLimitConfig,
  AuthHandler,
  OAuth2TokenStorage,
  OAuth2Token,
  OAuth2Config,
  CustomAuthMethod,
  QueuedRequest,
  RequestQueueConfig,
} from "./external-node.js";
export {
  ExternalApiError,
  AuthenticationError,
  RateLimitError,
  BasicAuthHandler,
  ApiKeyHandler,
  BearerTokenHandler,
  OAuth2Handler,
  InMemoryTokenStorage,
  EnhancedApiKeyHandler,
  CustomAuthHandler,
  AWSSignatureV4Method,
  HMACAuthMethod,
  JWTAuthMethod,
  AuthFactory,
  RateLimiter,
  EnhancedRateLimiter,
  RequestQueue,
  ApiClient,
  EnhancedApiClient,
  ExternalNode,
} from "./external-node.js";

// Templates and examples
export {
  SimpleNode,
  SimpleNodeDefinition,
  SimpleInputSchema,
  SimpleOutputSchema,
  SimpleConnectionDefinition,
} from "./simple-template.js";
