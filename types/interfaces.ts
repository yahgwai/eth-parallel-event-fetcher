import { ethers } from 'ethers';

/**
 * Generic provider interface that abstracts ethers provider functionality
 */
export interface ProviderInterface {
  queryFilter(
    filter: ethers.EventFilter,
    fromBlock?: number,
    toBlock?: number
  ): Promise<ethers.Event[]>;
}

/**
 * Generic event filter configuration
 */
export interface EventFilter<TAddress extends string = string> {
  address: TAddress;
  fromBlock: number;
  toBlock: number;
}

/**
 * Generic raw event as returned by provider
 */
export interface RawEvent<TArgs = Record<string, unknown>> {
  args: TArgs;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
}

/**
 * Generic contract interface
 */
export interface ContractInterface<TAddress extends string = string> {
  address: TAddress;
  filters: Record<string, () => ethers.EventFilter>;
  queryFilter(
    filter: ethers.EventFilter,
    fromBlock?: number,
    toBlock?: number
  ): Promise<ethers.Event[]>;
}

/**
 * Configuration for event fetching
 */
export interface FetcherConfig {
  // Concurrency and performance
  concurrency?: number;
  chunkSize?: number;

  // Retry configuration
  maxRetries?: number;
  initialRetryDelay?: number;

  // Rate limiting
  rateLimitPerSecond?: number;

  // Progress tracking
  showProgress?: boolean;
  progressCallback?: (completed: number, total: number, currentChunk: [number, number]) => void;

  // Error handling
  continueOnError?: boolean;
  maxLogsPerChunk?: number;
}

/**
 * Options for fetching events
 */
export interface EventFetcherOptions<TAddress extends string = string> {
  fromBlock: number;
  toBlock: number;
  contractAddress: TAddress;
  chunkSize?: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  onProgress?: (completed: number, total: number, chunk: [number, number]) => void;
}

/**
 * Result of a single chunk fetch operation
 */
export interface ChunkFetchResult<TEvent extends RawEvent = RawEvent> {
  events: TEvent[];
  chunkRange: [number, number];
  retries?: number;
  duration?: number;
}

/**
 * Generic event fetcher interface
 */
export interface EventFetcher<
  TRawEvent extends RawEvent = RawEvent,
  TAddress extends string = string,
> {
  fetchEvents(
    contract: ContractInterface<TAddress>,
    eventName: string,
    options: EventFetcherOptions<TAddress>
  ): Promise<TRawEvent[]>;
}

/**
 * Block range chunk type
 */
export type BlockRange = [number, number];

/**
 * Task function type for parallel execution
 */
export type TaskFunction<T> = () => Promise<T>;

/**
 * Parallel execution options
 */
export interface ParallelExecutionOptions {
  concurrency?: number;
  label?: string;
  showProgress?: boolean;
  maxRetries?: number;
  continueOnError?: boolean;
  onProgress?: (completed: number, total: number) => void;
  retryDelay?: number;
  maxRetryDelay?: number;
}

/**
 * Task result with metadata
 */
export interface TaskResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  retries?: number;
  duration?: number;
}
