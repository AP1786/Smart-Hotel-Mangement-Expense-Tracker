from __future__ import annotations

import os
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path


@dataclass(frozen=True)
class Settings:
    service_name: str
    api_prefix: str
    database_path: Path


@lru_cache
def get_settings() -> Settings:
    base_dir = Path(__file__).resolve().parents[2]
    data_dir = Path(os.getenv("PYTHON_LEDGER_DATA_DIR", base_dir / "data"))
    data_dir.mkdir(parents=True, exist_ok=True)

    database_name = os.getenv("PYTHON_LEDGER_DB_NAME", "hotel_ledger.db")

    return Settings(
        service_name="smart-hotel-python-ledger",
        api_prefix="/api/v1",
        database_path=data_dir / database_name,
    )
