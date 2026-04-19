# Architecture Notes

## Hybrid Ledger Flow

1. The React dashboard submits a business command to the Express API.
2. Express forwards the command to the Python ledger service.
3. FastAPI validates inventory rules, persists domain state, and appends a hashed block.
4. Express uses the validated response to mirror the same business event to `HotelLedger.sol`.
5. The API returns both the off-chain block data and the on-chain transaction receipt summary.

## Why This Split Works

- The Python ledger keeps the richer hotel domain logic and low-cost audit history.
- The Solidity contract gives the project immutable public proof that each validated hotel action happened.
- The Node gateway prevents the frontend from needing direct knowledge of Python persistence rules or private signing keys.

## Domain Events

- `INGREDIENT_RESTOCK`
- `DISH_REGISTERED`
- `DISH_SOLD`
