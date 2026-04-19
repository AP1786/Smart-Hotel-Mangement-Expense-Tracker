from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field, field_validator


class RecipeIngredient(BaseModel):
    ingredient_name: str = Field(min_length=1, max_length=100)
    quantity_required: float = Field(gt=0)

    @field_validator("ingredient_name")
    @classmethod
    def normalize_ingredient_name(cls, value: str) -> str:
        return value.strip()


class CommandMetadata(BaseModel):
    actor: str = Field(default="operator", min_length=1, max_length=100)
    note: str | None = Field(default=None, max_length=500)
    reference_id: str | None = Field(default=None, max_length=120)

    @field_validator("actor")
    @classmethod
    def normalize_actor(cls, value: str) -> str:
        return value.strip()

    @field_validator("note")
    @classmethod
    def normalize_note(cls, value: str | None) -> str | None:
        if value is None:
            return value

        stripped = value.strip()
        return stripped or None

    @field_validator("reference_id")
    @classmethod
    def normalize_reference_id(cls, value: str | None) -> str | None:
        if value is None:
            return value

        stripped = value.strip()
        return stripped or None


class IngredientRestockCommand(CommandMetadata):
    ingredient_name: str = Field(min_length=1, max_length=100)
    quantity: float = Field(gt=0)
    unit_cost: float = Field(gt=0)
    threshold: float = Field(default=5, gt=0)

    @field_validator("ingredient_name")
    @classmethod
    def normalize_ingredient_name(cls, value: str) -> str:
        return value.strip()


class DishRegistrationCommand(CommandMetadata):
    dish_id: str = Field(min_length=1, max_length=80)
    dish_name: str = Field(min_length=1, max_length=120)
    recipe: list[RecipeIngredient] = Field(min_length=1)
    initial_stock: int = Field(default=0, ge=0)
    markup_rate: float = Field(default=0.2, ge=0)

    @field_validator("dish_id", "dish_name")
    @classmethod
    def normalize_text_fields(cls, value: str) -> str:
        return value.strip()


class DishSaleCommand(CommandMetadata):
    dish_id: str = Field(min_length=1, max_length=80)
    quantity: int = Field(gt=0)

    @field_validator("dish_id")
    @classmethod
    def normalize_dish_id(cls, value: str) -> str:
        return value.strip()


class IngredientState(BaseModel):
    name: str
    price_per_unit: float
    quantity_in_stock: float
    threshold: float


class DishState(BaseModel):
    dish_id: str
    dish_name: str
    recipe: list[RecipeIngredient]
    cost_price: float
    selling_price: float
    quantity_in_stock: int
    total_sold: int
    total_revenue: float


class SaleRecord(BaseModel):
    sale_id: str
    dish_id: str
    quantity: int
    total_revenue: float
    total_cost: float
    reference_id: str
    actor: str
    created_at: str


class BlockRecord(BaseModel):
    block_height: int
    block_hash: str
    previous_hash: str
    action_type: str
    reference_id: str
    actor: str
    payload: dict[str, Any]
    created_at: str


class LedgerMetrics(BaseModel):
    ingredient_count: int
    dish_count: int
    sales_count: int
    total_revenue: float
    total_cost: float
    total_profit: float
    latest_block_height: int


class LedgerOverview(BaseModel):
    metrics: LedgerMetrics
    ingredients: list[IngredientState]
    dishes: list[DishState]
    recent_sales: list[SaleRecord]
    latest_block: BlockRecord


class CommandResult(BaseModel):
    message: str
    transaction_summary: dict[str, Any]
    block: BlockRecord
    overview: LedgerOverview
