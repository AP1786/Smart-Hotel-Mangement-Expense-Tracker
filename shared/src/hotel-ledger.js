export const HOTEL_ACTION_TYPES = Object.freeze({
  INGREDIENT_RESTOCK: 'INGREDIENT_RESTOCK',
  DISH_REGISTERED: 'DISH_REGISTERED',
  DISH_SOLD: 'DISH_SOLD',
});

export const DEFAULT_MARKUP_RATE = 0.2;

export const createReferenceId = (prefix) =>
  `${prefix}-${new Date().toISOString().replace(/[:.]/g, '-')}`;

export const compactHash = (value) => `${value.slice(0, 10)}...${value.slice(-8)}`;
