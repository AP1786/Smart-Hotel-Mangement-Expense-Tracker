import { Contract, JsonRpcProvider, Wallet, keccak256, toUtf8Bytes } from 'ethers';

import { hotelLedgerAbi } from '@smart-hotel/shared';

import { env } from '../config/env.js';

const SCALE = 100;

const toChainAmount = (value) => BigInt(Math.round(Number(value) * SCALE));

const metadataHashFor = (payload) => keccak256(toUtf8Bytes(JSON.stringify(payload)));

export class EvmLedgerService {
  constructor(options = {}) {
    const defaultEnabled = Boolean(
      env.evmEnabled && env.evmRpcUrl && env.evmPrivateKey && env.hotelLedgerAddress,
    );

    this.enabled = options.enabled ?? defaultEnabled;
    this.contractAddress = options.contractAddress ?? env.hotelLedgerAddress ?? null;
    this.provider = options.provider ?? null;
    this.wallet = options.wallet ?? null;
    this.contract = options.contract ?? null;

    if (!this.enabled) {
      return;
    }

    if (!this.contract) {
      if (!this.provider) {
        this.provider = new JsonRpcProvider(env.evmRpcUrl);
      }

      if (!this.wallet) {
        this.wallet = new Wallet(env.evmPrivateKey, this.provider);
      }

      this.contract = new Contract(this.contractAddress, hotelLedgerAbi, this.wallet);
    }
  }

  async getStatus() {
    if (!this.enabled) {
      return {
        enabled: false,
        contractAddress: null,
        status: 'disabled',
        reason: 'Configure EVM_RPC_URL, EVM_PRIVATE_KEY, and HOTEL_LEDGER_ADDRESS to enable sync.',
      };
    }

    const [network, latestBlock, actionCount, owner] = await Promise.all([
      this.provider.getNetwork(),
      this.provider.getBlockNumber(),
      this.contract.getActionCount(),
      this.contract.owner(),
    ]);

    return {
      enabled: true,
      status: 'online',
      contractAddress: this.contractAddress,
      owner,
      chainId: Number(network.chainId),
      networkName: network.name,
      latestBlock,
      mirroredActionCount: Number(actionCount),
    };
  }

  async recordIngredientRestock(result) {
    if (!this.enabled) {
      return this._disabledResult();
    }

    try {
      const metadataHash = metadataHashFor(result.block.payload);
      const transaction = await this.contract.recordIngredientRestock(
        result.transaction_summary.ingredient_name,
        toChainAmount(result.transaction_summary.quantity_added),
        toChainAmount(result.block.payload.unit_cost),
        toChainAmount(result.block.payload.threshold),
        result.transaction_summary.reference_id,
        metadataHash,
      );
      const receipt = await transaction.wait();

      return this._syncedResult(receipt.hash, receipt.blockNumber);
    } catch (error) {
      return this._failureResult(error);
    }
  }

  async recordDishRegistration(result) {
    if (!this.enabled) {
      return this._disabledResult();
    }

    try {
      const metadataHash = metadataHashFor(result.block.payload);
      const transaction = await this.contract.recordDishRegistration(
        result.transaction_summary.dish_id,
        result.transaction_summary.dish_name,
        toChainAmount(result.transaction_summary.cost_price),
        toChainAmount(result.transaction_summary.selling_price),
        BigInt(result.transaction_summary.initial_stock),
        result.transaction_summary.reference_id,
        metadataHash,
      );
      const receipt = await transaction.wait();

      return this._syncedResult(receipt.hash, receipt.blockNumber);
    } catch (error) {
      return this._failureResult(error);
    }
  }

  async recordDishSale(result) {
    if (!this.enabled) {
      return this._disabledResult();
    }

    try {
      const metadataHash = metadataHashFor(result.block.payload);
      const transaction = await this.contract.recordDishSale(
        result.transaction_summary.dish_id,
        BigInt(result.transaction_summary.quantity),
        toChainAmount(result.transaction_summary.transaction_revenue),
        toChainAmount(result.transaction_summary.transaction_cost),
        result.transaction_summary.reference_id,
        metadataHash,
      );
      const receipt = await transaction.wait();

      return this._syncedResult(receipt.hash, receipt.blockNumber);
    } catch (error) {
      return this._failureResult(error);
    }
  }

  _disabledResult() {
    return {
      status: 'disabled',
      synced: false,
      transactionHash: null,
      reason: 'EVM mirroring is not enabled in the backend environment.',
    };
  }

  _syncedResult(transactionHash, blockNumber) {
    return {
      status: 'synced',
      synced: true,
      transactionHash,
      blockNumber,
    };
  }

  _failureResult(error) {
    return {
      status: 'failed',
      synced: false,
      transactionHash: null,
      error: error.shortMessage ?? error.message,
    };
  }
}

export const evmLedgerService = new EvmLedgerService();
