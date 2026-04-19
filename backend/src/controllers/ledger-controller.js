import { z } from 'zod';

import { HttpError } from '../lib/http-error.js';
import { hybridLedgerService } from '../services/hybrid-ledger-service.js';

const restockSchema = z.object({
  ingredient_name: z.string().trim().min(1),
  quantity: z.coerce.number().positive(),
  unit_cost: z.coerce.number().positive(),
  threshold: z.coerce.number().positive().default(5),
  actor: z.string().trim().min(1).default('dashboard-operator'),
  note: z.string().trim().optional(),
});

const recipeIngredientSchema = z.object({
  ingredient_name: z.string().trim().min(1),
  quantity_required: z.coerce.number().positive(),
});

const dishSchema = z.object({
  dish_id: z.string().trim().min(1),
  dish_name: z.string().trim().min(1),
  recipe: z.array(recipeIngredientSchema).min(1),
  initial_stock: z.coerce.number().int().min(0).default(0),
  markup_rate: z.coerce.number().min(0).default(0.2),
  actor: z.string().trim().min(1).default('dashboard-operator'),
  note: z.string().trim().optional(),
});

const saleSchema = z.object({
  dish_id: z.string().trim().min(1),
  quantity: z.coerce.number().int().positive(),
  actor: z.string().trim().min(1).default('dashboard-operator'),
  note: z.string().trim().optional(),
});

const validate = (schema, payload) => {
  const result = schema.safeParse(payload);

  if (!result.success) {
    throw new HttpError(400, 'Request validation failed.', result.error.flatten());
  }

  return result.data;
};

export const getHealth = async (_request, response) => {
  response.json({ status: 'ok', service: 'smart-hotel-backend-gateway' });
};

export const getDashboard = async (_request, response, next) => {
  try {
    const snapshot = await hybridLedgerService.getDashboardSnapshot();
    response.json(snapshot);
  } catch (error) {
    next(error);
  }
};

export const getBlocks = async (request, response, next) => {
  try {
    const limit = Number(request.query.limit ?? 50);
    const blocks = await hybridLedgerService.listBlocks(limit);
    response.json(blocks);
  } catch (error) {
    next(error);
  }
};

export const restockIngredient = async (request, response, next) => {
  try {
    const command = validate(restockSchema, request.body);
    const result = await hybridLedgerService.restockIngredient(command);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const registerDish = async (request, response, next) => {
  try {
    const command = validate(dishSchema, request.body);
    const result = await hybridLedgerService.registerDish(command);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};

export const recordSale = async (request, response, next) => {
  try {
    const command = validate(saleSchema, request.body);
    const result = await hybridLedgerService.recordSale(command);
    response.status(201).json(result);
  } catch (error) {
    next(error);
  }
};
