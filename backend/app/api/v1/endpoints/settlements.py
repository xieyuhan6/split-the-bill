from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.adjustment import Adjustment
from app.models.expense import Expense
from app.models.expense_participant import ExpenseParticipant
from app.models.group import Group
from app.models.member import Member
from app.schemas.settlement import SettlementRead
from app.services.settlement import (
    AdjustmentInput,
    ExpenseInput,
    ParticipantInput,
    calculate_group_settlement,
)

router = APIRouter()


@router.get("/groups/{group_id}/settlement", response_model=SettlementRead)
async def get_group_settlement(group_id: int, db: AsyncSession = Depends(get_db)) -> dict:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    members_result = await db.execute(
        select(Member).where(Member.group_id == group_id).order_by(Member.id.asc())
    )
    members = list(members_result.scalars().all())
    member_ids = [m.id for m in members]
    member_names = {m.id: m.display_name for m in members}

    expenses_result = await db.execute(
        select(Expense).where(Expense.group_id == group_id).order_by(Expense.id.asc())
    )
    expenses = list(expenses_result.scalars().all())

    if not expenses:
        return {
            "base_currency": group.base_currency,
            "members": [
                {
                    "member_id": m.id,
                    "member_name": m.display_name,
                    "paid": "0.00",
                    "owed": "0.00",
                    "net": "0.00",
                    "currency": group.base_currency,
                }
                for m in members
            ],
            "transfers": [],
        }

    expense_ids = [e.id for e in expenses]

    participants_result = await db.execute(
        select(ExpenseParticipant).where(ExpenseParticipant.expense_id.in_(expense_ids))
    )
    participants = list(participants_result.scalars().all())

    adjustments_result = await db.execute(
        select(Adjustment).where(Adjustment.expense_id.in_(expense_ids))
    )
    adjustments = list(adjustments_result.scalars().all())

    participants_by_expense: dict[int, list[ParticipantInput]] = {}
    for participant in participants:
        participants_by_expense.setdefault(participant.expense_id, []).append(
            ParticipantInput(
                member_id=participant.member_id,
                split_type=participant.split_type,
                split_value=participant.split_value,
            )
        )

    adjustments_by_expense: dict[int, list[AdjustmentInput]] = {}
    for adjustment in adjustments:
        adjustments_by_expense.setdefault(adjustment.expense_id, []).append(
            AdjustmentInput(
                member_id=adjustment.member_id,
                delta_amount=adjustment.delta_amount,
                currency=adjustment.currency,
            )
        )

    expense_inputs = [
        ExpenseInput(
            id=expense.id,
            paid_by_member_id=expense.paid_by_member_id,
            amount=expense.amount,
            currency=expense.currency,
            fx_rate=expense.fx_rate,
        )
        for expense in expenses
    ]

    return calculate_group_settlement(
        member_ids=member_ids,
        member_names=member_names,
        base_currency=group.base_currency,
        expenses=expense_inputs,
        participants_by_expense=participants_by_expense,
        adjustments_by_expense=adjustments_by_expense,
    )
