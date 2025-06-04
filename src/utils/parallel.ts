import pLimit from 'p-limit';
import { ParallelExecutionOptions, TaskFunction, TaskResult, BlockRange } from '../../types';
import { BlockRangeError } from '../errors';

/**
 * Default options for parallel execution
 */
const DEFAULT_PARALLEL_OPTIONS: Required<Pick<ParallelExecutionOptions, 'concurrency' | 'continueOnError' | 'maxRetries' | 'showProgress'>> = {
  concurrency: 5,
  continueOnError: false,
  maxRetries: 3,
  showProgress: true
};

/**
 * Identifies if an error is likely a rate limit error
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
 * Manages task execution state and results
 */
export class TaskQueue<T> {
  private results: Map<number, T> = new Map();
  private errors: Error[] = [];
  private completedCount = 0;
  private rateLimited = false;

  addResult(index: number, result: T): void {
    this.results.set(index, result);
    this.completedCount++;
  }

  addError(error: Error): void {
    this.errors.push(error);
  }

  incrementCompleted(): void {
    this.completedCount++;
  }

  getResult(index: number): T | undefined {
    return this.results.get(index);
  }

  getAllResults(): (T | undefined)[] {
    const resultArray: (T | undefined)[] = [];
    const maxIndex = Math.max(...Array.from(this.results.keys()), -1);
    
    for (let i = 0; i <= maxIndex; i++) {
      resultArray.push(this.results.get(i));
    }
    
    return resultArray;
  }

  getErrors(): Error[] {
    return this.errors;
  }

  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  getCompletedCount(): number {
    return this.completedCount;
  }

  setRateLimited(value: boolean): void {
    this.rateLimited = value;
  }

  isRateLimited(): boolean {
    return this.rateLimited;
  }
}

/**
 * Handles parallel execution of tasks with retry logic and concurrency control
 */
export class ParallelExecutor<T> {
  private options: ParallelExecutionOptions & {
    concurrency: number;
    continueOnError: boolean;
    maxRetries: number;
    showProgress: boolean;
    label: string;
    retryDelay: number;
    maxRetryDelay: number;
  };
  private taskQueue: TaskQueue<T>;
  private currentConcurrency: number;
  private consecutiveRateLimitErrors = 0;

  constructor(options: ParallelExecutionOptions = {}) {
    this.options = {
      concurrency: options.concurrency ?? DEFAULT_PARALLEL_OPTIONS.concurrency,
      continueOnError: options.continueOnError ?? DEFAULT_PARALLEL_OPTIONS.continueOnError,
      maxRetries: options.maxRetries ?? DEFAULT_PARALLEL_OPTIONS.maxRetries,
      showProgress: options.showProgress ?? DEFAULT_PARALLEL_OPTIONS.showProgress,
      label: options.label ?? 'Tasks',
      onProgress: options.onProgress,
      retryDelay: options.retryDelay ?? 1000,
      maxRetryDelay: options.maxRetryDelay ?? 60000
    };
    
    this.currentConcurrency = this.options.concurrency;
    this.taskQueue = new TaskQueue<T>();
  }

  /**
   * Execute tasks in parallel with retry logic
   */
  async execute(tasks: TaskFunction<T>[]): Promise<T[]> {
    if (tasks.length === 0) {
      return [];
    }

    const limit = pLimit(this.currentConcurrency);
    
    const limitedTasks = tasks.map((task, index) => 
      limit(async () => {
        try {
          const result = await this.executeWithRetry(task, index);
          this.taskQueue.addResult(index, result);
          this.reportProgress(tasks.length);
          return result;
        } catch (error) {
          this.handleTaskError(error, index);
          
          if (this.options.continueOnError) {
            this.taskQueue.incrementCompleted();
            this.reportProgress(tasks.length);
            return undefined;
          } else {
            throw error;
          }
        }
      })
    );

    try {
      await Promise.all(limitedTasks);
      
      if (this.taskQueue.hasErrors() && this.options.continueOnError) {
        console.warn(`Parallel execution completed with ${this.taskQueue.getErrors().length} errors`);
      }
      
      return this.taskQueue.getAllResults().filter(result => result !== undefined);
    } catch (error) {
      console.error(`Parallel execution failed:`, error);
      throw error;
    }
  }

  /**
   * Execute a single task with retry logic
   */
  private async executeWithRetry(task: TaskFunction<T>, index: number): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        const result = await task();
        this.consecutiveRateLimitErrors = 0;
        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.options.maxRetries) {
          await this.handleRetry(lastError, index, attempt);
        }
      }
    }
    
    throw lastError || new Error(`Task ${index} failed after ${this.options.maxRetries} retries`);
  }

  /**
   * Handle retry logic with exponential backoff
   */
  private async handleRetry(error: Error, index: number, attempt: number): Promise<void> {
    const isRateLimit = isRateLimitError(error);
    
    if (isRateLimit) {
      this.handleRateLimit();
      const delay = Math.min(
        2000 * Math.pow(2, attempt) * (1 + Math.random() * 0.3),
        this.options.maxRetryDelay
      );
      
      if (this.options.showProgress) {
        const reduced = this.taskQueue.isRateLimited() ? 'Reduced concurrency. ' : '';
        console.warn(`Rate limit on task ${index} (attempt ${attempt + 1}/${this.options.maxRetries + 1}). ${reduced}Retrying in ${Math.round(delay/1000)}s`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    } else {
      const delay = Math.min(
        this.options.retryDelay * Math.pow(2, attempt),
        this.options.maxRetryDelay
      );
      
      if (this.options.showProgress) {
        console.warn(`Task ${index} failed (attempt ${attempt + 1}/${this.options.maxRetries + 1}): ${error.message}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Handle rate limiting by reducing concurrency
   */
  private handleRateLimit(): void {
    this.consecutiveRateLimitErrors++;
    
    if (this.consecutiveRateLimitErrors >= 3 && this.currentConcurrency > 1) {
      const newConcurrency = Math.max(1, Math.floor(this.currentConcurrency * 0.7));
      
      if (this.options.showProgress) {
        console.warn(`Reducing concurrency from ${this.currentConcurrency} to ${newConcurrency} due to rate limiting`);
      }
      
      this.currentConcurrency = newConcurrency;
      this.taskQueue.setRateLimited(true);
    }
  }

  /**
   * Handle task errors
   */
  private handleTaskError(error: unknown, index: number): void {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    if (this.options.showProgress) {
      console.error(`Task ${index} failed after all retries:`, errorObj);
    }
    this.taskQueue.addError(errorObj);
  }

  /**
   * Report progress if enabled
   */
  private reportProgress(totalTasks: number): void {
    const completed = this.taskQueue.getCompletedCount();
    
    if (this.options.onProgress) {
      this.options.onProgress(completed, totalTasks);
    }
    
    if (this.options.showProgress && 
        (completed % Math.max(1, Math.floor(totalTasks / 10)) === 0 || 
         completed === totalTasks)) {
      const percentage = ((completed / totalTasks) * 100).toFixed(1);
      console.log(`${this.options.label}: ${completed}/${totalTasks} (${percentage}%)`);
    }
  }
}

/**
 * Execute an array of async tasks in parallel with concurrency control and retry logic
 * 
 * This function maintains backward compatibility while using the new OOP implementation
 */
export async function executeInParallel<T>(
  tasks: TaskFunction<T>[],
  options: ParallelExecutionOptions = {}
): Promise<T[]> {
  const executor = new ParallelExecutor<T>(options);
  return executor.execute(tasks);
}

/**
 * Split an array into chunks for parallel processing
 */
export function chunkArray<T>(items: T[], chunkSize: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * Divides a block range into chunks of the specified size
 */
export function createBlockRangeChunks(
  startBlock: number,
  endBlock: number,
  chunkSize: number = 10000
): BlockRange[] {
  if (startBlock > endBlock) {
    throw new BlockRangeError(
      'Start block must be less than or equal to end block',
      { fromBlock: startBlock, toBlock: endBlock, chunkSize }
    );
  }

  if (chunkSize <= 0) {
    throw new BlockRangeError(
      'Chunk size must be positive',
      { fromBlock: startBlock, toBlock: endBlock, chunkSize }
    );
  }

  const chunks: BlockRange[] = [];
  for (let i = startBlock; i <= endBlock; i += chunkSize) {
    const chunkEnd = Math.min(i + chunkSize - 1, endBlock);
    chunks.push([i, chunkEnd]);
  }

  return chunks;
}