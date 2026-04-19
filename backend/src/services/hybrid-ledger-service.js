import { pythonLedgerClient } from './python-ledger-client.js';
import { evmLedgerService } from './evm-ledger-service.js';

export class HybridLedgerService {
  constructor(options = {}) {
    this.pythonClient = options.pythonClient ?? pythonLedgerClient;
    this.evmService = options.evmService ?? evmLedgerService;
  }

  async getDashboardSnapshot() {
    const [overviewResult, blocksResult, evmStatusResult] = await Promise.allSettled([
      this.pythonClient.getOverview(),
      this.pythonClient.listBlocks(25),
      this.evmService.getStatus(),
    ]);

    if (overviewResult.status === 'rejected') {
      throw overviewResult.reason;
    }

    if (blocksResult.status === 'rejected') {
      throw blocksResult.reason;
    }

    return {
      overview: overviewResult.value,
      blocks: blocksResult.value,
      evmStatus:
        evmStatusResult.status === 'fulfilled'
          ? evmStatusResult.value
          : this._buildUnavailableEvmStatus(evmStatusResult.reason),
    };
  }

  async listBlocks(limit = 50) {
    return this.pythonClient.listBlocks(limit);
  }

  async restockIngredient(command) {
    const offChainResult = await this.pythonClient.restockIngredient(command);
    const onChainSync = await this.evmService.recordIngredientRestock(offChainResult);

    return {
      ...offChainResult,
      onChainSync,
    };
  }

  async registerDish(command) {
    const offChainResult = await this.pythonClient.registerDish(command);
    const onChainSync = await this.evmService.recordDishRegistration(offChainResult);

    return {
      ...offChainResult,
      onChainSync,
    };
  }

  async recordSale(command) {
    const offChainResult = await this.pythonClient.recordSale(command);
    const onChainSync = await this.evmService.recordDishSale(offChainResult);

    return {
      ...offChainResult,
      onChainSync,
    };
  }

  _buildUnavailableEvmStatus(error) {
    return {
      enabled: true,
      status: 'unavailable',
      contractAddress: this.evmService.contractAddress ?? null,
      reason: error?.shortMessage ?? error?.message ?? 'Unable to read EVM status.',
    };
  }
}

export const hybridLedgerService = new HybridLedgerService();
