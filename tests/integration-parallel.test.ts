import { ethers } from 'ethers';
import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { ContractInterface, RawEvent } from '../types';
import { testProvider } from './setup';

interface TestEvent extends RawEvent {
  address: string;
  topics: string[];
  data: string;
  args: any;
}

describe('Integration - Parallel Processing', () => {
  let fetcher: GenericEventFetcher<TestEvent>;
  let usdcContract: ContractInterface;

  beforeAll(async () => {
    const config = {
      ...DEFAULT_CONFIG,
      maxLogsPerChunk: 500,
      chunkSize: 2000,
      concurrency: 3,
      showProgress: true
    };

    fetcher = new GenericEventFetcher(config);
    
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    usdcContract = {
      address: usdcAddress,
      filters: {
        Transfer: () => ({
          topics: [transferEventTopic]
        } as ethers.EventFilter)
      },
      queryFilter: async (filter: ethers.EventFilter, fromBlock?: number, toBlock?: number) => {
        const logs = await testProvider.getLogs({
          ...filter,
          fromBlock,
          toBlock
        });
        return logs.map(log => ({
          ...log,
          args: {} 
        })) as ethers.Event[];
      }
    };
  });

  afterAll(async () => {
    // No need to clean up provider - using shared testProvider from setup.ts
  });

  it('should fetch events using multiple parallel chunks', async () => {
    const progressUpdates: Array<{completed: number, total: number}> = [];
    
    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18506000,
        onProgress: (completed, total, chunk) => {
          progressUpdates.push({ completed, total });
        }
      }
    );

    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);

    expect(progressUpdates.length).toBeGreaterThan(1);
    expect(progressUpdates[progressUpdates.length - 1].completed).toBe(progressUpdates[progressUpdates.length - 1].total);

    // Transform events after fetching if needed
    const processedEvents = events.map(event => ({
      ...event,
      chunkInfo: `Processed from ${usdcContract.address}`
    }));

    const firstEvent = processedEvents[0];
    expect(firstEvent).toHaveProperty('address');
    expect(firstEvent).toHaveProperty('blockNumber');
    expect(firstEvent).toHaveProperty('transactionHash');
    expect(firstEvent).toHaveProperty('chunkInfo');
    expect(firstEvent.address.toLowerCase()).toBe(usdcContract.address.toLowerCase());
  }, 45000);

  // This test is mentioned in BUGFIXES.md as demonstrating the ordering issue
  it('should maintain event order across chunks with high concurrency', async () => {
    // Use a custom fetcher with smaller chunks to ensure multiple chunks are used
    const customFetcher = new GenericEventFetcher<TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 100,    // 10k blocks / 100 = 100 chunks (many chunks to test ordering across chunks)
      concurrency: 10,   // High concurrency to increase chance of out-of-order completion
      showProgress: false // No progress output - this might be causing the hang
    });

    const events = await customFetcher.fetchEvents(
      usdcContract,
      'Transfer',
      {
        contractAddress: usdcContract.address,
        fromBlock: 18000000,  // Known range with many events (59k+)
        toBlock: 18009999     // 10k blocks with 500 block chunks = 20 chunks
      }
    );

    // Events are now returned directly
    expect(events.length).toBeGreaterThan(100); // Should have many events
    
    // Check if events are in chronological order
    const eventsByBlock = events.map(e => e.blockNumber);
    const sortedEventsByBlock = [...eventsByBlock].sort((a, b) => a - b);
    
    // This should pass - events are sorted by block number
    expect(eventsByBlock).toEqual(sortedEventsByBlock);
  }, 60000);

  it('should handle different chunk sizes correctly', async () => {
    const smallChunkFetcher = new GenericEventFetcher<TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 500,
      concurrency: 2
    });

    const largeChunkFetcher = new GenericEventFetcher<TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 2000,
      concurrency: 2
    });

    const [smallChunkEvents, largeChunkEvents] = await Promise.all([
      smallChunkFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        {
          contractAddress: usdcContract.address,
          fromBlock: 18500000,
          toBlock: 18501000
        }
      ),
      largeChunkFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        {
          contractAddress: usdcContract.address,
          fromBlock: 18500000,
          toBlock: 18501000
        }
      )
    ]);

    expect(smallChunkEvents.length).toBe(largeChunkEvents.length);
    
    for (let i = 0; i < smallChunkEvents.length; i++) {
      expect(smallChunkEvents[i].transactionHash).toBe(largeChunkEvents[i].transactionHash);
      expect(smallChunkEvents[i].blockNumber).toBe(largeChunkEvents[i].blockNumber);
    }
  }, 40000);

  it('should handle different concurrency settings', async () => {
    const highConcurrencyFetcher = new GenericEventFetcher<TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 1000,
      concurrency: 5,
      showProgress: true
    });

    const lowConcurrencyFetcher = new GenericEventFetcher<TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 1000,
      concurrency: 1,
      showProgress: true
    });

    const blockRange = { fromBlock: 18500000, toBlock: 18503000 };

    const [highConcurrencyEvents, lowConcurrencyEvents] = await Promise.all([
      highConcurrencyFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        {
          contractAddress: usdcContract.address,
          ...blockRange
        }
      ),
      lowConcurrencyFetcher.fetchEvents(
        usdcContract,
        'Transfer',
        {
          contractAddress: usdcContract.address,
          ...blockRange
        }
      )
    ]);

    expect(highConcurrencyEvents.length).toBe(lowConcurrencyEvents.length);
    expect(highConcurrencyEvents.length).toBeGreaterThan(0);
  }, 60000);
});

describe('Integration - Large Scale Event Order Test', () => {
  let usdcContract: ContractInterface;

  beforeAll(async () => {
    const usdcAddress = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
    const transferEventTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
    
    usdcContract = {
      address: usdcAddress,
      filters: {
        Transfer: () => ({
          topics: [transferEventTopic]
        } as ethers.EventFilter)
      },
      queryFilter: async (filter: ethers.EventFilter, fromBlock?: number, toBlock?: number) => {
        const logs = await testProvider.getLogs({
          ...filter,
          fromBlock,
          toBlock
        });
        return logs.map(log => ({
          ...log,
          args: {} 
        })) as ethers.Event[];
      }
    };
  });

  it('should maintain event order with 100 parallel chunks', async () => {
    // Final: Original parameters - 10000 blocks, chunkSize 100, concurrency 10 (100 chunks, 10 parallel)
    const customFetcher = new GenericEventFetcher<TestEvent>({
      ...DEFAULT_CONFIG,
      chunkSize: 100,     // 100 chunks for 10000 blocks
      concurrency: 10,    // 10 parallel
      showProgress: false // No progress output
    });

    const events = await customFetcher.fetchEvents(
      usdcContract,
      'Transfer',
      {
        contractAddress: usdcContract.address,
        fromBlock: 18000000,  // Original start block
        toBlock: 18009999     // 10000 blocks - Final test
      }
    );
    
    // Check basic event properties
    expect(events).toBeDefined();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    
    // Events from all 100 chunks are now combined and returned directly
    
    // Check if events are in chronological order
    const eventsByBlock = events.map(e => e.blockNumber);
    const sortedEventsByBlock = [...eventsByBlock].sort((a, b) => a - b);
    
    // This should pass - events are sorted despite parallel chunk fetching
    expect(eventsByBlock).toEqual(sortedEventsByBlock);
  }, 60000);
});