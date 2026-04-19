from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from uuid import uuid4

from app.domain.models import (
    BlockRecord,
    CommandResult,
    DishRegistrationCommand,
    DishSaleCommand,
    DishState,
    IngredientRestockCommand,
    IngredientState,
    LedgerMetrics,
    LedgerOverview,
    RecipeIngredient,
    SaleRecord,
)
from app.repositories.sqlite_ledger_repository import SQLiteLedgerRepository


class LedgerService:
    def __init__(self, repository: SQLiteLedgerRepository) -> None:
        self.repository = repository
        self.repository.initialize_schema()
        self._ensure_genesis_block()

    def get_overview(self) -> LedgerOverview:
        return self.repository.run_read(self._build_overview)

    def list_blocks(self, limit: int = 50) -> list[BlockRecord]:
        def work(connection):
            rows = self.repository.list_blocks(connection, limit)
            return [self._row_to_block(row) for row in rows]

        return self.repository.run_read(work)

    def restock_ingredient(self, command: IngredientRestockCommand) -> CommandResult:
        reference_id = command.reference_id or self._create_reference_id("restock")
        timestamp = self._timestamp()

        def work(connection):
            existing = self.repository.get_ingredient(connection, command.ingredient_name)

            if existing is None:
                updated_quantity = command.quantity
                weighted_price = command.unit_cost
            else:
                updated_quantity = existing["quantity_in_stock"] + command.quantity
                weighted_price = round(
                    (
                        (existing["price_per_unit"] * existing["quantity_in_stock"])
                        + (command.unit_cost * command.quantity)
                    )
                    / updated_quantity,
                    4,
                )

            self.repository.upsert_ingredient(
                connection,
                ingredient_name=command.ingredient_name,
                price_per_unit=weighted_price,
                quantity_in_stock=updated_quantity,
                threshold=command.threshold,
                updated_at=timestamp,
            )

            payload = {
                "ingredient_name": command.ingredient_name,
                "quantity": command.quantity,
                "unit_cost": command.unit_cost,
                "threshold": command.threshold,
                "note": command.note,
            }
            block = self._append_block(
                connection,
                action_type="INGREDIENT_RESTOCK",
                reference_id=reference_id,
                actor=command.actor,
                payload=payload,
            )
            overview = self._build_overview(connection)

            return CommandResult(
                message=f"Ingredient '{command.ingredient_name}' restocked successfully.",
                transaction_summary={
                    "reference_id": reference_id,
                    "ingredient_name": command.ingredient_name,
                    "quantity_added": round(command.quantity, 4),
                    "new_quantity_in_stock": round(updated_quantity, 4),
                    "weighted_unit_cost": round(weighted_price, 4),
                },
                block=block,
                overview=overview,
            )

        return self.repository.run_transaction(work)

    def register_dish(self, command: DishRegistrationCommand) -> CommandResult:
        reference_id = command.reference_id or self._create_reference_id("dish")
        timestamp = self._timestamp()

        def work(connection):
            if self.repository.get_dish(connection, command.dish_id):
                raise ValueError(f"Dish '{command.dish_id}' already exists.")

            recipe_cost = 0.0
            ingredient_consumption: list[tuple[str, float]] = []

            for item in command.recipe:
                ingredient = self.repository.get_ingredient(connection, item.ingredient_name)
                if ingredient is None:
                    raise ValueError(f"Ingredient '{item.ingredient_name}' is not registered.")

                recipe_cost += ingredient["price_per_unit"] * item.quantity_required
                required_for_batch = item.quantity_required * command.initial_stock

                if ingredient["quantity_in_stock"] < required_for_batch:
                    raise ValueError(
                        f"Insufficient stock for '{item.ingredient_name}'. "
                        f"Required: {required_for_batch}, available: {ingredient['quantity_in_stock']}."
                    )

                ingredient_consumption.append((item.ingredient_name, required_for_batch))

            for ingredient_name, quantity_consumed in ingredient_consumption:
                if quantity_consumed == 0:
                    continue

                ingredient = self.repository.get_ingredient(connection, ingredient_name)
                updated_quantity = ingredient["quantity_in_stock"] - quantity_consumed
                self.repository.update_ingredient_stock(
                    connection,
                    ingredient_name=ingredient_name,
                    quantity_in_stock=updated_quantity,
                    updated_at=timestamp,
                )

            cost_price = round(recipe_cost, 2)
            selling_price = round(cost_price * (1 + command.markup_rate), 2)
            recipe_payload = [item.model_dump() for item in command.recipe]

            self.repository.insert_dish(
                connection,
                dish_id=command.dish_id,
                dish_name=command.dish_name,
                recipe=recipe_payload,
                cost_price=cost_price,
                selling_price=selling_price,
                quantity_in_stock=command.initial_stock,
                updated_at=timestamp,
            )

            payload = {
                "dish_id": command.dish_id,
                "dish_name": command.dish_name,
                "recipe": recipe_payload,
                "initial_stock": command.initial_stock,
                "markup_rate": command.markup_rate,
                "cost_price": cost_price,
                "selling_price": selling_price,
                "note": command.note,
            }
            block = self._append_block(
                connection,
                action_type="DISH_REGISTERED",
                reference_id=reference_id,
                actor=command.actor,
                payload=payload,
            )
            overview = self._build_overview(connection)

            return CommandResult(
                message=f"Dish '{command.dish_name}' registered successfully.",
                transaction_summary={
                    "reference_id": reference_id,
                    "dish_id": command.dish_id,
                    "dish_name": command.dish_name,
                    "initial_stock": command.initial_stock,
                    "cost_price": cost_price,
                    "selling_price": selling_price,
                },
                block=block,
                overview=overview,
            )

        return self.repository.run_transaction(work)

    def sell_dish(self, command: DishSaleCommand) -> CommandResult:
        reference_id = command.reference_id or self._create_reference_id("sale")
        timestamp = self._timestamp()

        def work(connection):
            dish = self.repository.get_dish(connection, command.dish_id)
            if dish is None:
                raise ValueError(f"Dish '{command.dish_id}' is not registered.")

            if dish["quantity_in_stock"] < command.quantity:
                raise ValueError(
                    f"Insufficient stock for '{command.dish_id}'. "
                    f"Required: {command.quantity}, available: {dish['quantity_in_stock']}."
                )

            updated_quantity = dish["quantity_in_stock"] - command.quantity
            total_sold = dish["total_sold"] + command.quantity
            total_revenue = round(dish["total_revenue"] + (dish["selling_price"] * command.quantity), 2)
            transaction_revenue = round(dish["selling_price"] * command.quantity, 2)
            transaction_cost = round(dish["cost_price"] * command.quantity, 2)

            self.repository.update_dish_after_sale(
                connection,
                dish_id=command.dish_id,
                quantity_in_stock=updated_quantity,
                total_sold=total_sold,
                total_revenue=total_revenue,
                updated_at=timestamp,
            )

            sale_id = f"sale-{uuid4().hex}"
            self.repository.insert_sale(
                connection,
                sale_id=sale_id,
                dish_id=command.dish_id,
                quantity=command.quantity,
                total_revenue=transaction_revenue,
                total_cost=transaction_cost,
                reference_id=reference_id,
                actor=command.actor,
                created_at=timestamp,
            )

            payload = {
                "sale_id": sale_id,
                "dish_id": command.dish_id,
                "quantity": command.quantity,
                "total_revenue": transaction_revenue,
                "total_cost": transaction_cost,
                "note": command.note,
            }
            block = self._append_block(
                connection,
                action_type="DISH_SOLD",
                reference_id=reference_id,
                actor=command.actor,
                payload=payload,
            )
            overview = self._build_overview(connection)

            return CommandResult(
                message=f"Dish '{command.dish_id}' sold successfully.",
                transaction_summary={
                    "reference_id": reference_id,
                    "sale_id": sale_id,
                    "dish_id": command.dish_id,
                    "quantity": command.quantity,
                    "transaction_revenue": transaction_revenue,
                    "transaction_cost": transaction_cost,
                },
                block=block,
                overview=overview,
            )

        return self.repository.run_transaction(work)

    def _ensure_genesis_block(self) -> None:
        def work(connection):
            if self.repository.get_latest_block(connection) is not None:
                return None

            created_at = self._timestamp()
            payload_json = json.dumps({"message": "Smart hotel ledger initialized."}, sort_keys=True)
            block_hash = hashlib.sha256(
                f"0|GENESIS|system|genesis|{payload_json}|{created_at}".encode("utf-8")
            ).hexdigest()
            self.repository.insert_block(
                connection,
                block_height=0,
                block_hash=block_hash,
                previous_hash="0" * 64,
                action_type="GENESIS",
                reference_id="genesis",
                actor="system",
                payload_json=payload_json,
                created_at=created_at,
            )

            return None

        self.repository.run_transaction(work)

    def _append_block(
        self,
        connection,
        *,
        action_type: str,
        reference_id: str,
        actor: str,
        payload: dict,
    ) -> BlockRecord:
        latest_block = self.repository.get_latest_block(connection)
        block_height = latest_block["block_height"] + 1
        previous_hash = latest_block["block_hash"]
        created_at = self._timestamp()
        payload_json = json.dumps(payload, sort_keys=True)

        digest = hashlib.sha256(
            f"{block_height}|{previous_hash}|{action_type}|{reference_id}|{actor}|{payload_json}|{created_at}".encode(
                "utf-8"
            )
        ).hexdigest()

        self.repository.insert_block(
            connection,
            block_height=block_height,
            block_hash=digest,
            previous_hash=previous_hash,
            action_type=action_type,
            reference_id=reference_id,
            actor=actor,
            payload_json=payload_json,
            created_at=created_at,
        )

        return BlockRecord(
            block_height=block_height,
            block_hash=digest,
            previous_hash=previous_hash,
            action_type=action_type,
            reference_id=reference_id,
            actor=actor,
            payload=payload,
            created_at=created_at,
        )

    def _build_overview(self, connection) -> LedgerOverview:
        ingredients = [
            IngredientState(
                name=row["name"],
                price_per_unit=row["price_per_unit"],
                quantity_in_stock=row["quantity_in_stock"],
                threshold=row["threshold"],
            )
            for row in self.repository.list_ingredients(connection)
        ]

        dishes = []
        for row in self.repository.list_dishes(connection):
            dishes.append(
                DishState(
                    dish_id=row["dish_id"],
                    dish_name=row["dish_name"],
                    recipe=[RecipeIngredient(**item) for item in json.loads(row["recipe_json"])],
                    cost_price=row["cost_price"],
                    selling_price=row["selling_price"],
                    quantity_in_stock=row["quantity_in_stock"],
                    total_sold=row["total_sold"],
                    total_revenue=row["total_revenue"],
                )
            )

        recent_sales = [
            SaleRecord(
                sale_id=row["sale_id"],
                dish_id=row["dish_id"],
                quantity=row["quantity"],
                total_revenue=row["total_revenue"],
                total_cost=row["total_cost"],
                reference_id=row["reference_id"],
                actor=row["actor"],
                created_at=row["created_at"],
            )
            for row in self.repository.list_sales(connection)
        ]

        counts = self.repository.counts(connection)
        sales_summary = self.repository.sum_sales(connection)
        latest_block = self._row_to_block(self.repository.get_latest_block(connection))
        total_profit = round(sales_summary["total_revenue"] - sales_summary["total_cost"], 2)

        return LedgerOverview(
            metrics=LedgerMetrics(
                ingredient_count=counts["ingredient_count"],
                dish_count=counts["dish_count"],
                sales_count=sales_summary["sales_count"],
                total_revenue=round(sales_summary["total_revenue"], 2),
                total_cost=round(sales_summary["total_cost"], 2),
                total_profit=total_profit,
                latest_block_height=latest_block.block_height,
            ),
            ingredients=ingredients,
            dishes=dishes,
            recent_sales=recent_sales,
            latest_block=latest_block,
        )

    def _row_to_block(self, row) -> BlockRecord:
        return BlockRecord(
            block_height=row["block_height"],
            block_hash=row["block_hash"],
            previous_hash=row["previous_hash"],
            action_type=row["action_type"],
            reference_id=row["reference_id"],
            actor=row["actor"],
            payload=json.loads(row["payload_json"]),
            created_at=row["created_at"],
        )

    @staticmethod
    def _create_reference_id(prefix: str) -> str:
        return f"{prefix}-{uuid4().hex[:12]}"

    @staticmethod
    def _timestamp() -> str:
        return datetime.now(tz=timezone.utc).isoformat()
