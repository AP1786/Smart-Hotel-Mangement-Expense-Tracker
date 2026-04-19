from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.append(str(PROJECT_ROOT))

from app.domain.models import DishRegistrationCommand, DishSaleCommand, IngredientRestockCommand, RecipeIngredient
from app.repositories.sqlite_ledger_repository import SQLiteLedgerRepository
from app.services.ledger_service import LedgerService


def build_service(tmp_path: Path) -> LedgerService:
    database_path = tmp_path / "hotel-ledger.db"
    repository = SQLiteLedgerRepository(database_path)
    return LedgerService(repository)


def test_restock_creates_block_and_updates_inventory(tmp_path: Path) -> None:
    service = build_service(tmp_path)

    result = service.restock_ingredient(
        IngredientRestockCommand(
            ingredient_name="Rice",
            quantity=10,
            unit_cost=4,
            threshold=3,
            actor="qa-suite",
        )
    )

    assert result.block.action_type == "INGREDIENT_RESTOCK"
    assert result.overview.metrics.ingredient_count == 1
    assert result.overview.ingredients[0].quantity_in_stock == 10
    assert result.overview.metrics.latest_block_height == 1


def test_register_and_sell_dish_updates_ledger_state(tmp_path: Path) -> None:
    service = build_service(tmp_path)

    service.restock_ingredient(
        IngredientRestockCommand(
            ingredient_name="Rice",
            quantity=10,
            unit_cost=4,
            threshold=2,
        )
    )
    service.restock_ingredient(
        IngredientRestockCommand(
            ingredient_name="Herbs",
            quantity=5,
            unit_cost=2,
            threshold=1,
        )
    )

    registration = service.register_dish(
        DishRegistrationCommand(
            dish_id="dish-001",
            dish_name="Herb Rice Bowl",
            initial_stock=4,
            recipe=[
                RecipeIngredient(ingredient_name="Rice", quantity_required=1),
                RecipeIngredient(ingredient_name="Herbs", quantity_required=0.25),
            ],
        )
    )

    sale = service.sell_dish(DishSaleCommand(dish_id="dish-001", quantity=2))

    assert registration.transaction_summary["initial_stock"] == 4
    assert sale.transaction_summary["transaction_revenue"] > sale.transaction_summary["transaction_cost"]
    assert sale.overview.dishes[0].quantity_in_stock == 2
    assert sale.overview.metrics.sales_count == 1
