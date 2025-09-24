import { ethers } from 'ethers';

/**
 * Configuration for event fetching
 */
export interface FetcherConfig {
  concurrency?: number;
  chunkSize?: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  rateLimitPerSecond?: number;
  showProgress?: boolean;
  progressCallback?: (completed: number, total: number, currentChunk: [number, number]) => void;
  continueOnError?: boolean;
  maxLogsPerChunk?: number;
}

/**
 * Ethereum log filter matching ethers.js Filter interface
 */
export interface LogFilter {
  address?: string;
  topics?: Array<string | Array<string> | null>;
  fromBlock?: number | string;
  toBlock?: number | string;
  blockHash?: string;
}

/**
 * Options for getLogs method
 */
export interface GetLogsOptions {
  chunkSize?: number;
  concurrency?: number;
  maxRetries?: number;
  initialRetryDelay?: number;
  rateLimitPerSecond?: number;
  showProgress?: boolean;
  onProgress?: (completed: number, total: number, chunk: [number, number]) => void;
  continueOnError?: boolean;
  maxLogsPerChunk?: number;
}

/**
 * Result of a single log chunk fetch operation
 */
export interface LogChunkResult {
  logs: ethers.providers.Log[];
  chunkRange: [number, number];
  retries?: number;
  duration?: number;
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