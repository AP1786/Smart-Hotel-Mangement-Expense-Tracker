# Step-by-Step Implementation Guide

## 1. Structure the Repository

The repository is organized around the requested top-level folders:

- `blockchain-core`
- `contracts`
- `backend`
- `frontend`
- `.github/workflows`

Supporting folders such as `shared`, `docs`, and `legacy` are kept separate so cross-layer code reuse and documentation stay tidy.

## 2. Bridge the Python Code

The Python layer is treated as the authoritative validator.

1. `frontend` sends a transaction command to `backend`.
2. `backend` makes an HTTP request to `blockchain-core`.
3. `blockchain-core` validates the command, updates hotel state, and appends a new hashed block.
4. `backend` mirrors the validated result to `contracts/HotelLedger.sol` with Ethers.js.
5. `backend` returns both the off-chain block result and the on-chain sync result to `frontend`.

That makes the Node.js service the translator between the Python business logic and the EVM deployment target.

## 3. Version Control and Quality Tools

The root workspace includes:

- Prettier via `npm run format:check`
- ESLint via `npm run lint`
- workspace tests via `npm run test`
- Slither via `npm run audit:slither`
- Husky pre-commit hooks via `.husky/pre-commit`

Git initialization could not be completed in the current environment because Git is unavailable. Once Git is installed, run:

```bash
git init
npm run prepare
```

Then use feature branches such as `feature/smart-contracts`, `feature/backend-bridge`, and `feature/frontend-dashboard`.
