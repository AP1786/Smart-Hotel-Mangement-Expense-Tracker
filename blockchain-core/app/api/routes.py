from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query

from app.api.dependencies import get_ledger_service
from app.domain.models import (
    BlockRecord,
    CommandResult,
    DishRegistrationCommand,
    DishSaleCommand,
    IngredientRestockCommand,
    LedgerOverview,
)
from app.services.ledger_service import LedgerService


router = APIRouter(prefix="/ledger", tags=["ledger"])


@router.get("/overview", response_model=LedgerOverview)
def get_overview(service: LedgerService = Depends(get_ledger_service)) -> LedgerOverview:
    return service.get_overview()


@router.get("/blocks", response_model=list[BlockRecord])
def get_blocks(
    limit: int = Query(default=50, ge=1, le=250),
    service: LedgerService = Depends(get_ledger_service),
) -> list[BlockRecord]:
    return service.list_blocks(limit)


@router.post("/restock", response_model=CommandResult)
def restock_ingredient(
    command: IngredientRestockCommand,
    service: LedgerService = Depends(get_ledger_service),
) -> CommandResult:
    try:
        return service.restock_ingredient(command)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/dishes", response_model=CommandResult)
def register_dish(
    command: DishRegistrationCommand,
    service: LedgerService = Depends(get_ledger_service),
) -> CommandResult:
    try:
        return service.register_dish(command)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error


@router.post("/sales", response_model=CommandResult)
def sell_dish(
    command: DishSaleCommand,
    service: LedgerService = Depends(get_ledger_service),
) -> CommandResult:
    try:
        return service.sell_dish(command)
    except ValueError as error:
        raise HTTPException(status_code=400, detail=str(error)) from error
