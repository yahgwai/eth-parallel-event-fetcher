import { ethers } from 'ethers';
import { ProviderError, RateLimitError } from '../errors';

/**
 * Configuration options for RetryableProvider
 */
export interface RetryableProviderOptions {
  maxRetries?: number;
  initialRetryDelay?: number;
  maxRetryDelay?: number;
  retryJitter?: boolean;
}

/**
 * Checks if an error is a rate limit error (HTTP 429)
 */
function isRateLimitError(error: Error): boolean {
  const errorMsg = error.message.toLowerCase();
  return (
    errorMsg.includes('429') ||
    errorMsg.includes('rate limit') ||
    errorMsg.includes('too many requests') ||
    errorMsg.includes('exceeded') && errorMsg.includes('capacity') ||
    errorMsg.includes('throttled')
  );
}

/**
 * A provider wrapper that automatically retries failed requests with exponential backoff
 */
export class RetryableProvider extends ethers.providers.JsonRpcProvider {
  private readonly maxRetries: number;
  private readonly initialRetryDelay: number;
  private readonly maxRetryDelay: number;
  private readonly retryJitter: boolean;

  constructor(
    url?: string,
    network?: ethers.providers.Networkish,
    options: RetryableProviderOptions = {}
  ) {
    super(url, network);
    
    this.maxRetries = options.maxRetries ?? 3;
    this.initialRetryDelay = options.initialRetryDelay ?? 1000;
    this.maxRetryDelay = options.maxRetryDelay ?? 30000;
    this.retryJitter = options.retryJitter ?? true;
  }

  /**
   * Override the send method to add retry logic
   */
  async send(method: string, params: any[]): Promise<any> {
    return this.withRetry(() => super.send(method, params));
  }

  /**
   * Override perform to add retry logic to all RPC calls
   */
  async perform(method: string, params: any): Promise<any> {
    return this.withRetry(() => super.perform(method, params));
  }

  /**
   * Execute an operation with automatic retries and exponential backoff
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        // Only retry if not the last attempt
        if (attempt < this.maxRetries) {
          const isRateLimit = isRateLimitError(lastError);
          
          // Use longer delays for rate limit errors
          const baseDelay = isRateLimit 
            ? Math.max(this.initialRetryDelay * 2, 2000) 
            : this.initialRetryDelay;
          
          // Exponential backoff
          const backoffDelay = Math.min(
            baseDelay * Math.pow(2, attempt),
            this.maxRetryDelay
          );
          
          // Add random jitter to avoid retry storms
          let finalDelay = backoffDelay;
          if (this.retryJitter) {
            const jitter = isRateLimit ? (Math.random() * 0.6 - 0.3) : (Math.random() * 0.2 - 0.1);
            finalDelay = Math.floor(backoffDelay * (1 + jitter));
          }
          
          await new Promise(resolve => setTimeout(resolve, finalDelay));
        }
      }
    }
    
    // If we've exhausted retries, throw appropriate error
    if (lastError && isRateLimitError(lastError)) {
      throw new RateLimitError(
        `Rate limit exceeded after ${this.maxRetries} retries: ${lastError.message}`,
        undefined,
        { maxRate: this.maxRetries }
      );
    }
    
    throw new ProviderError(
      `Provider operation failed after ${this.maxRetries} retries`,
      this.connection?.url,
      lastError || undefined
    );
  }

  /**
   * Create a RetryableProvider from an existing provider's connection info
   */
  static fromProvider(
    provider: ethers.providers.JsonRpcProvider,
    options?: RetryableProviderOptions
  ): RetryableProvider {
    const connection = provider.connection;
    return new RetryableProvider(connection?.url, provider.network, options);
  }

  /**
   * Clone this provider with new retry options
   */
  cloneWithOptions(options: RetryableProviderOptions): RetryableProvider {
    return new RetryableProvider(
      this.connection?.url,
      this.network,
      {
        maxRetries: options.maxRetries ?? this.maxRetries,
        initialRetryDelay: options.initialRetryDelay ?? this.initialRetryDelay,
        maxRetryDelay: options.maxRetryDelay ?? this.maxRetryDelay,
        retryJitter: options.retryJitter ?? this.retryJitter,
      }
    );
  }
}