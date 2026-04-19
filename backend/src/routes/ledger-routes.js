import { Router } from 'express';

import {
  getBlocks,
  getDashboard,
  getHealth,
  recordSale,
  registerDish,
  restockIngredient,
} from '../controllers/ledger-controller.js';

const router = Router();

router.get('/health', getHealth);
router.get('/api/dashboard', getDashboard);
router.get('/api/ledger/blocks', getBlocks);
router.post('/api/ledger/restocks', restockIngredient);
router.post('/api/ledger/dishes', registerDish);
router.post('/api/ledger/sales', recordSale);

export { router };
