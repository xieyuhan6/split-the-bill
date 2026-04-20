from __future__ import annotations

from collections import defaultdict
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException, status

from app.models.expense_participant import SplitType

MONEY_QUANT = Decimal("0.01")


@dataclass
class ExpenseInput:
    id: int
    paid_by_member_id: int
    amount: Decimal
    currency: str
    fx_rate: Decimal | None


@dataclass
class ParticipantInput:
    member_id: int
    split_type: SplitType
    split_value: Decimal


@dataclass
class AdjustmentInput:
    member_id: int
    delta_amount: Decimal
    currency: str


def _to_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def _to_base_amount(amount: Decimal, currency: str, base_currency: str, fx_rate: Decimal | None) -> Decimal:
    if currency == base_currency:
        return _to_money(amount)
    if fx_rate is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing fx_rate for non-base currency expense ({currency} -> {base_currency})",
        )
    return _to_money(amount * fx_rate)


def compute_expense_shares(expense_amount: Decimal, participants: list[ParticipantInput]) -> dict[int, Decimal]:
    if not participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Expense participants are required")

    fixed_total = Decimal("0")
    percent_total = Decimal("0")
    equal_weight_total = Decimal("0")

    for part in participants:
        if part.split_value <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="split_value must be > 0")
        if part.split_type == SplitType.FIXED:
            fixed_total += part.split_value
        elif part.split_type == SplitType.PERCENTAGE:
            percent_total += part.split_value
        elif part.split_type == SplitType.EQUAL:
            equal_weight_total += part.split_value

    if percent_total > Decimal("100"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Percentage split total cannot exceed 100")

    percentage_amount = expense_amount * percent_total / Decimal("100")
    remaining_for_equal = expense_amount - fixed_total - percentage_amount
    if remaining_for_equal < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split values exceed expense amount")

    shares: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))

    for part in participants:
        if part.split_type == SplitType.FIXED:
            shares[part.member_id] += part.split_value
        elif part.split_type == SplitType.PERCENTAGE:
            shares[part.member_id] += expense_amount * part.split_value / Decimal("100")
        else:
            if equal_weight_total == 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Equal split participants require positive total equal weight",
                )
            shares[part.member_id] += remaining_for_equal * part.split_value / equal_weight_total

    return {member_id: _to_money(value) for member_id, value in shares.items()}


def calculate_group_settlement(
    *,
    member_ids: list[int],
    member_names: dict[int, str],
    base_currency: str,
    expenses: list[ExpenseInput],
    participants_by_expense: dict[int, list[ParticipantInput]],
    adjustments_by_expense: dict[int, list[AdjustmentInput]],
) -> dict:
    paid_by_member: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    owed_by_member: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))

    for expense in expenses:
        expense_amount_base = _to_base_amount(
            amount=expense.amount,
            currency=expense.currency,
            base_currency=base_currency,
            fx_rate=expense.fx_rate,
        )
        paid_by_member[expense.paid_by_member_id] += expense_amount_base

        shares = compute_expense_shares(expense.amount, participants_by_expense.get(expense.id, []))
        for member_id, share_original in shares.items():
            share_base = _to_base_amount(
                amount=share_original,
                currency=expense.currency,
                base_currency=base_currency,
                fx_rate=expense.fx_rate,
            )
            owed_by_member[member_id] += share_base

        for adj in adjustments_by_expense.get(expense.id, []):
            adj_base = _to_base_amount(
                amount=adj.delta_amount,
                currency=adj.currency,
                base_currency=base_currency,
                fx_rate=expense.fx_rate if adj.currency == expense.currency else None,
            )
            owed_by_member[adj.member_id] += adj_base

    for member_id in member_ids:
        paid_by_member[member_id] = _to_money(paid_by_member[member_id])
        owed_by_member[member_id] = _to_money(owed_by_member[member_id])

    net_by_member: dict[int, Decimal] = {}
    for member_id in member_ids:
        net_by_member[member_id] = _to_money(paid_by_member[member_id] - owed_by_member[member_id])

    creditors: list[tuple[int, Decimal]] = []
    debtors: list[tuple[int, Decimal]] = []
    for member_id, net in net_by_member.items():
        if net > 0:
            creditors.append((member_id, net))
        elif net < 0:
            debtors.append((member_id, -net))

    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    transfers: list[dict] = []
    i = 0
    j = 0
    while i < len(debtors) and j < len(creditors):
        debtor_id, debt_remaining = debtors[i]
        creditor_id, credit_remaining = creditors[j]

        amount = _to_money(min(debt_remaining, credit_remaining))
        if amount > 0:
            transfers.append(
                {
                    "from_member_id": debtor_id,
                    "from_member_name": member_names.get(debtor_id, str(debtor_id)),
                    "to_member_id": creditor_id,
                    "to_member_name": member_names.get(creditor_id, str(creditor_id)),
                    "amount": str(amount),
                    "currency": base_currency,
                }
            )

        debt_remaining = _to_money(debt_remaining - amount)
        credit_remaining = _to_money(credit_remaining - amount)

        if debt_remaining == 0:
            i += 1
        else:
            debtors[i] = (debtor_id, debt_remaining)

        if credit_remaining == 0:
            j += 1
        else:
            creditors[j] = (creditor_id, credit_remaining)

    summary = []
    for member_id in member_ids:
        summary.append(
            {
                "member_id": member_id,
                "member_name": member_names.get(member_id, str(member_id)),
                "paid": str(_to_money(paid_by_member[member_id])),
                "owed": str(_to_money(owed_by_member[member_id])),
                "net": str(_to_money(net_by_member[member_id])),
                "currency": base_currency,
            }
        )

    return {
        "base_currency": base_currency,
        "members": summary,
        "transfers": transfers,
    }
