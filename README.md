# Ethereum Parallel Event Fetcher

[![CI](https://github.com/yahgwai/eth-parallel-event-fetcher/actions/workflows/test.yml/badge.svg)](https://github.com/yahgwai/eth-parallel-event-fetcher/actions/workflows/test.yml)
[![npm version](https://badge.fury.io/js/eth-parallel-event-fetcher.svg)](https://www.npmjs.com/package/eth-parallel-event-fetcher)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript library for parallel fetching of Ethereum logs with configurable concurrency, rate limiting, and block range chunking.

## Features

- **Parallel Processing**: Fetch logs across multiple block ranges simultaneously
- **Automatic Retry Logic**: Built-in retry mechanism with exponential backoff
- **Progress Tracking**: Real-time progress reporting and callbacks
- **Configurable**: Extensive configuration options for performance tuning
- **TypeScript Support**: Full type safety and intellisense
- **Environment Variables**: Configuration via environment variables

## Installation

```bash
npm install eth-parallel-event-fetcher
```

## Quick Start

```typescript
import { GenericEventFetcher } from 'eth-parallel-event-fetcher';
import { ethers } from 'ethers';

// Create provider
const provider = new ethers.providers.JsonRpcProvider('your-rpc-url');

// Create fetcher with provider (required)
const fetcher = new GenericEventFetcher(provider);

// Fetch logs
const logs = await fetcher.fetchLogs({
  address: '0x...', // Contract address (single address only)
  topics: ['0x...'], // Event topic filters
  fromBlock: 1000000,
  toBlock: 1010000,
});

// Process logs as needed
logs.forEach((log) => {
  console.log(`Block ${log.blockNumber}: ${log.transactionHash}`);
});
```

## Configuration

### Constructor Configuration

```typescript
import { GenericEventFetcher, FetcherConfig } from 'eth-parallel-event-fetcher';

const config: FetcherConfig = {
  // Concurrency and performance
  concurrency: 10, // Number of parallel requests (1-50)
  chunkSize: 5000, // Blocks per chunk (100-100,000)

  // Retry configuration
  maxRetries: 3, // Number of retry attempts (0-10)
  initialRetryDelay: 1000, // Initial delay in ms (100-30,000)

  // Rate limiting
  rateLimitPerSecond: 10, // Requests per second (1-1,000)

  // Progress tracking
  showProgress: true, // Show console progress
  progressCallback: (completed, total, chunk) => {
    console.log(`Progress: ${completed}/${total} chunks`);
  },

  // Error handling
  continueOnError: true, // Continue on individual chunk errors
  maxLogsPerChunk: 9500, // Max logs per chunk to avoid truncation
};

// Provider is required as first parameter
const fetcher = new GenericEventFetcher(provider, config);
```

### Environment Variables

Configure the library using environment variables:

```bash
# Concurrency and performance
ETH_FETCHER_CONCURRENCY=10
ETH_FETCHER_CHUNK_SIZE=5000

# Retry configuration
ETH_FETCHER_MAX_RETRIES=3
ETH_FETCHER_INITIAL_RETRY_DELAY=1000

# Rate limiting
ETH_FETCHER_RATE_LIMIT_PER_SECOND=10

# Progress tracking
ETH_FETCHER_SHOW_PROGRESS=true

# Error handling
ETH_FETCHER_CONTINUE_ON_ERROR=true
ETH_FETCHER_MAX_LOGS_PER_CHUNK=9500
```

### Default Configuration

```typescript
const DEFAULT_CONFIG = {
  concurrency: 4,
  chunkSize: 10000,
  maxRetries: 3,
  initialRetryDelay: 1000,
  rateLimitPerSecond: 10,
  showProgress: false,
  continueOnError: true,
  maxLogsPerChunk: 10000,
};
```

## API Reference

### GenericEventFetcher

#### Constructor

```typescript
new GenericEventFetcher(provider: ethers.providers.Provider, config?: Partial<FetcherConfig>)
```

**Parameters:**

- `provider` (required): An ethers.js provider instance
- `config` (optional): Configuration options

#### Methods

##### fetchLogs()

```typescript
async fetchLogs(
  filter: LogFilter,
  options?: FetchLogsOptions
): Promise<ethers.providers.Log[]>
```

**Parameters:**

- `filter`: Ethereum log filter

  - `address?: string` - Contract address (single address only)
  - `topics?: Array<string | Array<string> | null>` - Topic filters
  - `fromBlock?: number | string` - Starting block
  - `toBlock?: number | string` - Ending block
  - `blockHash?: string` - Specific block hash

- `options`: Additional fetch options (overrides constructor config)
  - `chunkSize?: number`
  - `concurrency?: number`
  - `maxRetries?: number`
  - `initialRetryDelay?: number`
  - `rateLimitPerSecond?: number`
  - `showProgress?: boolean`
  - `onProgress?: (completed: number, total: number, chunk: [number, number]) => void`
  - `continueOnError?: boolean`
  - `maxLogsPerChunk?: number`

**Returns:** Array of ethers.providers.Log objects

##### updateConfig()

```typescript
updateConfig(newConfig: Partial<FetcherConfig>): void
```

Update the fetcher configuration at runtime.

##### getConfig()

```typescript
getConfig(): Required<FetcherConfig>
```

Get the current configuration.

### Types

#### LogFilter

```typescript
interface LogFilter {
  address?: string; // Contract address (single address only)
  topics?: Array<string | Array<string> | null>; // Topic filters
  fromBlock?: number | string; // Starting block
  toBlock?: number | string; // Ending block
  blockHash?: string; // Specific block hash
}
```

#### FetchLogsOptions

```typescript
interface FetchLogsOptions {
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
```

## Usage Examples

### Basic Log Fetching

```typescript
import { GenericEventFetcher } from 'eth-parallel-event-fetcher';
import { ethers } from 'ethers';

// Setup
const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
const fetcher = new GenericEventFetcher(provider, { concurrency: 8 });

// Fetch Transfer event logs
const transferTopic = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';
const logs = await fetcher.fetchLogs({
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC contract
  topics: [transferTopic],
  fromBlock: 18000000,
  toBlock: 18100000,
});

console.log(`Found ${logs.length} Transfer logs`);
```

### Advanced Log Processing

```typescript
// Fetch with progress tracking
const logs = await fetcher.fetchLogs(
  {
    address: CONTRACT_ADDRESS,
    topics: [EVENT_TOPIC],
    fromBlock: 18000000,
    toBlock: 18100000,
  },
  {
    onProgress: (completed, total) => {
      console.log(`Progress: ${completed}/${total} chunks`);
    },
  }
);

// Process logs with ethers
const iface = new ethers.utils.Interface(ABI);
const transfers = logs.map((log) => {
  const parsed = iface.parseLog(log);
  return {
    from: parsed.args.from,
    to: parsed.args.to,
    value: ethers.utils.formatEther(parsed.args.value),
    blockNumber: log.blockNumber,
    transactionHash: log.transactionHash,
  };
});
```

### Using Block Tags

```typescript
// Use block tags instead of numbers
const logs = await fetcher.fetchLogs({
  address: CONTRACT_ADDRESS,
  fromBlock: 'earliest',
  toBlock: 'latest',
});
```

### Error Handling

```typescript
try {
  const logs = await fetcher.fetchLogs(filter, options);
} catch (error) {
  if (error.message.includes('truncation detected')) {
    // Too many logs in a chunk
    console.log('Chunk too large, reducing chunk size...');

    // Retry with smaller chunks
    const updatedFetcher = new GenericEventFetcher(provider, {
      ...fetcher.getConfig(),
      chunkSize: 1000,
    });
    const logs = await updatedFetcher.fetchLogs(filter, options);
  } else {
    console.error('Fetch failed:', error);
  }
}
```

### Dynamic Configuration Updates

```typescript
const fetcher = new GenericEventFetcher(provider, { concurrency: 4 });

// Update configuration based on network conditions
if (networkIsSlow) {
  fetcher.updateConfig({
    concurrency: 2,
    chunkSize: 1000,
    maxRetries: 5,
  });
}
```

## Performance Tips

### 1. Optimize Chunk Size

Smaller chunks (1,000-5,000 blocks):

- Better for contracts with many events
- Reduces risk of hitting log limits
- More granular progress tracking

Larger chunks (10,000-50,000 blocks):

- Better for sparse events
- Fewer total requests
- Faster for simple queries

### 2. Adjust Concurrency

```typescript
// For rate-limited endpoints
const fetcher = new GenericEventFetcher(provider, {
  concurrency: 2,
  rateLimitPerSecond: 5,
});

// For high-performance nodes
const fetcher = new GenericEventFetcher(provider, {
  concurrency: 20,
  rateLimitPerSecond: 100,
});
```

### 3. Handle Large Date Ranges

```typescript
// Split very large ranges into multiple calls
const BATCH_SIZE = 100000; // blocks per batch
const allLogs = [];

for (let from = startBlock; from < endBlock; from += BATCH_SIZE) {
  const to = Math.min(from + BATCH_SIZE - 1, endBlock);

  const logs = await fetcher.fetchLogs({
    address: CONTRACT_ADDRESS,
    fromBlock: from,
    toBlock: to,
  });

  allLogs.push(...logs);
}
```

### 4. Monitor Progress

```typescript
const fetcher = new GenericEventFetcher(provider, {
  showProgress: true,
  progressCallback: (completed, total, chunk) => {
    const percentage = ((completed / total) * 100).toFixed(2);
    const [fromBlock, toBlock] = chunk;
    console.log(`${percentage}% complete. Current chunk: ${fromBlock}-${toBlock}`);
  },
});
```

## Troubleshooting

### Common Issues

#### 1. "Log response size exceeded" Error

**Problem**: Too many logs in a single chunk.

**Solution**: Reduce chunk size

```typescript
const fetcher = new GenericEventFetcher(provider, {
  chunkSize: 1000, // Smaller chunks
  maxLogsPerChunk: 5000, // Lower limit
});
```

#### 2. Rate Limiting Errors

**Problem**: Too many requests per second.

**Solution**: Reduce concurrency and add rate limiting

```typescript
const fetcher = new GenericEventFetcher(provider, {
  concurrency: 2,
  rateLimitPerSecond: 5,
  initialRetryDelay: 2000,
});
```

#### 3. Memory Issues with Large Result Sets

**Problem**: Too many logs in memory at once.

**Solution**: Process in batches

```typescript
// Process logs in smaller batches
const BATCH_SIZE = 50000;
for (let i = 0; i < totalBlocks; i += BATCH_SIZE) {
  const logs = await fetcher.fetchLogs({
    fromBlock: startBlock + i,
    toBlock: Math.min(startBlock + i + BATCH_SIZE, endBlock),
  });

  // Process and persist logs immediately
  await processLogs(logs);

  // Clear logs from memory
  logs.length = 0;
}
```

#### 4. Timeout Errors

**Problem**: RPC endpoint timing out.

**Solution**: Reduce chunk size and concurrency

```typescript
const fetcher = new GenericEventFetcher(provider, {
  chunkSize: 2000,
  concurrency: 3,
  maxRetries: 5,
  initialRetryDelay: 3000,
});
```

## Testing

Run the test suite:

```bash
# Install dependencies
npm install

# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npm test -- fetcher.test.ts
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
