import { startTransition, useDeferredValue, useEffect, useState } from 'react';

import { ledgerApi } from '../api/ledger-api';

const emptySnapshot = {
  overview: null,
  blocks: [],
  evmStatus: null,
};

export function useDashboardData() {
  const [snapshot, setSnapshot] = useState(emptySnapshot);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activity, setActivity] = useState(null);
  const deferredBlocks = useDeferredValue(snapshot.blocks);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await ledgerApi.getDashboard();

      startTransition(() => {
        setSnapshot(data);
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message ?? requestError.message);
    } finally {
      setLoading(false);
    }
  };

  const runCommand = async (executor, successLabel) => {
    try {
      setError('');
      setActivity({ type: 'working', message: `${successLabel} in progress...` });
      const result = await executor();

      const syncMessage =
        result.onChainSync?.status === 'synced'
          ? ` Mirrored on-chain with tx ${result.onChainSync.transactionHash.slice(0, 12)}...`
          : result.onChainSync?.status === 'failed'
            ? ` Off-chain write succeeded but on-chain mirroring failed: ${result.onChainSync.error}`
            : ' Off-chain write succeeded. On-chain sync is disabled.';

      let refreshMessage = '';

      try {
        const latestSnapshot = await ledgerApi.getDashboard();

        startTransition(() => {
          setSnapshot(latestSnapshot);
        });
      } catch (refreshError) {
        refreshMessage = ` Snapshot refresh failed: ${refreshError.response?.data?.message ?? refreshError.message}`;
      }

      setActivity({
        type: 'success',
        message: `${result.message}${syncMessage}${refreshMessage}`,
      });

      return result;
    } catch (requestError) {
      const message = requestError.response?.data?.message ?? requestError.message;
      setError(message);
      setActivity({
        type: 'error',
        message,
      });
      throw requestError;
    }
  };

  useEffect(() => {
    void loadDashboard();
  }, []);

  return {
    snapshot: {
      ...snapshot,
      blocks: deferredBlocks,
    },
    loading,
    error,
    activity,
    refresh: loadDashboard,
    restockIngredient: (payload) =>
      runCommand(() => ledgerApi.restockIngredient(payload), 'Restock'),
    registerDish: (payload) =>
      runCommand(() => ledgerApi.registerDish(payload), 'Dish registration'),
    recordSale: (payload) => runCommand(() => ledgerApi.recordSale(payload), 'Sale'),
  };
}
