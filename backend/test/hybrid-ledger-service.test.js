import assert from 'node:assert/strict';
import test from 'node:test';

import { HybridLedgerService } from '../src/services/hybrid-ledger-service.js';

test('getDashboardSnapshot returns Python data even when EVM status lookup fails', async () => {
  const service = new HybridLedgerService({
    pythonClient: {
      async getOverview() {
        return { metrics: { latest_block_height: 3 } };
      },
      async listBlocks() {
        return [{ block_height: 3 }];
      },
    },
    evmService: {
      contractAddress: '0xabc',
      async getStatus() {
        throw new Error('RPC unavailable');
      },
    },
  });

  const snapshot = await service.getDashboardSnapshot();

  assert.deepEqual(snapshot.overview, { metrics: { latest_block_height: 3 } });
  assert.deepEqual(snapshot.blocks, [{ block_height: 3 }]);
  assert.deepEqual(snapshot.evmStatus, {
    enabled: true,
    status: 'unavailable',
    contractAddress: '0xabc',
    reason: 'RPC unavailable',
  });
});
