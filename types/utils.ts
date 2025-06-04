/**
 * Utility types for common patterns in the Ethereum Parallel Fetcher library
 */

/**
 * Makes a type's properties deeply partial
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};

/**
 * Makes a type's properties deeply readonly
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? readonly DeepReadonly<U>[]
    : T[P] extends object
      ? DeepReadonly<T[P]>
      : T[P];
};

/**
 * Represents a value that could be a promise or a regular value
 */
export type Awaitable<T> = T | Promise<T>;

/**
 * Represents a value that could be an array or a single value
 */
export type Arrayable<T> = T | T[];

/**
 * Extract the promised type from a Promise
 */
export type Unpromise<T> = T extends Promise<infer U> ? U : T;

/**
 * Extract the element type from an array
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Make specified keys required while keeping others optional
 */
export type RequireKeys<T, K extends keyof T> = T & Required<Pick<T, K>>;

/**
 * Make specified keys optional while keeping others required
 */
export type PartialKeys<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Exclude null and undefined from a type
 */
export type NonNullish<T> = T extends null | undefined ? never : T;

/**
 * Extract keys from T that have values assignable to V
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Create a union type from the values of an object type
 */
export type ValueOf<T> = T[keyof T];

/**
 * Make all properties of T mutable (remove readonly)
 */
export type Mutable<T> = {
  -readonly [P in keyof T]: T[P];
};

/**
 * Type for objects with string keys and values of type T
 */
export type StringRecord<T = unknown> = Record<string, T>;

/**
 * Type for objects with number keys and values of type T
 */
export type NumberRecord<T = unknown> = Record<number, T>;

/**
 * Represents either a successful result or an error
 */
export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

/**
 * Helper to create a successful Result
 */
export function ok<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Helper to create a failed Result
 */
export function err<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Type guard to check if a Result is successful
 */
export function isOk<T, E>(result: Result<T, E>): result is { success: true; data: T } {
  return result.success;
}

/**
 * Type guard to check if a Result is an error
 */
export function isErr<T, E>(result: Result<T, E>): result is { success: false; error: E } {
  return !result.success;
}

/**
 * Extract non-function property names from a type
 */
export type NonFunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? never : K;
}[keyof T];

/**
 * Extract function property names from a type
 */
export type FunctionPropertyNames<T> = {
  [K in keyof T]: T[K] extends (...args: unknown[]) => unknown ? K : never;
}[keyof T];

/**
 * Pick only non-function properties from a type
 */
export type NonFunctionProperties<T> = Pick<T, NonFunctionPropertyNames<T>>;

/**
 * Pick only function properties from a type
 */
export type FunctionProperties<T> = Pick<T, FunctionPropertyNames<T>>;

/**
 * Type for constructor functions
 */
export type Constructor<T = object> = new (...args: unknown[]) => T;

/**
 * Type for abstract constructor functions
 */
export type AbstractConstructor<T = object> = abstract new (...args: unknown[]) => T;

/**
 * Get the instance type of a constructor function type
 */
export type InstanceType<T extends AbstractConstructor> =
  T extends AbstractConstructor<infer U> ? U : never;

/**
 * Merge two types, with properties from the second type overwriting the first
 */
export type Merge<T, U> = Omit<T, keyof U> & U;

/**
 * Create a type with a subset of properties from T
 */
export type Subset<T, K extends keyof T = keyof T> = {
  [P in K]: T[P];
};

/**
 * Ensure that a type has at least one of the specified properties
 */
export type RequireAtLeastOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Pick<T, Exclude<Keys, K>>>;
  }[Keys];

/**
 * Ensure that a type has exactly one of the specified properties
 */
export type RequireExactlyOne<T, Keys extends keyof T = keyof T> = Pick<T, Exclude<keyof T, Keys>> &
  {
    [K in Keys]-?: Required<Pick<T, K>> & Partial<Record<Exclude<Keys, K>, undefined>>;
  }[Keys];

/**
 * Type predicate function type
 */
export type TypePredicate<T, U extends T> = (value: T) => value is U;

/**
 * Type guard function type
 */
export type TypeGuard<T> = (value: unknown) => value is T;

/**
 * Callback function type
 */
export type Callback<T = void> = (error: Error | null, result?: T) => void;

/**
 * Async callback function type
 */
export type AsyncCallback<T = void> = (error: Error | null, result?: T) => Promise<void>;

/**
 * JSON-compatible types
 */
export type JsonPrimitive = string | number | boolean | null;
export type JsonObject = { [key: string]: JsonValue };
export type JsonArray = JsonValue[];
export type JsonValue = JsonPrimitive | JsonObject | JsonArray;

/**
 * Make a type JSON-compatible by removing non-JSON types
 */
export type Jsonify<T> = T extends JsonValue
  ? T
  : T extends (...args: unknown[]) => unknown
    ? never
    : T extends object
      ? { [K in keyof T]: Jsonify<T[K]> }
      : never;
