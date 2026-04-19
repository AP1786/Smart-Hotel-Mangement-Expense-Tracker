from __future__ import annotations

from functools import lru_cache

from app.core.config import get_settings
from app.repositories.sqlite_ledger_repository import SQLiteLedgerRepository
from app.services.ledger_service import LedgerService


@lru_cache
def get_ledger_service() -> LedgerService:
    settings = get_settings()
    repository = SQLiteLedgerRepository(settings.database_path)
    return LedgerService(repository)
