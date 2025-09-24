import { ethers } from 'ethers';
import { ProviderError } from '../errors';
import { RetryableProvider, RetryableProviderOptions } from './retryable-provider';

/**
 * Provider configuration options
 */
export interface ProviderOptions extends RetryableProviderOptions {
  url?: string;
  pollingInterval?: number;
  timeout?: number;
}

/**
 * Provider status information
 */
export interface ProviderStatus {
  networkName: string;
  chainId: number;
  latestBlock: number;
  syncStatus: boolean;
  isConnected: boolean;
}

/**
 * Creates and validates a retryable ethers provider
 */
export async function createProvider(options: ProviderOptions = {}): Promise<RetryableProvider> {
  const {
    url,
    pollingInterval = 4000,
    maxRetries = 3,
    initialRetryDelay = 1000,
    maxRetryDelay,
    retryJitter,
  } = options;

  if (!url) {
    throw new ProviderError('Provider URL is required');
  }

  const provider = new RetryableProvider(url, undefined, {
    maxRetries,
    initialRetryDelay,
    maxRetryDelay,
    retryJitter,
  });
  provider.pollingInterval = pollingInterval;
  try {
    await provider.getNetwork();

    return provider;
  } catch (error) {
    throw new ProviderError(
      'Provider initialization failed',
      url,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Get current status of the provider
 */
export async function getProviderStatus(
  provider: ethers.providers.JsonRpcProvider
): Promise<ProviderStatus> {
  try {
    const [network, blockNumber, isSyncing] = await Promise.all([
      provider.getNetwork(),
      provider.getBlockNumber(),
      provider.send('eth_syncing', []),
    ]);

    return {
      networkName: network.name,
      chainId: network.chainId,
      latestBlock: blockNumber,
      syncStatus: !!isSyncing,
      isConnected: true,
    };
  } catch {
    return {
      networkName: 'unknown',
      chainId: -1,
      latestBlock: -1,
      syncStatus: false,
      isConnected: false,
    };
  }
}
