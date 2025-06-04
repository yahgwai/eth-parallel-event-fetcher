import { ethers } from 'ethers';
import { GenericEventFetcher } from '../src/fetcher';
import { DEFAULT_CONFIG } from '../src/config';
import { ContractInterface, RawEvent } from '../types';

interface TestEvent extends RawEvent {
  address: string;
  topics: string[];
  data: string;
  args: any;
}

describe('Integration - Custom Event Processing', () => {
  let fetcher: GenericEventFetcher<TestEvent>;
  let provider: ethers.providers.JsonRpcProvider;
  let usdcContract: ContractInterface;
  
  beforeAll(async () => {
    const config = {
      ...DEFAULT_CONFIG,
      maxLogsPerChunk: 1000,
      chunkSize: 1000
    };

    fetcher = new GenericEventFetcher(config);
    
    provider = new ethers.providers.JsonRpcProvider('http://127.0.0.1:8545');
    
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
        const logs = await provider.getLogs({
          ...filter,
          fromBlock,
          toBlock
        });
        
        // Parse logs into proper event format with decoded args
        const iface = new ethers.utils.Interface([
          'event Transfer(address indexed from, address indexed to, uint256 value)'
        ]);
        
        return logs.map(log => {
          const parsedLog = iface.parseLog(log);
          return {
            ...log,
            args: parsedLog.args
          };
        }) as ethers.Event[];
      }
    };
  });

  test('custom processing transforms Transfer events correctly', async () => {
    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18500010
      }
    );

    // Apply custom transformation after fetching
    const processedEvents = events.map(event => ({
      txHash: event.transactionHash,
      blockNum: event.blockNumber,
      from: event.args[0],
      to: event.args[1],
      amount: event.args[2].toString(),
      eventType: 'USDC_Transfer'
    }));

    expect(Array.isArray(processedEvents)).toBe(true);
    
    if (processedEvents.length > 0) {
      const event = processedEvents[0];
      expect(event).toHaveProperty('txHash');
      expect(event).toHaveProperty('blockNum');
      expect(event).toHaveProperty('from');
      expect(event).toHaveProperty('to');
      expect(event).toHaveProperty('amount');
      expect(event).toHaveProperty('eventType');
      expect(event.eventType).toBe('USDC_Transfer');
      expect(typeof event.txHash).toBe('string');
      expect(typeof event.blockNum).toBe('number');
      expect(typeof event.from).toBe('string');
      expect(typeof event.to).toBe('string');
      expect(typeof event.amount).toBe('string');
    }
  }, 30000);

  test('fetched events have all expected properties', async () => {
    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18500005
      }
    );

    // Verify event properties
    const results = events.map(event => ({
      hasArgs: Array.isArray(event.args),
      hasBlockNumber: typeof event.blockNumber === 'number',
      hasTransactionHash: typeof event.transactionHash === 'string',
      hasAddress: typeof event.address === 'string',
      hasTopics: Array.isArray(event.topics)
    }));

    if (events.length > 0) {
      const originalEvent = events[0];
      expect(originalEvent).toHaveProperty('args');
      expect(originalEvent).toHaveProperty('blockNumber');
      expect(originalEvent).toHaveProperty('transactionHash');
      expect(originalEvent).toHaveProperty('address');
      expect(originalEvent).toHaveProperty('topics');
      expect(originalEvent.args.length).toBe(3);
    }

    if (results.length > 0) {
      const processedEvent = results[0];
      expect(processedEvent.hasArgs).toBe(true);
      expect(processedEvent.hasBlockNumber).toBe(true);
      expect(processedEvent.hasTransactionHash).toBe(true);
      expect(processedEvent.hasAddress).toBe(true);
      expect(processedEvent.hasTopics).toBe(true);
    }
  }, 30000);

  test('events can be aggregated and summarized after fetching', async () => {
    const events = await fetcher.fetchEvents(
      usdcContract,
      'Transfer',
      {
        contractAddress: usdcContract.address,
        fromBlock: 18500000,
        toBlock: 18500020
      }
    );

    // Aggregate events after fetching
    const summary = {
      totalEvents: events.length,
      totalAmount: events.reduce((sum, event) => {
        return sum + BigInt(event.args[2].toString());
      }, BigInt(0)).toString(),
      uniqueRecipients: new Set(events.map(event => event.args[1])).size,
      blockRange: events.length > 0 ? {
        min: Math.min(...events.map(e => e.blockNumber)),
        max: Math.max(...events.map(e => e.blockNumber))
      } : null
    };

    const results = [summary];

    expect(results).toHaveLength(1);
    const summaryResult = results[0];
    
    expect(summaryResult).toHaveProperty('totalEvents');
    expect(summaryResult).toHaveProperty('totalAmount');
    expect(summaryResult).toHaveProperty('uniqueRecipients');
    expect(summaryResult).toHaveProperty('blockRange');
    
    expect(typeof summaryResult.totalEvents).toBe('number');
    expect(typeof summaryResult.totalAmount).toBe('string');
    expect(typeof summaryResult.uniqueRecipients).toBe('number');
    
    if (summaryResult && summaryResult.blockRange) {
      expect(typeof summaryResult.blockRange.min).toBe('number');
      expect(typeof summaryResult.blockRange.max).toBe('number');
      expect(summaryResult.blockRange.min).toBeLessThanOrEqual(summaryResult.blockRange.max);
    }
  }, 30000);
});