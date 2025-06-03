/**
 * Custom error types for the Ethereum Parallel Fetcher library
 */

/**
 * Base error class for all fetcher-specific errors
 */
export abstract class FetcherError extends Error {
  abstract readonly code: string;
  
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    
    // Maintains proper stack trace for where our error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

/**
 * Error context for block range operations
 */
export interface BlockRangeContext {
  fromBlock: number;
  toBlock: number;
  chunkSize?: number;
}

/**
 * Error context for contract operations
 */
export interface ContractContext {
  contractAddress: string;
  eventName?: string;
}

/**
 * Error context for retry operations
 */
export interface RetryContext {
  attempt: number;
  maxRetries: number;
  delay?: number;
}

/**
 * Configuration validation error
 */
export class ConfigurationError extends FetcherError {
  readonly code = 'CONFIGURATION_ERROR';
  
  constructor(
    message: string,
    public readonly errors: string[]
  ) {
    super(`Invalid configuration: ${message}\nErrors: ${errors.join(', ')}`);
  }
}

/**
 * Block range validation error
 */
export class BlockRangeError extends FetcherError {
  readonly code = 'BLOCK_RANGE_ERROR';
  
  constructor(
    message: string,
    public readonly context: BlockRangeContext
  ) {
    super(
      `Block range error: ${message} ` +
      `(fromBlock: ${context.fromBlock}, toBlock: ${context.toBlock}, chunkSize: ${context.chunkSize || 'N/A'})`
    );
  }
}

/**
 * Event fetch error with detailed context
 */
export class EventFetchError extends FetcherError {
  readonly code = 'EVENT_FETCH_ERROR';
  
  constructor(
    message: string,
    public readonly context: {
      contract?: ContractContext;
      blockRange?: BlockRangeContext;
      retry?: RetryContext;
    },
    public readonly originalError?: Error
  ) {
    const contextParts: string[] = [];
    
    if (context.contract) {
      contextParts.push(
        `Contract: ${context.contract.contractAddress}` +
        (context.contract.eventName ? `, Event: ${context.contract.eventName}` : '')
      );
    }
    
    if (context.blockRange) {
      contextParts.push(
        `Blocks: ${context.blockRange.fromBlock}-${context.blockRange.toBlock}`
      );
    }
    
    if (context.retry) {
      contextParts.push(
        `Retry: ${context.retry.attempt}/${context.retry.maxRetries}`
      );
    }
    
    super(
      `${message}${contextParts.length > 0 ? ' | ' + contextParts.join(' | ') : ''}` +
      (originalError ? `\nCaused by: ${originalError.message}` : '')
    );
  }
}

/**
 * Rate limit error with backoff information
 */
export class RateLimitError extends FetcherError {
  readonly code = 'RATE_LIMIT_ERROR';
  
  constructor(
    message: string,
    public readonly retryAfter?: number,
    public readonly context?: {
      currentRate?: number;
      maxRate?: number;
    }
  ) {
    const details = [message];
    
    if (retryAfter) {
      details.push(`Retry after: ${retryAfter}ms`);
    }
    
    if (context?.currentRate && context?.maxRate) {
      details.push(`Current rate: ${context.currentRate}/${context.maxRate} requests/sec`);
    }
    
    super(details.join(' | '));
  }
}

/**
 * Provider connection error
 */
export class ProviderError extends FetcherError {
  readonly code = 'PROVIDER_ERROR';
  
  constructor(
    message: string,
    public readonly providerUrl?: string,
    public readonly originalError?: Error
  ) {
    super(
      `Provider error: ${message}` +
      (providerUrl ? ` (URL: ${providerUrl})` : '') +
      (originalError ? `\nCaused by: ${originalError.message}` : '')
    );
  }
}

/**
 * Event processing error
 */
export class ProcessingError extends FetcherError {
  readonly code = 'PROCESSING_ERROR';
  
  constructor(
    message: string,
    public readonly eventIndex: number,
    public readonly event?: unknown,
    public readonly originalError?: Error
  ) {
    super(
      `Event processing error at index ${eventIndex}: ${message}` +
      (originalError ? `\nCaused by: ${originalError.message}` : '')
    );
  }
}

/**
 * Chunk processing error with potential data truncation
 */
export class ChunkTruncationError extends FetcherError {
  readonly code = 'CHUNK_TRUNCATION_ERROR';
  
  constructor(
    public readonly chunkRange: [number, number],
    public readonly eventCount: number,
    public readonly limit: number
  ) {
    super(
      `Potential event truncation detected: Chunk ${chunkRange[0]}-${chunkRange[1]} ` +
      `returned ${eventCount} events, which meets or exceeds the limit of ${limit}. ` +
      `Consider using a smaller chunk size.`
    );
  }
}

/**
 * Parallel execution error
 */
export class ParallelExecutionError extends FetcherError {
  readonly code = 'PARALLEL_EXECUTION_ERROR';
  
  constructor(
    message: string,
    public readonly failedTasks: number,
    public readonly totalTasks: number,
    public readonly errors: Error[]
  ) {
    super(
      `Parallel execution failed: ${message} ` +
      `(${failedTasks}/${totalTasks} tasks failed)\n` +
      `First error: ${errors[0]?.message || 'Unknown error'}`
    );
  }
}

/**
 * Type guard to check if an error is a FetcherError
 */
export function isFetcherError(error: unknown): error is FetcherError {
  return error instanceof FetcherError;
}

/**
 * Type guard to check if an error is a rate limit error
 */
export function isRateLimitError(error: unknown): error is RateLimitError {
  return error instanceof RateLimitError;
}

/**
 * Type guard to check if an error is retryable
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof RateLimitError || error instanceof ProviderError) {
    return true;
  }
  
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('timeout') ||
      message.includes('network') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  
  return false;
}

/**
 * Helper to wrap unknown errors
 */
export function wrapError(error: unknown, context?: string): Error {
  if (error instanceof Error) {
    return error;
  }
  
  return new Error(
    `${context ? context + ': ' : ''}${String(error)}`
  );
}