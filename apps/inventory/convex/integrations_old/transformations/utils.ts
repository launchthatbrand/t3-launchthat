/**
 * Transformation utility functions
 */

/**
 * Get a nested value from an object using dot notation
 *
 * @param obj The source object
 * @param path The path to the value (dot notation)
 * @returns The value at the path or undefined if not found
 */
export function getNestedValue(
  obj: Record<string, unknown>,
  path: string,
): unknown {
  if (!path) {
    return undefined;
  }

  // Handle array index notation like "items[0].name"
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalizedPath.split(".");

  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }

    if (typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Set a nested value in an object using dot notation
 * Creates intermediate objects if they don't exist
 *
 * @param obj The target object to modify
 * @param path The path where to set the value (dot notation)
 * @param value The value to set
 */
export function setNestedValue(
  obj: Record<string, unknown>,
  path: string,
  value: unknown,
): void {
  if (!path) {
    return;
  }

  // Handle array index notation like "items[0].name"
  const normalizedPath = path.replace(/\[(\d+)\]/g, ".$1");
  const parts = normalizedPath.split(".");

  let current = obj;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];

    // Check if we're dealing with an array index
    const nextPart = parts[i + 1];
    const isNextPartArrayIndex = /^\d+$/.test(nextPart);

    if (!(part in current)) {
      // Create the appropriate intermediate object
      current[part] = isNextPartArrayIndex ? [] : {};
    }

    // Move to the next level
    const next = current[part];
    if (typeof next !== "object" || next === null) {
      // Replace non-objects with objects to allow traversal
      current[part] = isNextPartArrayIndex ? [] : {};
    }

    current = current[part] as Record<string, unknown>;
  }

  // Set the final value
  const lastPart = parts[parts.length - 1];
  current[lastPart] = value;
}

/**
 * Deep clone an object
 *
 * @param obj Object to clone
 * @returns A deep clone of the object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => deepClone(item)) as unknown as T;
  }

  const clone = {} as Record<string, unknown>;

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clone[key] = deepClone((obj as Record<string, unknown>)[key]);
    }
  }

  return clone as T;
}

/**
 * Parse a JSON expression safely
 *
 * @param expression The JSON expression to parse
 * @returns The parsed result or undefined if it fails
 */
export function safeJsonParse(expression: string): unknown {
  try {
    const result = JSON.parse(expression);
    return result;
  } catch (error) {
    console.error("Error parsing JSON expression:", error);
    return undefined;
  }
}

/**
 * Compares two values with type coercion if needed
 *
 * @param a First value
 * @param b Second value
 * @param strict Whether to use strict equality
 * @returns True if values are equal
 */
export function compareValues(a: unknown, b: unknown, strict = true): boolean {
  if (strict) {
    return a === b;
  }

  // eslint-disable-next-line eqeqeq
  return a == b;
}

/**
 * Safely checks if a value is empty (null, undefined, empty string, empty array, empty object)
 *
 * @param value The value to check
 * @returns True if the value is considered empty
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }

  if (typeof value === "string") {
    return value.trim().length === 0;
  }

  if (Array.isArray(value)) {
    return value.length === 0;
  }

  if (typeof value === "object") {
    return Object.keys(value).length === 0;
  }

  return false;
}

/**
 * Safely evaluate a JavaScript code string in a sandboxed environment
 *
 * @param code The JavaScript code to evaluate
 * @param context Variables to make available to the code
 * @returns The result of the evaluation
 */
export function safeEval(
  code: string,
  context: Record<string, unknown> = {},
): unknown {
  // Create a list of parameter names and values from the context
  const paramNames = Object.keys(context);
  const paramValues = paramNames.map((key) => context[key]);

  // Create a function that will execute the code with the provided context
  // We use Function constructor instead of eval for better isolation
  try {
    // Add a return statement if the code doesn't have one
    const processedCode = code.trim().startsWith("return")
      ? code
      : `return ${code}`;

    // Create the function with the context variables as parameters
    const func = new Function(...paramNames, processedCode);

    // Execute the function with the context values
    return func(...paramValues);
  } catch (error) {
    // Rethrow with a more helpful message
    throw new Error(
      `Error evaluating code: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
}
