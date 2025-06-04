import { testProvider, usdcContract, USDC_ADDRESS, TEST_FROM_BLOCK } from './setup';

describe.skip('Test Environment Connectivity', () => {
  test('should connect to hardhat fork', async () => {
    const network = await testProvider.getNetwork();
    expect(network.chainId).toBe(31337); // Hardhat local network chain ID
  });

  test('should access USDC contract', async () => {
    expect(usdcContract.address.toLowerCase()).toBe(USDC_ADDRESS.toLowerCase());

    // Verify contract has Transfer event filter
    const transferFilter = usdcContract.filters.Transfer();
    expect(transferFilter).toBeDefined();
    expect(transferFilter.topics).toBeDefined();
  });

  test('should be able to query contract events', async () => {
    const filter = usdcContract.filters.Transfer();

    // Test that we can make the query without errors (events may or may not exist)
    const events = await usdcContract.queryFilter(filter, TEST_FROM_BLOCK, TEST_FROM_BLOCK + 10);

    // Verify query succeeds and returns array (even if empty)
    expect(Array.isArray(events)).toBe(true);
    expect(typeof events.length).toBe('number');
  });
});
