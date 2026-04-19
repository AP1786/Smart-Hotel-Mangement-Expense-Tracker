from __future__ import annotations

import json
import sqlite3
from collections.abc import Callable
from pathlib import Path
from typing import Any


ConnectionWork = Callable[[sqlite3.Connection], Any]


class SQLiteLedgerRepository:
    def __init__(self, database_path: Path) -> None:
        self.database_path = database_path
        self.database_path.parent.mkdir(parents=True, exist_ok=True)

    def initialize_schema(self) -> None:
        with self._connect() as connection:
            connection.executescript(
                """
                PRAGMA foreign_keys = ON;

                CREATE TABLE IF NOT EXISTS ingredients (
                    name TEXT PRIMARY KEY,
                    price_per_unit REAL NOT NULL,
                    quantity_in_stock REAL NOT NULL,
                    threshold REAL NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS dishes (
                    dish_id TEXT PRIMARY KEY,
                    dish_name TEXT NOT NULL,
                    recipe_json TEXT NOT NULL,
                    cost_price REAL NOT NULL,
                    selling_price REAL NOT NULL,
                    quantity_in_stock INTEGER NOT NULL,
                    total_sold INTEGER NOT NULL DEFAULT 0,
                    total_revenue REAL NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS sales (
                    sale_id TEXT PRIMARY KEY,
                    dish_id TEXT NOT NULL,
                    quantity INTEGER NOT NULL,
                    total_revenue REAL NOT NULL,
                    total_cost REAL NOT NULL,
                    reference_id TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (dish_id) REFERENCES dishes(dish_id)
                );

                CREATE TABLE IF NOT EXISTS blocks (
                    block_height INTEGER PRIMARY KEY,
                    block_hash TEXT NOT NULL,
                    previous_hash TEXT NOT NULL,
                    action_type TEXT NOT NULL,
                    reference_id TEXT NOT NULL,
                    actor TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );
                """
            )

    def run_transaction(self, work: ConnectionWork) -> Any:
        with self._connect() as connection:
            connection.execute("BEGIN IMMEDIATE")
            result = work(connection)
            connection.commit()
            return result

    def run_read(self, work: ConnectionWork) -> Any:
        with self._connect() as connection:
            return work(connection)

    def list_ingredients(self, connection: sqlite3.Connection) -> list[sqlite3.Row]:
        cursor = connection.execute(
            """
            SELECT name, price_per_unit, quantity_in_stock, threshold
            FROM ingredients
            ORDER BY name ASC
            """
        )
        return list(cursor.fetchall())

    def get_ingredient(self, connection: sqlite3.Connection, ingredient_name: str) -> sqlite3.Row | None:
        cursor = connection.execute(
            """
            SELECT name, price_per_unit, quantity_in_stock, threshold
            FROM ingredients
            WHERE name = ?
            """,
            (ingredient_name,),
        )
        return cursor.fetchone()

    def upsert_ingredient(
        self,
        connection: sqlite3.Connection,
        *,
        ingredient_name: str,
        price_per_unit: float,
        quantity_in_stock: float,
        threshold: float,
        updated_at: str,
    ) -> None:
        connection.execute(
            """
            INSERT INTO ingredients (name, price_per_unit, quantity_in_stock, threshold, updated_at)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(name) DO UPDATE SET
                price_per_unit = excluded.price_per_unit,
                quantity_in_stock = excluded.quantity_in_stock,
                threshold = excluded.threshold,
                updated_at = excluded.updated_at
            """,
            (ingredient_name, price_per_unit, quantity_in_stock, threshold, updated_at),
        )

    def update_ingredient_stock(
        self,
        connection: sqlite3.Connection,
        *,
        ingredient_name: str,
        quantity_in_stock: float,
        updated_at: str,
    ) -> None:
        connection.execute(
            """
            UPDATE ingredients
            SET quantity_in_stock = ?, updated_at = ?
            WHERE name = ?
            """,
            (quantity_in_stock, updated_at, ingredient_name),
        )

    def list_dishes(self, connection: sqlite3.Connection) -> list[sqlite3.Row]:
        cursor = connection.execute(
            """
            SELECT
                dish_id,
                dish_name,
                recipe_json,
                cost_price,
                selling_price,
                quantity_in_stock,
                total_sold,
                total_revenue
            FROM dishes
            ORDER BY dish_name ASC
            """
        )
        return list(cursor.fetchall())

    def get_dish(self, connection: sqlite3.Connection, dish_id: str) -> sqlite3.Row | None:
        cursor = connection.execute(
            """
            SELECT
                dish_id,
                dish_name,
                recipe_json,
                cost_price,
                selling_price,
                quantity_in_stock,
                total_sold,
                total_revenue
            FROM dishes
            WHERE dish_id = ?
            """,
            (dish_id,),
        )
        return cursor.fetchone()

    def insert_dish(
        self,
        connection: sqlite3.Connection,
        *,
        dish_id: str,
        dish_name: str,
        recipe: list[dict[str, Any]],
        cost_price: float,
        selling_price: float,
        quantity_in_stock: int,
        updated_at: str,
    ) -> None:
        connection.execute(
            """
            INSERT INTO dishes (
                dish_id,
                dish_name,
                recipe_json,
                cost_price,
                selling_price,
                quantity_in_stock,
                updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                dish_id,
                dish_name,
                json.dumps(recipe, sort_keys=True),
                cost_price,
                selling_price,
                quantity_in_stock,
                updated_at,
            ),
        )

    def update_dish_after_sale(
        self,
        connection: sqlite3.Connection,
        *,
        dish_id: str,
        quantity_in_stock: int,
        total_sold: int,
        total_revenue: float,
        updated_at: str,
    ) -> None:
        connection.execute(
            """
            UPDATE dishes
            SET
                quantity_in_stock = ?,
                total_sold = ?,
                total_revenue = ?,
                updated_at = ?
            WHERE dish_id = ?
            """,
            (quantity_in_stock, total_sold, total_revenue, updated_at, dish_id),
        )

    def insert_sale(
        self,
        connection: sqlite3.Connection,
        *,
        sale_id: str,
        dish_id: str,
        quantity: int,
        total_revenue: float,
        total_cost: float,
        reference_id: str,
        actor: str,
        created_at: str,
    ) -> None:
        connection.execute(
            """
            INSERT INTO sales (
                sale_id,
                dish_id,
                quantity,
                total_revenue,
                total_cost,
                reference_id,
                actor,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (sale_id, dish_id, quantity, total_revenue, total_cost, reference_id, actor, created_at),
        )

    def list_sales(self, connection: sqlite3.Connection, limit: int = 20) -> list[sqlite3.Row]:
        cursor = connection.execute(
            """
            SELECT sale_id, dish_id, quantity, total_revenue, total_cost, reference_id, actor, created_at
            FROM sales
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        )
        return list(cursor.fetchall())

    def sum_sales(self, connection: sqlite3.Connection) -> sqlite3.Row:
        cursor = connection.execute(
            """
            SELECT
                COUNT(*) AS sales_count,
                COALESCE(SUM(total_revenue), 0) AS total_revenue,
                COALESCE(SUM(total_cost), 0) AS total_cost
            FROM sales
            """
        )
        return cursor.fetchone()

    def list_blocks(self, connection: sqlite3.Connection, limit: int = 50) -> list[sqlite3.Row]:
        cursor = connection.execute(
            """
            SELECT
                block_height,
                block_hash,
                previous_hash,
                action_type,
                reference_id,
                actor,
                payload_json,
                created_at
            FROM blocks
            ORDER BY block_height DESC
            LIMIT ?
            """,
            (limit,),
        )
        return list(cursor.fetchall())

    def get_latest_block(self, connection: sqlite3.Connection) -> sqlite3.Row | None:
        cursor = connection.execute(
            """
            SELECT
                block_height,
                block_hash,
                previous_hash,
                action_type,
                reference_id,
                actor,
                payload_json,
                created_at
            FROM blocks
            ORDER BY block_height DESC
            LIMIT 1
            """
        )
        return cursor.fetchone()

    def insert_block(
        self,
        connection: sqlite3.Connection,
        *,
        block_height: int,
        block_hash: str,
        previous_hash: str,
        action_type: str,
        reference_id: str,
        actor: str,
        payload_json: str,
        created_at: str,
    ) -> None:
        connection.execute(
            """
            INSERT INTO blocks (
                block_height,
                block_hash,
                previous_hash,
                action_type,
                reference_id,
                actor,
                payload_json,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (block_height, block_hash, previous_hash, action_type, reference_id, actor, payload_json, created_at),
        )

    def counts(self, connection: sqlite3.Connection) -> sqlite3.Row:
        cursor = connection.execute(
            """
            SELECT
                (SELECT COUNT(*) FROM ingredients) AS ingredient_count,
                (SELECT COUNT(*) FROM dishes) AS dish_count
            """
        )
        return cursor.fetchone()

    def _connect(self) -> sqlite3.Connection:
        connection = sqlite3.connect(self.database_path)
        connection.row_factory = sqlite3.Row
        return connection
