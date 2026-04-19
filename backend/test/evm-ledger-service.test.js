import assert from 'node:assert/strict';
import test from 'node:test';

import { EvmLedgerService } from '../src/services/evm-ledger-service.js';

test('recordIngredientRestock mirrors the incoming batch unit cost', async () => {
  let capturedArguments = null;

  const service = new EvmLedgerService({
    enabled: true,
    contractAddress: '0xabc',
    contract: {
      async recordIngredientRestock(...args) {
        capturedArguments = args;

        return {
          async wait() {
            return { hash: '0x123', blockNumber: 12 };
          },
        };
      },
    },
  });

  const result = await service.recordIngredientRestock({
    transaction_summary: {
      ingredient_name: 'Rice',
      quantity_added: 10,
      weighted_unit_cost: 5,
      reference_id: 'restock-001',
    },
    block: {
      payload: {
        unit_cost: 6,
        threshold: 3,
      },
    },
  });

  assert.equal(capturedArguments[0], 'Rice');
  assert.equal(capturedArguments[1], 1000n);
  assert.equal(capturedArguments[2], 600n);
  assert.equal(capturedArguments[3], 300n);
  assert.deepEqual(result, {
    status: 'synced',
    synced: true,
    transactionHash: '0x123',
    blockNumber: 12,
  });
});
