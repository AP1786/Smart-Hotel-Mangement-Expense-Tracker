import dotenv from 'dotenv';

dotenv.config();

const toBoolean = (value, fallback = true) => {
  if (value === undefined) {
    return fallback;
  }

  return value.toLowerCase() === 'true';
};

export const env = {
  port: Number(process.env.PORT ?? 8080),
  pythonLedgerBaseUrl: process.env.PYTHON_LEDGER_BASE_URL ?? 'http://127.0.0.1:8000',
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://127.0.0.1:5173',
  evmEnabled: toBoolean(process.env.EVM_ENABLED, true),
  evmRpcUrl: process.env.EVM_RPC_URL ?? '',
  evmPrivateKey: process.env.EVM_PRIVATE_KEY ?? '',
  hotelLedgerAddress: process.env.HOTEL_LEDGER_ADDRESS ?? '',
};
