import { useState } from 'react';

import { DEFAULT_MARKUP_RATE } from '@smart-hotel/shared';

const parseRecipeText = (recipeText) =>
  recipeText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [ingredient_name, quantity] = line.split(':');

      return {
        ingredient_name: ingredient_name.trim(),
        quantity_required: Number(quantity),
      };
    });

export function RestockForm({ onSubmit }) {
  const [formState, setFormState] = useState({
    ingredient_name: 'Rice',
    quantity: 15,
    unit_cost: 4.2,
    threshold: 5,
    actor: 'procurement-lead',
    note: 'Morning delivery batch',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <label>
        Ingredient
        <input
          value={formState.ingredient_name}
          onChange={(event) =>
            setFormState((current) => ({ ...current, ingredient_name: event.target.value }))
          }
        />
      </label>
      <label>
        Quantity
        <input
          type="number"
          min="0"
          step="0.01"
          value={formState.quantity}
          onChange={(event) =>
            setFormState((current) => ({ ...current, quantity: event.target.value }))
          }
        />
      </label>
      <label>
        Unit Cost
        <input
          type="number"
          min="0"
          step="0.01"
          value={formState.unit_cost}
          onChange={(event) =>
            setFormState((current) => ({ ...current, unit_cost: event.target.value }))
          }
        />
      </label>
      <label>
        Threshold
        <input
          type="number"
          min="0"
          step="0.01"
          value={formState.threshold}
          onChange={(event) =>
            setFormState((current) => ({ ...current, threshold: event.target.value }))
          }
        />
      </label>
      <label>
        Actor
        <input
          value={formState.actor}
          onChange={(event) =>
            setFormState((current) => ({ ...current, actor: event.target.value }))
          }
        />
      </label>
      <label>
        Note
        <textarea
          rows="3"
          value={formState.note}
          onChange={(event) =>
            setFormState((current) => ({ ...current, note: event.target.value }))
          }
        />
      </label>
      <button type="submit">Restock Ingredient</button>
    </form>
  );
}

export function DishForm({ onSubmit }) {
  const [formState, setFormState] = useState({
    dish_id: 'dish-herb-rice',
    dish_name: 'Herb Rice Bowl',
    initial_stock: 6,
    markup_rate: DEFAULT_MARKUP_RATE,
    actor: 'kitchen-manager',
    note: 'Dinner service prep',
    recipeText: 'Rice:1\nHerbs:0.25',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit({
      dish_id: formState.dish_id,
      dish_name: formState.dish_name,
      initial_stock: formState.initial_stock,
      markup_rate: formState.markup_rate,
      actor: formState.actor,
      note: formState.note,
      recipe: parseRecipeText(formState.recipeText),
    });
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <label>
        Dish ID
        <input
          value={formState.dish_id}
          onChange={(event) =>
            setFormState((current) => ({ ...current, dish_id: event.target.value }))
          }
        />
      </label>
      <label>
        Dish Name
        <input
          value={formState.dish_name}
          onChange={(event) =>
            setFormState((current) => ({ ...current, dish_name: event.target.value }))
          }
        />
      </label>
      <label>
        Initial Stock
        <input
          type="number"
          min="0"
          step="1"
          value={formState.initial_stock}
          onChange={(event) =>
            setFormState((current) => ({ ...current, initial_stock: event.target.value }))
          }
        />
      </label>
      <label>
        Markup Rate
        <input
          type="number"
          min="0"
          step="0.01"
          value={formState.markup_rate}
          onChange={(event) =>
            setFormState((current) => ({ ...current, markup_rate: event.target.value }))
          }
        />
      </label>
      <label>
        Recipe
        <textarea
          rows="5"
          value={formState.recipeText}
          onChange={(event) =>
            setFormState((current) => ({ ...current, recipeText: event.target.value }))
          }
        />
      </label>
      <label>
        Actor
        <input
          value={formState.actor}
          onChange={(event) =>
            setFormState((current) => ({ ...current, actor: event.target.value }))
          }
        />
      </label>
      <label>
        Note
        <textarea
          rows="3"
          value={formState.note}
          onChange={(event) =>
            setFormState((current) => ({ ...current, note: event.target.value }))
          }
        />
      </label>
      <button type="submit">Register Dish</button>
    </form>
  );
}

export function SaleForm({ onSubmit }) {
  const [formState, setFormState] = useState({
    dish_id: 'dish-herb-rice',
    quantity: 2,
    actor: 'front-desk-cashier',
    note: 'Walk-in order',
  });

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formState);
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <label>
        Dish ID
        <input
          value={formState.dish_id}
          onChange={(event) =>
            setFormState((current) => ({ ...current, dish_id: event.target.value }))
          }
        />
      </label>
      <label>
        Quantity
        <input
          type="number"
          min="1"
          step="1"
          value={formState.quantity}
          onChange={(event) =>
            setFormState((current) => ({ ...current, quantity: event.target.value }))
          }
        />
      </label>
      <label>
        Actor
        <input
          value={formState.actor}
          onChange={(event) =>
            setFormState((current) => ({ ...current, actor: event.target.value }))
          }
        />
      </label>
      <label>
        Note
        <textarea
          rows="3"
          value={formState.note}
          onChange={(event) =>
            setFormState((current) => ({ ...current, note: event.target.value }))
          }
        />
      </label>
      <button type="submit">Record Sale</button>
    </form>
  );
}
