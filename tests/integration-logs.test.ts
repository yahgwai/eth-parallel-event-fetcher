import { ethers } from 'ethers';
import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { LogFilter, FetchLogsOptions, Log } from '../types';
import { testProvider, USDC_ADDRESS, TEST_FROM_BLOCK, TEST_TO_BLOCK } from './setup';

describe('Integration - fetchLogs', () => {
  let fetcher: GenericEventFetcher;

  beforeAll(async () => {
    const config = {
      ...DEFAULT_CONFIG,
      maxLogsPerChunk: 1000,
      chunkSize: 1000,
      showProgress: false,
    };

    fetcher = new GenericEventFetcher(testProvider, config);
  }, 10000);

  describe('real log fetching', () => {
    it('should fetch USDC Transfer logs using fetchLogs', async () => {
      const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

      const filter: LogFilter = {
        address: USDC_ADDRESS,
        topics: [transferTopic],
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 10,
      };

      const logs = await fetcher.fetchLogs(filter);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);

      if (logs.length > 0) {
        const firstLog = logs[0];
        expect(firstLog).toHaveProperty('blockNumber');
        expect(firstLog).toHaveProperty('blockHash');
        expect(firstLog).toHaveProperty('transactionHash');
        expect(firstLog).toHaveProperty('address');
        expect(firstLog).toHaveProperty('topics');
        expect(firstLog).toHaveProperty('data');
        expect(firstLog).toHaveProperty('logIndex');
        expect(firstLog).toHaveProperty('transactionIndex');
        expect(firstLog).toHaveProperty('removed');

        expect(firstLog.address.toLowerCase()).toBe(USDC_ADDRESS.toLowerCase());
        expect(firstLog.topics[0]).toBe(transferTopic);
      }
    }, 30000);

    it('should return proper Log structure with all expected fields', async () => {
      const filter: LogFilter = {
        address: USDC_ADDRESS,
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 5,
      };

      const logs = await fetcher.fetchLogs(filter);

      if (logs.length > 0) {
        const log = logs[0];
        expect(typeof log.blockNumber).toBe('number');
        expect(typeof log.blockHash).toBe('string');
        expect(typeof log.transactionHash).toBe('string');
        expect(typeof log.address).toBe('string');
        expect(Array.isArray(log.topics)).toBe(true);
        expect(typeof log.data).toBe('string');
        expect(typeof log.logIndex).toBe('number');
        expect(typeof log.transactionIndex).toBe('number');
        expect(typeof log.removed).toBe('boolean');
      }
    }, 30000);


    it('should handle block range with no logs', async () => {
      const nonExistentAddress = '0x0000000000000000000000000000000000000001';

      const filter: LogFilter = {
        address: nonExistentAddress,
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 10,
      };

      const logs = await fetcher.fetchLogs(filter);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
      expect(logs.length).toBe(0);
    }, 30000);
  });

  describe('options handling in real environment', () => {
    it('should respect custom chunk size', async () => {
      const filter: LogFilter = {
        address: USDC_ADDRESS,
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 100,
      };

      const options: FetchLogsOptions = {
        chunkSize: 20,
      };

      const logs = await fetcher.fetchLogs(filter, options);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    }, 30000);

    it('should call progress callback during fetching', async () => {
      const progressUpdates: Array<{ completed: number; total: number }> = [];

      const filter: LogFilter = {
        address: USDC_ADDRESS,
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 100,
      };

      const options: FetchLogsOptions = {
        chunkSize: 25,
        onProgress: (completed, total) => {
          progressUpdates.push({ completed, total });
        },
      };

      await fetcher.fetchLogs(filter, options);

      expect(progressUpdates.length).toBeGreaterThan(0);
      const lastUpdate = progressUpdates[progressUpdates.length - 1];
      expect(lastUpdate.completed).toBe(lastUpdate.total);
    }, 30000);
  });

  describe('comparison with provider.getLogs', () => {
    it('should return same results as direct provider.getLogs for single chunk', async () => {
      const filter = {
        address: USDC_ADDRESS,
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 10,
      };

      const [fetcherLogs, providerLogs] = await Promise.all([
        fetcher.fetchLogs(filter),
        testProvider.getLogs(filter),
      ]);

      expect(fetcherLogs.length).toBe(providerLogs.length);

      for (let i = 0; i < fetcherLogs.length; i++) {
        expect(fetcherLogs[i].transactionHash).toBe(providerLogs[i].transactionHash);
        expect(fetcherLogs[i].logIndex).toBe(providerLogs[i].logIndex);
        expect(fetcherLogs[i].blockNumber).toBe(providerLogs[i].blockNumber);
      }
    }, 30000);

    it('should maintain chronological order with multiple chunks', async () => {
      const filter: LogFilter = {
        address: USDC_ADDRESS,
        fromBlock: TEST_FROM_BLOCK,
        toBlock: TEST_FROM_BLOCK + 100,
      };

      const options: FetchLogsOptions = {
        chunkSize: 20,
      };

      const logs = await fetcher.fetchLogs(filter, options);

      for (let i = 1; i < logs.length; i++) {
        const prevLog = logs[i - 1];
        const currentLog = logs[i];

        const isValidOrder =
          currentLog.blockNumber > prevLog.blockNumber ||
          (currentLog.blockNumber === prevLog.blockNumber &&
            currentLog.transactionIndex >= prevLog.transactionIndex);

        expect(isValidOrder).toBe(true);
      }
    }, 30000);
  });

  describe('block tag resolution with real provider', () => {
    it('should resolve latest block tag', async () => {
      const currentBlock = await testProvider.getBlockNumber();

      const filter: LogFilter = {
        address: USDC_ADDRESS,
        fromBlock: currentBlock - 10,
        toBlock: 'latest',
      };

      const logs = await fetcher.fetchLogs(filter);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    }, 30000);

    it('should resolve earliest block tag', async () => {
      const filter: LogFilter = {
        address: USDC_ADDRESS,
        fromBlock: 'earliest',
        toBlock: 100,
      };

      const logs = await fetcher.fetchLogs(filter);

      expect(logs).toBeDefined();
      expect(Array.isArray(logs)).toBe(true);
    }, 30000);
  });
});