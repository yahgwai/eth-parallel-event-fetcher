import { ethers } from 'ethers';
import {
  ContractInterface,
  EventFetcherOptions,
  FetcherConfig,
  ChunkFetchResult,
  RawEvent,
} from '../types';
import { executeInParallel, createBlockRangeChunks } from './utils/parallel';
import { createConfig, validateConfig } from './config';
import { ConfigurationError, EventFetchError, ChunkTruncationError } from './errors';

/**
 * Generic event fetcher implementation that can work with any Ethereum contract events
 */
export class GenericEventFetcher<
  TRawEvent extends RawEvent = RawEvent,
  TAddress extends string = string,
> {
  private config: Required<FetcherConfig>;

  /**
   * Creates a new instance of GenericEventFetcher
   */
  constructor(config: Partial<FetcherConfig> = {}) {
    this.config = createConfig(config);

    // Validate configuration
    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new ConfigurationError('Configuration validation failed', validation.errors);
    }
  }

  /**
   * Fetch events from a contract with parallel processing and retry logic
   */
  async fetchEvents(
    contract: ContractInterface<TAddress>,
    eventName: string,
    options: EventFetcherOptions<TAddress>
  ): Promise<TRawEvent[]> {
    const {
      fromBlock,
      toBlock,
      contractAddress,
      chunkSize = this.config.chunkSize,
      onProgress,
    } = options;

    // Create chunks for querying
    const blockRangeChunks = createBlockRangeChunks(fromBlock, toBlock, chunkSize);
    const totalChunks = blockRangeChunks.length;

    if (this.config.showProgress) {
      console.log(
        `Fetching ${eventName} events from blocks ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()} in ${totalChunks} chunks`
      );
    }

    // Create tasks for parallel execution
    const tasks = blockRangeChunks.map(([chunkFromBlock, chunkToBlock]) => {
      return async (): Promise<ChunkFetchResult<TRawEvent>> => {
        try {
          let events: TRawEvent[];
          try {
            // Get the proper event signature using the contract's filters method
            const eventSignatureFilter = contract.filters[eventName]();

            // Create the filter for this chunk
            const filter: ethers.EventFilter = {
              address: contractAddress as string,
              topics: eventSignatureFilter.topics,
            };

            // Query the events for this chunk
            const rawEvents = await contract.queryFilter(filter, chunkFromBlock, chunkToBlock);

            events = rawEvents as unknown as TRawEvent[];
          } catch (err) {
            const error = new EventFetchError(
              'Failed to query events',
              {
                contract: { contractAddress: contractAddress as string, eventName },
                blockRange: { fromBlock: chunkFromBlock, toBlock: chunkToBlock },
              },
              err instanceof Error ? err : new Error(String(err))
            );

            if (this.config.showProgress) {
              console.error(error.message);
            }
            throw error;
          }

          // Check for potential truncation
          if (events.length >= this.config.maxLogsPerChunk) {
            throw new ChunkTruncationError(
              [chunkFromBlock, chunkToBlock],
              events.length,
              this.config.maxLogsPerChunk
            );
          }

          return {
            events,
            chunkRange: [chunkFromBlock, chunkToBlock],
          };
        } catch (error) {
          if (this.config.showProgress) {
            console.error(
              `Error fetching ${eventName} events for blocks ${chunkFromBlock}-${chunkToBlock}:`,
              error
            );
          }

          // Re-throw if already a FetcherError
          if (error instanceof Error && error.name.includes('Error')) {
            throw error;
          }

          throw new EventFetchError(
            'Failed to fetch events for chunk',
            {
              contract: { contractAddress: contractAddress as string, eventName },
              blockRange: { fromBlock: chunkFromBlock, toBlock: chunkToBlock },
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      };
    });

    // Execute tasks in parallel with concurrency control
    if (this.config.showProgress) {
      console.log(`Starting parallel execution with concurrency: ${this.config.concurrency}`);
    }

    const results = await executeInParallel(tasks, {
      concurrency: this.config.concurrency,
      label: `Fetching ${eventName} events`,
      showProgress: this.config.showProgress,
      maxRetries: 5,
      continueOnError: this.config.continueOnError,
      onProgress: (completed, total) => {
        if (onProgress) {
          onProgress(completed, total, [fromBlock, toBlock]);
        }
        if (this.config.progressCallback) {
          this.config.progressCallback(completed, total, [fromBlock, toBlock]);
        }
      },
    });

    // Process results
    let totalEvents = 0;
    const allRawEvents: TRawEvent[] = [];

    results.forEach((result) => {
      const { events } = result;
      allRawEvents.push(...events);
      totalEvents += events.length;
    });

    // Log completion
    if (this.config.showProgress) {
      console.log(
        `Completed fetching ${eventName} events. Found ${totalEvents} events across ${results.length} chunks.`
      );
    }

    return allRawEvents;
  }

  /**
   * Update the fetcher configuration
   */
  updateConfig(newConfig: Partial<FetcherConfig>): void {
    const updatedConfig = createConfig({
      ...this.config,
      ...newConfig,
    });

    // Validate the new configuration
    const validation = validateConfig(updatedConfig);
    if (!validation.valid) {
      throw new ConfigurationError('Configuration validation failed', validation.errors);
    }

    this.config = updatedConfig;
  }

  /**
   * Get current configuration
   */
  getConfig(): Required<FetcherConfig> {
    return { ...this.config };
  }
}
