# Smart Hotel Hybrid dApp

This repository expands the legacy Flask hotel expense tracker into a full-stack hybrid dApp with a Python blockchain-style core, a Solidity mirror contract, a Node.js translator API, and a React dashboard.

## Repository Structure

```text
.
|-- .github/
|   `-- workflows/
|       `-- ci.yml
|-- backend/
|   `-- src/
|-- blockchain-core/
|   |-- app/
|   `-- tests/
|-- contracts/
|   |-- contracts/
|   |-- scripts/
|   |-- test/
|   `-- hardhat.config.js
|-- docs/
|   |-- architecture.md
|   `-- implementation-guide.md
|-- frontend/
|   |-- src/
|   `-- vite.config.js
|-- legacy/
|   `-- original-flask-app/
|-- shared/
|   `-- src/
|-- eslint.config.mjs
`-- package.json
```

## Architecture

- `blockchain-core`: Off-chain business truth implemented as a FastAPI microservice with SQLite state and hash-linked blocks.
- `backend`: The Node.js/Express translator that calls the Python microservice first, then mirrors validated actions to the Solidity contract through Ethers.js.
- `contracts`: Hardhat workspace with `HotelLedger.sol`, deployment scripts, tests, and Slither auditing support.
- `frontend`: React dashboard for restocks, dish registration, dish sales, and ledger visibility.
- `shared`: Shared action names and contract ABI metadata for the JavaScript layers.

## Step-by-Step Implementation Guide

The repository now follows the implementation order you requested:

1. Structure the code under `blockchain-core`, `contracts`, `backend`, `frontend`, and `.github/workflows`.
2. Run the Python business logic as a local microservice in `blockchain-core`.
3. Let `backend` translate UI commands into HTTP requests to the Python service and then mirror the accepted state into the Solidity contract.
4. Use `frontend` as the operator dashboard for transactions and ledger inspection.
5. Enforce quality gates with Prettier, ESLint, Husky, tests, GitHub Actions, and Slither.

The detailed workflow is documented in [docs/implementation-guide.md](C:/Users/patel/Downloads/dapp/docs/implementation-guide.md).

## Quick Start

1. Install JavaScript dependencies:

   ```bash
   npm install
   ```

2. Install Python dependencies:

   ```bash
   python -m pip install -r blockchain-core/requirements.txt
   ```

3. Start the Python ledger microservice:

   ```bash
   python -m uvicorn app.main:app --reload --app-dir blockchain-core
   ```

4. Start the translator backend:

   ```bash
   npm run start -w backend
   ```

5. Start the React dashboard:

   ```bash
   npm run dev -w frontend
   ```

6. Compile or deploy contracts:

   ```bash
   npm run compile -w contracts
   npm run deploy:sepolia -w contracts
   ```

7. Run quality checks:

   ```bash
   npm run quality:check
   npm run audit:slither
   ```

## Git and Husky

Husky is scaffolded in `.husky/` and will run `npm run quality:check` before commits once Git is initialized.

```bash
git init
npm run prepare
```

Git could not be initialized in the current machine session because `git` is not installed or not available on the system path.

## Legacy Reference

The original upstream project remains preserved in `legacy/original-flask-app` for side-by-side comparison with the hybrid dApp implementation.
