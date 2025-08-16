import { z } from "zod";

import {
  ConnectionDefinition,
  IntegrationNodeDefinition,
  IODefinition,
  NodeExecutionContext,
  NodeExecutionResult,
  NodeProcessor,
} from "./types.js";

// Rate limiting configuration
export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  strategy: "fixed" | "sliding" | "token_bucket";
}

// External API error types
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public apiResponse?: any,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

export class AuthenticationError extends ExternalApiError {
  constructor(message: string, apiResponse?: any) {
    super(message, 401, apiResponse, false);
    this.name = "AuthenticationError";
  }
}

export class RateLimitError extends ExternalApiError {
  constructor(message: string, retryAfter?: number) {
    super(message, 429, { retryAfter }, true);
    this.name = "RateLimitError";
  }
}

// Base authentication handler interface
export interface AuthHandler {
  type: "oauth2" | "api_key" | "basic_auth" | "bearer_token" | "custom";
  authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>>;
  validateAuth(auth: any): boolean;
  refreshToken?(auth: any): Promise<any>;
}

// Basic Auth Handler
export class BasicAuthHandler implements AuthHandler {
  type = "basic_auth" as const;

  async authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>> {
    const { username, password } = auth;
    if (!username || !password) {
      throw new AuthenticationError(
        "Username and password are required for basic auth",
      );
    }

    return {
      ...headers,
      Authorization: `Basic ${btoa(`${username}:${password}`)}`,
    };
  }

  validateAuth(auth: any): boolean {
    return (
      auth &&
      typeof auth.username === "string" &&
      typeof auth.password === "string"
    );
  }
}

// API Key Handler
export class ApiKeyHandler implements AuthHandler {
  type = "api_key" as const;

  constructor(
    private keyField = "apiKey",
    private headerName = "X-API-Key",
  ) {}

  async authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>> {
    const apiKey = auth[this.keyField];
    if (!apiKey) {
      throw new AuthenticationError(
        `${this.keyField} is required for API key auth`,
      );
    }

    return {
      ...headers,
      [this.headerName]: apiKey,
    };
  }

  validateAuth(auth: any): boolean {
    return auth && typeof auth[this.keyField] === "string";
  }
}

// Bearer Token Handler
export class BearerTokenHandler implements AuthHandler {
  type = "bearer_token" as const;

  async authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>> {
    const { token } = auth;
    if (!token) {
      throw new AuthenticationError("Bearer token is required");
    }

    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }

  validateAuth(auth: any): boolean {
    return auth && typeof auth.token === "string";
  }
}

// OAuth2 Token Storage Interface
export interface OAuth2TokenStorage {
  getToken(key: string): Promise<OAuth2Token | null>;
  saveToken(key: string, token: OAuth2Token): Promise<void>;
  deleteToken(key: string): Promise<void>;
}

// OAuth2 Token Structure
export interface OAuth2Token {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  expires_in?: number;
  expires_at?: number;
  scope?: string;
}

// OAuth2 Configuration
export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes?: string[];
  additionalParams?: Record<string, string>;
}

// OAuth2 Handler
export class OAuth2Handler implements AuthHandler {
  type = "oauth2" as const;

  constructor(
    private config: OAuth2Config,
    private tokenStorage: OAuth2TokenStorage,
  ) {}

  async authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>> {
    const token = await this.getValidToken(auth.storageKey || "default");
    if (!token) {
      throw new AuthenticationError("No valid OAuth2 token available");
    }

    return {
      ...headers,
      Authorization: `${token.token_type} ${token.access_token}`,
    };
  }

  validateAuth(auth: any): boolean {
    return auth && (auth.storageKey || auth.access_token);
  }

  async refreshToken(auth: any): Promise<OAuth2Token> {
    const storedToken = await this.tokenStorage.getToken(
      auth.storageKey || "default",
    );
    if (!storedToken?.refresh_token) {
      throw new AuthenticationError("No refresh token available");
    }

    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: storedToken.refresh_token,
      }),
    });

    if (!response.ok) {
      throw new AuthenticationError(
        `Token refresh failed: ${response.statusText}`,
      );
    }

    const tokenData = await response.json();
    const newToken: OAuth2Token = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token || storedToken.refresh_token,
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in,
      expires_at: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : undefined,
      scope: tokenData.scope,
    };

    await this.tokenStorage.saveToken(auth.storageKey || "default", newToken);
    return newToken;
  }

  // Get authorization URL for OAuth2 flow
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      response_type: "code",
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      ...(this.config.scopes && { scope: this.config.scopes.join(" ") }),
      ...(state && { state }),
      ...this.config.additionalParams,
    });

    return `${this.config.authorizationUrl}?${params.toString()}`;
  }

  // Exchange authorization code for tokens
  async exchangeCodeForToken(
    code: string,
    state?: string,
  ): Promise<OAuth2Token> {
    const response = await fetch(this.config.tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${btoa(`${this.config.clientId}:${this.config.clientSecret}`)}`,
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: this.config.redirectUri,
        ...(state && { state }),
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new AuthenticationError(
        `Token exchange failed: ${response.statusText} - ${errorData}`,
      );
    }

    const tokenData = await response.json();
    const token: OAuth2Token = {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      token_type: tokenData.token_type || "Bearer",
      expires_in: tokenData.expires_in,
      expires_at: tokenData.expires_in
        ? Date.now() + tokenData.expires_in * 1000
        : undefined,
      scope: tokenData.scope,
    };

    return token;
  }

  // Check if token is expired
  private isTokenExpired(token: OAuth2Token): boolean {
    if (!token.expires_at) {
      return false; // No expiration info, assume it's still valid
    }
    return Date.now() >= token.expires_at - 60000; // Refresh 1 minute before expiry
  }

  // Get a valid token, refreshing if necessary
  private async getValidToken(storageKey: string): Promise<OAuth2Token | null> {
    const token = await this.tokenStorage.getToken(storageKey);
    if (!token) {
      return null;
    }

    if (this.isTokenExpired(token) && token.refresh_token) {
      try {
        return await this.refreshToken({ storageKey });
      } catch (error) {
        console.error("Token refresh failed:", error);
        return null;
      }
    }

    return token;
  }
}

// Simple in-memory token storage (for testing/demo purposes)
export class InMemoryTokenStorage implements OAuth2TokenStorage {
  private tokens = new Map<string, OAuth2Token>();

  async getToken(key: string): Promise<OAuth2Token | null> {
    return this.tokens.get(key) || null;
  }

  async saveToken(key: string, token: OAuth2Token): Promise<void> {
    this.tokens.set(key, token);
  }

  async deleteToken(key: string): Promise<void> {
    this.tokens.delete(key);
  }

  // Utility method to clear all tokens
  async clearAll(): Promise<void> {
    this.tokens.clear();
  }
}

// Enhanced API Key Handler with multiple placement options
export class EnhancedApiKeyHandler implements AuthHandler {
  type = "api_key" as const;

  constructor(
    private config: {
      keyField?: string;
      placement: "header" | "query" | "body";
      headerName?: string;
      queryParam?: string;
      bodyField?: string;
      prefix?: string;
    },
  ) {}

  async authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>> {
    const keyField = this.config.keyField || "apiKey";
    const apiKey = auth[keyField];

    if (!apiKey) {
      throw new AuthenticationError(`${keyField} is required for API key auth`);
    }

    const finalKey = this.config.prefix
      ? `${this.config.prefix}${apiKey}`
      : apiKey;

    if (this.config.placement === "header") {
      const headerName = this.config.headerName || "X-API-Key";
      return {
        ...headers,
        [headerName]: finalKey,
      };
    }

    // For query and body placement, we return the headers as-is
    // The ApiClient will need to be enhanced to handle these cases
    return headers;
  }

  validateAuth(auth: any): boolean {
    const keyField = this.config.keyField || "apiKey";
    return auth && typeof auth[keyField] === "string";
  }

  // Method to get the API key for query/body placement
  getApiKeyForPlacement(auth: any): { key: string; value: string } | null {
    const keyField = this.config.keyField || "apiKey";
    const apiKey = auth[keyField];

    if (!apiKey) return null;

    const finalKey = this.config.prefix
      ? `${this.config.prefix}${apiKey}`
      : apiKey;

    if (this.config.placement === "query") {
      return {
        key: this.config.queryParam || "api_key",
        value: finalKey,
      };
    }

    if (this.config.placement === "body") {
      return {
        key: this.config.bodyField || "api_key",
        value: finalKey,
      };
    }

    return null;
  }
}

// Custom Authentication Handler Interface
export interface CustomAuthMethod {
  name: string;
  description: string;
  configSchema: z.ZodSchema<any>;
  authenticate(
    headers: Record<string, string>,
    config: any,
  ): Promise<Record<string, string>>;
  validateConfig(config: any): boolean;
  sign?(data: string, config: any): Promise<string>;
}

// Custom Authentication Handler
export class CustomAuthHandler implements AuthHandler {
  type = "custom" as const;

  constructor(private method: CustomAuthMethod) {}

  async authenticate(
    headers: Record<string, string>,
    auth: any,
  ): Promise<Record<string, string>> {
    if (!this.method.validateConfig(auth)) {
      throw new AuthenticationError(
        `Invalid configuration for ${this.method.name} authentication`,
      );
    }

    return await this.method.authenticate(headers, auth);
  }

  validateAuth(auth: any): boolean {
    return this.method.validateConfig(auth);
  }

  // Method to sign data if the auth method supports it
  async sign(data: string, auth: any): Promise<string> {
    if (!this.method.sign) {
      throw new Error(`${this.method.name} does not support data signing`);
    }
    return await this.method.sign(data, auth);
  }
}

// AWS Signature v4 Authentication Method
export class AWSSignatureV4Method implements CustomAuthMethod {
  name = "AWS Signature v4";
  description = "AWS Signature Version 4 authentication for AWS API requests";

  configSchema = z.object({
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    region: z.string(),
    service: z.string(),
  });

  async authenticate(
    headers: Record<string, string>,
    config: any,
  ): Promise<Record<string, string>> {
    const { accessKeyId, secretAccessKey, region, service } = config;
    const timestamp = new Date().toISOString().replace(/[:\-]|\.\d{3}/g, "");
    const date = timestamp.substr(0, 8);

    // This is a simplified implementation - in production, you'd want a full AWS SDK
    return {
      ...headers,
      Authorization: `AWS4-HMAC-SHA256 Credential=${accessKeyId}/${date}/${region}/${service}/aws4_request`,
      "X-Amz-Date": timestamp,
    };
  }

  validateConfig(config: any): boolean {
    try {
      this.configSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  async sign(data: string, config: any): Promise<string> {
    // Simplified HMAC-SHA256 signing - in production use proper AWS SDK
    const { secretAccessKey } = config;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secretAccessKey),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data),
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// HMAC Authentication Method
export class HMACAuthMethod implements CustomAuthMethod {
  name = "HMAC Authentication";
  description =
    "HMAC-based authentication with customizable algorithm and placement";

  configSchema = z.object({
    secret: z.string(),
    algorithm: z.enum(["SHA-1", "SHA-256", "SHA-512"]).default("SHA-256"),
    headerName: z.string().default("X-HMAC-Signature"),
    includeTimestamp: z.boolean().default(true),
    timestampHeader: z.string().default("X-Timestamp"),
  });

  async authenticate(
    headers: Record<string, string>,
    config: any,
  ): Promise<Record<string, string>> {
    const { secret, algorithm, headerName, includeTimestamp, timestampHeader } =
      config;
    const timestamp = includeTimestamp ? Date.now().toString() : "";

    // Create data to sign (could be enhanced to include request body, etc.)
    const dataToSign = includeTimestamp ? timestamp : "request";

    const signature = await this.sign(dataToSign, config);

    const newHeaders: Record<string, string> = {
      ...headers,
      [headerName]: signature,
    };

    if (includeTimestamp) {
      newHeaders[timestampHeader] = timestamp;
    }

    return newHeaders;
  }

  validateConfig(config: any): boolean {
    try {
      this.configSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  async sign(data: string, config: any): Promise<string> {
    const { secret, algorithm } = config;
    const encoder = new TextEncoder();

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: algorithm },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data),
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// JWT Authentication Method
export class JWTAuthMethod implements CustomAuthMethod {
  name = "JWT Authentication";
  description = "JSON Web Token authentication for API requests";

  configSchema = z.object({
    secret: z.string(),
    algorithm: z.enum(["HS256", "HS512"]).default("HS256"),
    expiresIn: z.number().default(3600), // 1 hour
    issuer: z.string().optional(),
    audience: z.string().optional(),
    payload: z.record(z.unknown()).optional(),
  });

  async authenticate(
    headers: Record<string, string>,
    config: any,
  ): Promise<Record<string, string>> {
    const token = await this.generateJWT(config);

    return {
      ...headers,
      Authorization: `Bearer ${token}`,
    };
  }

  validateConfig(config: any): boolean {
    try {
      this.configSchema.parse(config);
      return true;
    } catch {
      return false;
    }
  }

  private async generateJWT(config: any): Promise<string> {
    const {
      secret,
      algorithm,
      expiresIn,
      issuer,
      audience,
      payload = {} as Record<string, unknown>,
    } = config;

    const header = {
      alg: algorithm,
      typ: "JWT",
    };

    const now = Math.floor(Date.now() / 1000);
    const claims = {
      ...payload,
      iat: now,
      exp: now + expiresIn,
      ...(issuer && { iss: issuer }),
      ...(audience && { aud: audience }),
    };

    const encodedHeader = btoa(JSON.stringify(header))
      .replace(/[+/]/g, (char) => (char === "+" ? "-" : "_"))
      .replace(/=/g, "");
    const encodedPayload = btoa(JSON.stringify(claims))
      .replace(/[+/]/g, (char) => (char === "+" ? "-" : "_"))
      .replace(/=/g, "");

    const dataToSign = `${encodedHeader}.${encodedPayload}`;
    const signature = await this.sign(dataToSign, config);

    return `${dataToSign}.${signature}`;
  }

  async sign(data: string, config: any): Promise<string> {
    const { secret, algorithm } = config;
    const encoder = new TextEncoder();

    const hashAlgorithm = algorithm === "HS256" ? "SHA-256" : "SHA-512";

    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: hashAlgorithm },
      false,
      ["sign"],
    );

    const signature = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(data),
    );
    return Array.from(new Uint8Array(signature))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
  }
}

// Authentication Factory
export class AuthFactory {
  private static customMethods = new Map<string, CustomAuthMethod>();

  // Register a custom authentication method
  static registerCustomMethod(method: CustomAuthMethod): void {
    this.customMethods.set(method.name, method);
  }

  // Create an authentication handler based on configuration
  static createAuthHandler(config: {
    type:
      | "oauth2"
      | "api_key"
      | "basic_auth"
      | "bearer_token"
      | "custom"
      | "enhanced_api_key";
    [key: string]: any;
  }): AuthHandler {
    switch (config.type) {
      case "basic_auth":
        return new BasicAuthHandler();

      case "api_key":
        return new ApiKeyHandler(config.keyField, config.headerName);

      case "enhanced_api_key":
        return new EnhancedApiKeyHandler({
          keyField: config.keyField,
          placement: config.placement || "header",
          headerName: config.headerName,
          queryParam: config.queryParam,
          bodyField: config.bodyField,
          prefix: config.prefix,
        });

      case "bearer_token":
        return new BearerTokenHandler();

      case "oauth2":
        if (!config.oauth2Config || !config.tokenStorage) {
          throw new Error("OAuth2 requires oauth2Config and tokenStorage");
        }
        return new OAuth2Handler(config.oauth2Config, config.tokenStorage);

      case "custom":
        if (!config.methodName) {
          throw new Error("Custom auth requires methodName");
        }
        const method = this.customMethods.get(config.methodName);
        if (!method) {
          throw new Error(`Unknown custom auth method: ${config.methodName}`);
        }
        return new CustomAuthHandler(method);

      default:
        throw new Error(`Unknown auth type: ${config.type}`);
    }
  }

  // Get all available custom methods
  static getAvailableCustomMethods(): CustomAuthMethod[] {
    return Array.from(this.customMethods.values());
  }
}

// Register built-in custom methods
AuthFactory.registerCustomMethod(new AWSSignatureV4Method());
AuthFactory.registerCustomMethod(new HMACAuthMethod());
AuthFactory.registerCustomMethod(new JWTAuthMethod());

// Rate limiter implementation
export class RateLimiter {
  private requests: number[] = [];

  constructor(private config: RateLimitConfig) {}

  async checkLimit(): Promise<void> {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Remove old requests
    this.requests = this.requests.filter((time) => time > windowStart);

    if (this.requests.length >= this.config.maxRequests) {
      const oldestRequest = this.requests[0];
      const retryAfter = Math.ceil(
        (oldestRequest + this.config.windowMs - now) / 1000,
      );
      throw new RateLimitError(
        `Rate limit exceeded. Retry after ${retryAfter} seconds.`,
        retryAfter,
      );
    }

    this.requests.push(now);
  }
}

// Enhanced Rate Limiter with multiple strategies
export class EnhancedRateLimiter {
  private fixedWindowRequests: number[] = [];
  private slidingWindowRequests: number[] = [];
  private tokenBucketTokens: number;
  private lastRefill: number;

  constructor(private config: RateLimitConfig) {
    this.tokenBucketTokens = config.maxRequests;
    this.lastRefill = Date.now();
  }

  async checkLimit(): Promise<void> {
    const now = Date.now();

    switch (this.config.strategy) {
      case "fixed":
        return this.checkFixedWindow(now);
      case "sliding":
        return this.checkSlidingWindow(now);
      case "token_bucket":
        return this.checkTokenBucket(now);
      default:
        throw new Error(
          `Unknown rate limiting strategy: ${this.config.strategy}`,
        );
    }
  }

  private async checkFixedWindow(now: number): Promise<void> {
    const windowStart =
      Math.floor(now / this.config.windowMs) * this.config.windowMs;

    // Remove requests from previous windows
    this.fixedWindowRequests = this.fixedWindowRequests.filter(
      (time) => time >= windowStart,
    );

    if (this.fixedWindowRequests.length >= this.config.maxRequests) {
      const nextWindow = windowStart + this.config.windowMs;
      const retryAfter = Math.ceil((nextWindow - now) / 1000);
      throw new RateLimitError(
        `Fixed window rate limit exceeded. Retry after ${retryAfter} seconds.`,
        retryAfter,
      );
    }

    this.fixedWindowRequests.push(now);
  }

  private async checkSlidingWindow(now: number): Promise<void> {
    const windowStart = now - this.config.windowMs;

    // Remove old requests
    this.slidingWindowRequests = this.slidingWindowRequests.filter(
      (time) => time > windowStart,
    );

    if (this.slidingWindowRequests.length >= this.config.maxRequests) {
      const oldestRequest = this.slidingWindowRequests[0];
      const retryAfter = Math.ceil(
        (oldestRequest + this.config.windowMs - now) / 1000,
      );
      throw new RateLimitError(
        `Sliding window rate limit exceeded. Retry after ${retryAfter} seconds.`,
        retryAfter,
      );
    }

    this.slidingWindowRequests.push(now);
  }

  private async checkTokenBucket(now: number): Promise<void> {
    // Refill tokens based on time elapsed
    const timeSinceRefill = now - this.lastRefill;
    const tokensToAdd =
      Math.floor(timeSinceRefill / this.config.windowMs) *
      this.config.maxRequests;

    if (tokensToAdd > 0) {
      this.tokenBucketTokens = Math.min(
        this.config.maxRequests,
        this.tokenBucketTokens + tokensToAdd,
      );
      this.lastRefill = now;
    }

    if (this.tokenBucketTokens < 1) {
      const timeToNextToken =
        this.config.windowMs - (timeSinceRefill % this.config.windowMs);
      const retryAfter = Math.ceil(timeToNextToken / 1000);
      throw new RateLimitError(
        `Token bucket depleted. Retry after ${retryAfter} seconds.`,
        retryAfter,
      );
    }

    this.tokenBucketTokens -= 1;
  }

  // Get current status
  getStatus(): {
    strategy: string;
    remainingRequests: number;
    windowMs: number;
    nextRefillMs?: number;
  } {
    const now = Date.now();

    switch (this.config.strategy) {
      case "fixed":
        const windowStart =
          Math.floor(now / this.config.windowMs) * this.config.windowMs;
        const validRequests = this.fixedWindowRequests.filter(
          (time) => time >= windowStart,
        );
        return {
          strategy: "fixed",
          remainingRequests: this.config.maxRequests - validRequests.length,
          windowMs: this.config.windowMs,
          nextRefillMs: windowStart + this.config.windowMs - now,
        };

      case "sliding":
        const windowStartSliding = now - this.config.windowMs;
        const validRequestsSliding = this.slidingWindowRequests.filter(
          (time) => time > windowStartSliding,
        );
        return {
          strategy: "sliding",
          remainingRequests:
            this.config.maxRequests - validRequestsSliding.length,
          windowMs: this.config.windowMs,
        };

      case "token_bucket":
        return {
          strategy: "token_bucket",
          remainingRequests: Math.floor(this.tokenBucketTokens),
          windowMs: this.config.windowMs,
          nextRefillMs:
            this.config.windowMs -
            ((now - this.lastRefill) % this.config.windowMs),
        };

      default:
        throw new Error(
          `Unknown rate limiting strategy: ${this.config.strategy}`,
        );
    }
  }
}

// Request Queue for managing pending requests
export interface QueuedRequest {
  id: string;
  request: () => Promise<any>;
  priority: number;
  createdAt: number;
  maxRetries: number;
  retryCount: number;
  onResolve: (result: any) => void;
  onReject: (error: any) => void;
}

export interface RequestQueueConfig {
  maxConcurrency: number;
  rateLimiter?: EnhancedRateLimiter;
  defaultMaxRetries: number;
  retryDelayMs: number;
  maxQueueSize: number;
  priorityEnabled: boolean;
}

export class RequestQueue {
  private queue: QueuedRequest[] = [];
  private activeRequests = new Set<string>();
  private isProcessing = false;

  constructor(private config: RequestQueueConfig) {}

  // Add a request to the queue
  async enqueue<T>(
    request: () => Promise<T>,
    options: {
      priority?: number;
      maxRetries?: number;
      id?: string;
    } = {},
  ): Promise<T> {
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error("Request queue is full");
    }

    return new Promise<T>((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: options.id || `req_${Date.now()}_${Math.random()}`,
        request,
        priority: options.priority || 0,
        createdAt: Date.now(),
        maxRetries: options.maxRetries || this.config.defaultMaxRetries,
        retryCount: 0,
        onResolve: resolve,
        onReject: reject,
      };

      this.queue.push(queuedRequest);

      // Sort by priority if enabled (higher priority first)
      if (this.config.priorityEnabled) {
        this.queue.sort((a, b) => b.priority - a.priority);
      }

      this.processQueue();
    });
  }

  // Process the queue
  private async processQueue(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    while (
      this.queue.length > 0 &&
      this.activeRequests.size < this.config.maxConcurrency
    ) {
      const request = this.queue.shift();
      if (!request) break;

      this.activeRequests.add(request.id);
      this.executeRequest(request);
    }

    this.isProcessing = false;
  }

  // Execute a single request
  private async executeRequest(queuedRequest: QueuedRequest): Promise<void> {
    try {
      // Check rate limit if configured
      if (this.config.rateLimiter) {
        await this.config.rateLimiter.checkLimit();
      }

      const result = await queuedRequest.request();
      queuedRequest.onResolve(result);
    } catch (error) {
      if (
        error instanceof RateLimitError &&
        queuedRequest.retryCount < queuedRequest.maxRetries
      ) {
        // Retry after delay for rate limit errors
        queuedRequest.retryCount++;
        const retryAfter = error.apiResponse?.retryAfter;
        setTimeout(
          () => {
            this.queue.unshift(queuedRequest); // Add back to front of queue
            this.processQueue();
          },
          retryAfter ? retryAfter * 1000 : this.config.retryDelayMs,
        );
      } else if (
        queuedRequest.retryCount < queuedRequest.maxRetries &&
        this.shouldRetry(error)
      ) {
        // Retry for other retryable errors
        queuedRequest.retryCount++;
        setTimeout(
          () => {
            this.queue.unshift(queuedRequest);
            this.processQueue();
          },
          this.config.retryDelayMs * Math.pow(2, queuedRequest.retryCount),
        ); // Exponential backoff
      } else {
        queuedRequest.onReject(error);
      }
    } finally {
      this.activeRequests.delete(queuedRequest.id);
      this.processQueue(); // Process next requests
    }
  }

  // Determine if an error should trigger a retry
  private shouldRetry(error: any): boolean {
    if (error instanceof ExternalApiError) {
      return error.retryable;
    }
    return false;
  }

  // Get queue status
  getStatus(): {
    queueLength: number;
    activeRequests: number;
    maxConcurrency: number;
    rateLimitStatus?: any;
  } {
    return {
      queueLength: this.queue.length,
      activeRequests: this.activeRequests.size,
      maxConcurrency: this.config.maxConcurrency,
      rateLimitStatus: this.config.rateLimiter?.getStatus(),
    };
  }

  // Clear the queue
  clear(): void {
    this.queue.forEach((req) => req.onReject(new Error("Queue cleared")));
    this.queue = [];
  }

  // Pause processing
  pause(): void {
    this.isProcessing = true;
  }

  // Resume processing
  resume(): void {
    this.isProcessing = false;
    this.processQueue();
  }
}

// API Client for making HTTP requests
export class ApiClient {
  protected rateLimiter?: RateLimiter;

  constructor(
    protected baseUrl: string,
    protected authHandler: AuthHandler,
    rateLimitConfig?: RateLimitConfig,
  ) {
    if (rateLimitConfig) {
      this.rateLimiter = new RateLimiter(rateLimitConfig);
    }
  }

  async request(
    method: string,
    endpoint: string,
    options: {
      body?: any;
      headers?: Record<string, string>;
      auth?: any;
      timeout?: number;
    } = {},
  ): Promise<any> {
    // Check rate limit
    if (this.rateLimiter) {
      await this.rateLimiter.checkLimit();
    }

    // Prepare headers
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    // Apply authentication
    if (options.auth) {
      const authHeaders = await this.authHandler.authenticate(
        headers,
        options.auth,
      );
      Object.assign(headers, authHeaders);
    }

    // Build URL
    const url = new URL(endpoint, this.baseUrl).toString();

    // Make request
    try {
      const controller = new AbortController();
      const timeoutId = options.timeout
        ? setTimeout(() => controller.abort(), options.timeout)
        : null;

      const response = await fetch(url, {
        method: method.toUpperCase(),
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        let apiResponse: any;

        try {
          apiResponse = await response.json();
          if (apiResponse.message) {
            errorMessage = apiResponse.message;
          } else if (apiResponse.error) {
            errorMessage = apiResponse.error;
          }
        } catch {
          // Response is not JSON, use status text
        }

        if (response.status === 401) {
          throw new AuthenticationError(errorMessage, apiResponse);
        } else if (response.status === 429) {
          const retryAfter = response.headers.get("Retry-After");
          throw new RateLimitError(
            errorMessage,
            retryAfter ? parseInt(retryAfter) : undefined,
          );
        } else {
          throw new ExternalApiError(
            errorMessage,
            response.status,
            apiResponse,
            response.status >= 500,
          );
        }
      }

      // Parse response
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        return await response.json();
      } else {
        return await response.text();
      }
    } catch (error) {
      if (error instanceof ExternalApiError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new ExternalApiError(
          "Request timeout",
          undefined,
          undefined,
          true,
        );
      }

      throw new ExternalApiError(
        error instanceof Error ? error.message : "Unknown network error",
        undefined,
        undefined,
        true,
      );
    }
  }

  async get(
    endpoint: string,
    options?: Omit<Parameters<typeof this.request>[2], "body">,
  ) {
    return this.request("GET", endpoint, options);
  }

  async post(
    endpoint: string,
    body?: any,
    options?: Omit<Parameters<typeof this.request>[2], "body">,
  ) {
    return this.request("POST", endpoint, { ...options, body });
  }

  async put(
    endpoint: string,
    body?: any,
    options?: Omit<Parameters<typeof this.request>[2], "body">,
  ) {
    return this.request("PUT", endpoint, { ...options, body });
  }

  async patch(
    endpoint: string,
    body?: any,
    options?: Omit<Parameters<typeof this.request>[2], "body">,
  ) {
    return this.request("PATCH", endpoint, { ...options, body });
  }

  async delete(
    endpoint: string,
    options?: Omit<Parameters<typeof this.request>[2], "body">,
  ) {
    return this.request("DELETE", endpoint, options);
  }
}

// Enhanced API Client with additional utility functions
export class EnhancedApiClient extends ApiClient {
  // Utility method to build URLs with query parameters
  buildUrl(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean>,
  ): string {
    const url = new URL(endpoint, this.baseUrl);

    if (queryParams) {
      Object.entries(queryParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    return url.toString();
  }

  // Enhanced GET with query parameters
  async getWithParams(
    endpoint: string,
    queryParams?: Record<string, string | number | boolean>,
    options?: Omit<Parameters<typeof this.request>[2], "body">,
  ) {
    const url = this.buildUrl(endpoint, queryParams);
    return this.request("GET", url, options);
  }

  // Paginated request utility
  async paginate<T>(
    endpoint: string,
    options: {
      queryParams?: Record<string, string | number | boolean>;
      pageParam?: string;
      limitParam?: string;
      limit?: number;
      maxPages?: number;
      auth?: any;
    } = {},
  ): Promise<{
    data: T[];
    totalPages: number;
    currentPage: number;
    hasMore: boolean;
  }> {
    const {
      queryParams = {},
      pageParam = "page",
      limitParam = "limit",
      limit = 50,
      maxPages = 10,
      auth,
    } = options;

    const allData: T[] = [];
    let currentPage = 1;
    let hasMore = true;
    let totalPages = 1;

    while (hasMore && currentPage <= maxPages) {
      const params = {
        ...queryParams,
        [pageParam]: currentPage,
        [limitParam]: limit,
      };

      try {
        const response = await this.getWithParams(endpoint, params, { auth });

        // Handle different pagination response formats
        let pageData: T[];
        let pagination: any;

        if (response.data && Array.isArray(response.data)) {
          pageData = response.data;
          pagination = response.pagination || response.meta;
        } else if (Array.isArray(response)) {
          pageData = response;
        } else if (response.items && Array.isArray(response.items)) {
          pageData = response.items;
          pagination = response;
        } else {
          throw new ExternalApiError("Unexpected pagination response format");
        }

        allData.push(...pageData);

        // Determine if there are more pages
        if (pagination) {
          totalPages =
            pagination.totalPages || pagination.total_pages || totalPages;
          hasMore =
            pagination.hasNext ||
            pagination.has_next ||
            (pagination.page && pagination.page < totalPages) ||
            pageData.length === limit;
        } else {
          hasMore = pageData.length === limit;
        }

        currentPage++;
      } catch (error) {
        if (error instanceof ExternalApiError) {
          throw error;
        }
        throw new ExternalApiError(
          `Pagination failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
      }
    }

    return {
      data: allData,
      totalPages,
      currentPage: currentPage - 1,
      hasMore: hasMore && currentPage <= maxPages,
    };
  }

  // Upload file utility
  async uploadFile(
    endpoint: string,
    file: {
      fieldName: string;
      fileName: string;
      content: string | ArrayBuffer | Blob;
      contentType?: string;
    },
    additionalFields?: Record<string, string>,
    options?: Omit<Parameters<typeof this.request>[2], "body" | "headers">,
  ) {
    const formData = new FormData();

    // Add the file
    const blob =
      file.content instanceof Blob
        ? file.content
        : new Blob([file.content], {
            type: file.contentType || "application/octet-stream",
          });

    formData.append(file.fieldName, blob, file.fileName);

    // Add additional fields
    if (additionalFields) {
      Object.entries(additionalFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
    }

    // Don't set Content-Type for FormData - browser will set it with boundary
    return this.request("POST", endpoint, {
      ...options,
      body: formData,
    });
  }

  // Batch request utility
  async batch<T>(
    requests: Array<{
      method: string;
      endpoint: string;
      body?: any;
      headers?: Record<string, string>;
    }>,
    options: {
      auth?: any;
      concurrency?: number;
      failFast?: boolean;
    } = {},
  ): Promise<Array<{ success: boolean; data?: T; error?: ExternalApiError }>> {
    const { concurrency = 5, failFast = false, auth } = options;
    const results: Array<{
      success: boolean;
      data?: T;
      error?: ExternalApiError;
    }> = [];

    // Process requests in batches to respect concurrency
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);

      const batchPromises = batch.map(async (req) => {
        try {
          const data = await this.request(req.method, req.endpoint, {
            body: req.body,
            headers: req.headers,
            auth,
          });
          return { success: true, data };
        } catch (error) {
          const apiError =
            error instanceof ExternalApiError
              ? error
              : new ExternalApiError(
                  error instanceof Error ? error.message : "Unknown error",
                );

          if (failFast) {
            throw apiError;
          }

          return { success: false, error: apiError };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    return results;
  }

  // Health check utility
  async healthCheck(
    healthEndpoint: string = "/health",
    auth?: any,
  ): Promise<{
    healthy: boolean;
    responseTime: number;
    details?: any;
  }> {
    const startTime = Date.now();

    try {
      const response = await this.get(healthEndpoint, { auth, timeout: 5000 });
      const responseTime = Date.now() - startTime;

      return {
        healthy: true,
        responseTime,
        details: response,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      return {
        healthy: false,
        responseTime,
        details:
          error instanceof ExternalApiError ? error.apiResponse : undefined,
      };
    }
  }

  // Stream data utility (for large responses)
  async stream(
    endpoint: string,
    options: {
      auth?: any;
      onData?: (chunk: any) => void;
      onError?: (error: Error) => void;
      onEnd?: () => void;
    } = {},
  ): Promise<void> {
    const { auth, onData, onError, onEnd } = options;

    try {
      // Apply authentication
      const headers: Record<string, string> = {
        Accept: "application/json",
      };

      if (auth) {
        const authHeaders = await this.authHandler.authenticate(headers, auth);
        Object.assign(headers, authHeaders);
      }

      const url = new URL(endpoint, this.baseUrl).toString();
      const response = await fetch(url, { headers });

      if (!response.ok) {
        throw new ExternalApiError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new ExternalApiError("Response body is not readable");
      }

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            onEnd?.();
            break;
          }

          if (onData && value) {
            // Convert Uint8Array to string and try to parse as JSON
            const chunk = new TextDecoder().decode(value);
            try {
              const jsonChunk = JSON.parse(chunk);
              onData(jsonChunk);
            } catch {
              // If not JSON, pass the raw string
              onData(chunk);
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error) {
      if (onError) {
        onError(error instanceof Error ? error : new Error(String(error)));
      } else {
        throw error;
      }
    }
  }
}

// Abstract base class for external nodes
export abstract class ExternalNode implements NodeProcessor {
  protected apiClient: ApiClient;
  protected authHandler: AuthHandler;

  constructor(
    baseUrl: string,
    authHandler: AuthHandler,
    rateLimitConfig?: RateLimitConfig,
  ) {
    this.authHandler = authHandler;
    this.apiClient = new ApiClient(baseUrl, authHandler, rateLimitConfig);
  }

  // Abstract methods that must be implemented by subclasses
  abstract execute(context: NodeExecutionContext): Promise<NodeExecutionResult>;

  // Optional validation method
  async validate(settings: unknown): Promise<boolean> {
    return true;
  }

  // Optional setup/teardown methods
  async setup(): Promise<void> {
    // Default implementation - can be overridden
  }

  async teardown(): Promise<void> {
    // Default implementation - can be overridden
  }

  // Helper method to test connection
  protected async testConnection(
    auth: any,
    testEndpoint: string,
  ): Promise<boolean> {
    try {
      if (!this.authHandler.validateAuth(auth)) {
        return false;
      }

      await this.apiClient.get(testEndpoint, { auth });
      return true;
    } catch (error) {
      console.error("Connection test failed:", error);
      return false;
    }
  }

  // Helper method to handle common error patterns
  protected handleApiError(error: any): NodeExecutionResult {
    if (error instanceof AuthenticationError) {
      return {
        success: false,
        error: "Authentication failed. Please check your credentials.",
        logs: [`Authentication error: ${error.message}`],
      };
    }

    if (error instanceof RateLimitError) {
      return {
        success: false,
        error: `Rate limit exceeded. ${error.message}`,
        logs: [`Rate limit error: ${error.message}`],
      };
    }

    if (error instanceof ExternalApiError) {
      return {
        success: false,
        error: error.message,
        logs: [`API error (${error.statusCode}): ${error.message}`],
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
      logs: [
        `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}

// Connection tester utility
export class ConnectionTester {
  static async testConnection(
    connection: ConnectionDefinition,
    auth: any,
  ): Promise<boolean> {
    if (connection.testConnection) {
      return await connection.testConnection(auth);
    }

    // Default test - just validate the auth data
    try {
      connection.authSchema.parse(auth);
      return true;
    } catch {
      return false;
    }
  }
}

// Utility function to create external node definitions with simplified syntax
export function createExternalNode(config: {
  metadata: IntegrationNodeDefinition["metadata"];
  configSchema: {
    input: z.ZodSchema<any>;
    output: z.ZodSchema<any>;
    settings: z.ZodSchema<any>;
  };
  execute: (context: NodeExecutionContext) => Promise<NodeExecutionResult>;
  validate?: (settings: unknown) => Promise<boolean> | boolean;
  onInstall?: () => Promise<void>;
  onUninstall?: () => Promise<void>;
}): IntegrationNodeDefinition {
  return {
    metadata: config.metadata,
    configSchema: {
      input: {
        schema: config.configSchema.input,
        description: "Input data for the node",
      },
      output: {
        schema: config.configSchema.output,
        description: "Output data from the node",
      },
      settings: {
        schema: config.configSchema.settings,
        description: "Node configuration settings",
      },
    },
    processor: {
      execute: config.execute,
      validate: config.validate,
    },
    onInstall: config.onInstall,
    onUninstall: config.onUninstall,
  };
}
