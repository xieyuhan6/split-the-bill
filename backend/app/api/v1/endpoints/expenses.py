from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.adjustment import Adjustment
from app.models.expense import Expense
from app.models.expense_participant import ExpenseParticipant
from app.models.group import Group
from app.models.member import Member
from app.schemas.expense import ExpenseCreate, ExpenseHistoryRead, ExpenseRead
from app.services.settlement import ParticipantInput, compute_expense_shares

router = APIRouter()


@router.post("/groups/{group_id}/expenses", response_model=ExpenseRead, status_code=status.HTTP_201_CREATED)
async def create_expense(group_id: int, payload: ExpenseCreate, db: AsyncSession = Depends(get_db)) -> Expense:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    payer = await db.get(Member, payload.paid_by_member_id)
    if payer is None or payer.group_id != group_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid payer member")

    participant_ids = {item.member_id for item in payload.participants}
    if not participant_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Participants are required")

    members_result = await db.execute(
        select(Member.id).where(Member.group_id == group_id, Member.id.in_(participant_ids))
    )
    valid_ids = set(members_result.scalars().all())
    if valid_ids != participant_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid participant members")

    adjustment_ids = {item.member_id for item in payload.adjustments}
    if adjustment_ids:
        adjust_members_result = await db.execute(
            select(Member.id).where(Member.group_id == group_id, Member.id.in_(adjustment_ids))
        )
        valid_adjustment_ids = set(adjust_members_result.scalars().all())
        if valid_adjustment_ids != adjustment_ids:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid adjustment members")

    expense = Expense(
        group_id=group_id,
        paid_by_member_id=payload.paid_by_member_id,
        title=payload.title,
        amount=payload.amount,
        currency=payload.currency,
        fx_rate=payload.fx_rate,
        occurred_at=payload.occurred_at,
        note=payload.note,
    )
    db.add(expense)
    await db.flush()

    for part in payload.participants:
        db.add(
            ExpenseParticipant(
                expense_id=expense.id,
                member_id=part.member_id,
                split_type=part.split_type,
                split_value=part.split_value,
            )
        )

    for adj in payload.adjustments:
        db.add(
            Adjustment(
                expense_id=expense.id,
                member_id=adj.member_id,
                delta_amount=adj.delta_amount,
                currency=adj.currency,
                reason=adj.reason,
            )
        )

    await db.commit()
    await db.refresh(expense)
    return expense


@router.get("/groups/{group_id}/expenses", response_model=list[ExpenseHistoryRead])
async def list_expenses(group_id: int, db: AsyncSession = Depends(get_db)) -> list[dict]:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    expense_result = await db.execute(
        select(Expense).where(Expense.group_id == group_id).order_by(Expense.occurred_at.desc(), Expense.id.desc())
    )
    expenses = list(expense_result.scalars().all())
    if not expenses:
        return []

    member_result = await db.execute(select(Member).where(Member.group_id == group_id))
    members = list(member_result.scalars().all())
    member_names = {member.id: member.display_name for member in members}

    expense_ids = [expense.id for expense in expenses]

    participant_result = await db.execute(
        select(ExpenseParticipant).where(ExpenseParticipant.expense_id.in_(expense_ids))
    )
    participants = list(participant_result.scalars().all())

    adjustment_result = await db.execute(
        select(Adjustment).where(Adjustment.expense_id.in_(expense_ids))
    )
    adjustments = list(adjustment_result.scalars().all())

    participants_by_expense: dict[int, list[ExpenseParticipant]] = {}
    for participant in participants:
        participants_by_expense.setdefault(participant.expense_id, []).append(participant)

    adjustments_by_expense: dict[int, list[Adjustment]] = {}
    for adjustment in adjustments:
        adjustments_by_expense.setdefault(adjustment.expense_id, []).append(adjustment)

    rows: list[dict] = []
    for expense in expenses:
        participant_inputs = [
            ParticipantInput(
                member_id=participant.member_id,
                split_type=participant.split_type,
                split_value=participant.split_value,
            )
            for participant in participants_by_expense.get(expense.id, [])
        ]

        shares = compute_expense_shares(expense.amount, participant_inputs) if participant_inputs else {}

        row = {
            "id": expense.id,
            "group_id": expense.group_id,
            "paid_by_member_id": expense.paid_by_member_id,
            "payer_name": member_names.get(expense.paid_by_member_id, str(expense.paid_by_member_id)),
            "title": expense.title,
            "amount": expense.amount,
            "currency": expense.currency,
            "fx_rate": expense.fx_rate,
            "occurred_at": expense.occurred_at,
            "note": expense.note,
            "created_at": expense.created_at,
            "participant_shares": [
                {
                    "member_id": participant.member_id,
                    "member_name": member_names.get(participant.member_id, str(participant.member_id)),
                    "split_type": participant.split_type,
                    "split_value": participant.split_value,
                    "owed_amount": shares.get(participant.member_id, 0),
                    "currency": expense.currency,
                }
                for participant in participants_by_expense.get(expense.id, [])
            ],
            "adjustments": [
                {
                    "member_id": adjustment.member_id,
                    "member_name": member_names.get(adjustment.member_id, str(adjustment.member_id)),
                    "delta_amount": adjustment.delta_amount,
                    "currency": adjustment.currency,
                    "reason": adjustment.reason,
                }
                for adjustment in adjustments_by_expense.get(expense.id, [])
            ],
        }
        rows.append(row)

    return rows


@router.delete("/groups/{group_id}/expenses/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(group_id: int, expense_id: int, db: AsyncSession = Depends(get_db)) -> None:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    expense = await db.get(Expense, expense_id)
    if expense is None or expense.group_id != group_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")

    await db.delete(expense)
    await db.commit()
