import { ethers } from 'ethers';
import { FetcherConfig, LogFilter, GetLogsOptions, LogChunkResult } from '../types';
import { executeInParallel, createBlockRangeChunks } from './utils/parallel';
import { createConfig, validateConfig } from './config';
import {
  ConfigurationError,
  EventFetchError,
  ChunkTruncationError,
  BlockRangeError,
} from './errors';

/**
 * Generic event fetcher implementation that can work with any Ethereum contract events
 */
export class GenericEventFetcher {
  private config: Required<FetcherConfig>;
  private provider: ethers.providers.Provider;

  /**
   * Creates a new instance of GenericEventFetcher
   */
  constructor(provider: ethers.providers.Provider, config: Partial<FetcherConfig> = {}) {
    this.config = createConfig(config);
    this.provider = provider;

    const validation = validateConfig(this.config);
    if (!validation.valid) {
      throw new ConfigurationError('Configuration validation failed', validation.errors);
    }
  }

  /**
   * Get logs using ethers-like interface with parallel processing and retry logic
   */
  async getLogs(filter: LogFilter, options: GetLogsOptions = {}): Promise<ethers.providers.Log[]> {
    const provider = this.provider;

    const fromBlock = await this.resolveBlockTag(filter.fromBlock ?? 0, provider);
    const toBlock = await this.resolveBlockTag(filter.toBlock ?? 'latest', provider);

    if (fromBlock > toBlock) {
      throw new BlockRangeError('fromBlock cannot be greater than toBlock', {
        fromBlock,
        toBlock,
      });
    }

    const mergedConfig = {
      ...this.config,
      ...options,
    };

    const blockRangeChunks = createBlockRangeChunks(
      fromBlock,
      toBlock,
      options.chunkSize ?? mergedConfig.chunkSize
    );
    const totalChunks = blockRangeChunks.length;

    if (mergedConfig.showProgress) {
      console.log(
        `Fetching logs from blocks ${fromBlock.toLocaleString()} to ${toBlock.toLocaleString()} in ${totalChunks} chunks`
      );
    }

    const tasks = blockRangeChunks.map(([chunkFromBlock, chunkToBlock]) => {
      return async (): Promise<LogChunkResult> => {
        try {
          let logs: ethers.providers.Log[] = [];

          try {
            const chunkFilter: ethers.providers.Filter = {
              address: filter.address,
              topics: filter.topics,
              fromBlock: chunkFromBlock,
              toBlock: chunkToBlock,
            };

            const chunkLogs = await provider.getLogs(chunkFilter);
            logs.push(...chunkLogs);
          } catch (err) {
            const error = new EventFetchError(
              'Failed to query logs',
              {
                blockRange: { fromBlock: chunkFromBlock, toBlock: chunkToBlock },
              },
              err instanceof Error ? err : new Error(String(err))
            );

            if (mergedConfig.showProgress) {
              console.error(error.message);
            }
            throw error;
          }

          if (logs.length >= mergedConfig.maxLogsPerChunk) {
            throw new ChunkTruncationError(
              [chunkFromBlock, chunkToBlock],
              logs.length,
              mergedConfig.maxLogsPerChunk
            );
          }

          return {
            logs: logs,
            chunkRange: [chunkFromBlock, chunkToBlock],
          };
        } catch (error) {
          if (mergedConfig.showProgress) {
            console.error(
              `Error fetching logs for blocks ${chunkFromBlock}-${chunkToBlock}:`,
              error
            );
          }

          if (error instanceof Error && error.name.includes('Error')) {
            throw error;
          }

          throw new EventFetchError(
            'Failed to fetch logs for chunk',
            {
              blockRange: { fromBlock: chunkFromBlock, toBlock: chunkToBlock },
            },
            error instanceof Error ? error : new Error(String(error))
          );
        }
      };
    });

    if (mergedConfig.showProgress) {
      console.log(`Starting parallel execution with concurrency: ${mergedConfig.concurrency}`);
    }

    const results = await executeInParallel(tasks, {
      concurrency: mergedConfig.concurrency,
      label: 'Fetching logs',
      showProgress: mergedConfig.showProgress,
      maxRetries: mergedConfig.maxRetries ?? 5,
      continueOnError: mergedConfig.continueOnError,
      onProgress: (completed, total) => {
        if (options.onProgress) {
          options.onProgress(completed, total, [fromBlock, toBlock]);
        }
        if (mergedConfig.progressCallback) {
          mergedConfig.progressCallback(completed, total, [fromBlock, toBlock]);
        }
      },
    });

    let totalLogs = 0;
    const allLogs: ethers.providers.Log[] = [];

    results.forEach((result) => {
      const { logs } = result;
      allLogs.push(...logs);
      totalLogs += logs.length;
    });

    if (mergedConfig.showProgress) {
      console.log(
        `Completed fetching logs. Found ${totalLogs} logs across ${results.length} chunks.`
      );
    }

    return allLogs;
  }

  /**
   * Helper to resolve block tags to block numbers
   */
  private async resolveBlockTag(
    blockTag: number | string,
    provider: ethers.providers.Provider
  ): Promise<number> {
    if (typeof blockTag === 'number') {
      return blockTag;
    }

    if (blockTag === 'latest') {
      return await provider.getBlockNumber();
    }

    if (blockTag === 'earliest') {
      return 0;
    }

    if (blockTag === 'pending') {
      throw new Error('Pending block tag is not supported for historical queries');
    }

    const parsed = parseInt(blockTag, 10);
    if (!isNaN(parsed)) {
      return parsed;
    }

    throw new Error(`Invalid block tag: ${blockTag}`);
  }

  /**
   * Update the fetcher configuration
   */
  updateConfig(newConfig: Partial<FetcherConfig>): void {
    const updatedConfig = createConfig({
      ...this.config,
      ...newConfig,
    });
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
