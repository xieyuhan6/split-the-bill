from collections import defaultdict
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, HTTPException, status

from app.schemas.calculate import CalculateRequest, CalculateResponse, SplitType

router = APIRouter()

MONEY_QUANT = Decimal("0.01")


def to_money(value: Decimal) -> Decimal:
    return value.quantize(MONEY_QUANT, rounding=ROUND_HALF_UP)


def compute_shares(amount: Decimal, participants: list) -> dict[int, Decimal]:
    if not participants:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Participants are required")

    fixed_total = Decimal("0")
    percent_total = Decimal("0")
    equal_weight_total = Decimal("0")

    for part in participants:
        if part.split_type == SplitType.FIXED:
            fixed_total += part.split_value
        elif part.split_type == SplitType.PERCENTAGE:
            percent_total += part.split_value
        else:
            equal_weight_total += part.split_value

    if percent_total > Decimal("100"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Percentage split total cannot exceed 100")

    percentage_amount = amount * percent_total / Decimal("100")
    remaining_for_equal = amount - fixed_total - percentage_amount
    if remaining_for_equal < 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split values exceed expense amount")

    shares: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for part in participants:
        if part.split_type == SplitType.FIXED:
            shares[part.person_id] += part.split_value
        elif part.split_type == SplitType.PERCENTAGE:
            shares[part.person_id] += amount * part.split_value / Decimal("100")
        else:
            if equal_weight_total == 0:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Equal split total weight must be > 0")
            shares[part.person_id] += remaining_for_equal * part.split_value / equal_weight_total

    return {person_id: to_money(value) for person_id, value in shares.items()}


def compute_adjustment_effects(adjustments: list, participants: list) -> tuple[Decimal, dict[int, Decimal]]:
    participant_ids = [part.person_id for part in participants]
    participant_set = set(participant_ids)

    total_adjustment_abs = Decimal("0")
    effects: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))

    for adj in adjustments:
        person_id = adj.person_id
        delta = Decimal(str(adj.delta_amount))
        if delta == 0:
            continue

        total_adjustment_abs += abs(delta)

        if delta > 0:
            # Positive adjustment belongs to the same person directly.
            effects[person_id] += delta
            continue

        excluded_amount = abs(delta)
        other_participants = [part for part in participants if part.person_id != person_id]
        if not other_participants:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Negative adjustment requires at least one other participant",
            )

        redistributed = compute_shares(excluded_amount, other_participants)
        for other_id, share in redistributed.items():
            effects[other_id] += share

    # Ensure every participant key exists to simplify downstream reads.
    for person_id in participant_set:
        effects[person_id] += Decimal("0")

    return total_adjustment_abs, dict(effects)


def build_expense_detail(
    expense,
    people_by_id: dict[int, str],
    base_amount: Decimal,
    shares: dict[int, Decimal],
    adjustment_effects: dict[int, Decimal],
    adjustments: list,
) -> dict:
    participant_ids = [part.person_id for part in expense.participants]

    positive_parts: list[str] = []
    negative_parts: list[str] = []
    adjustment_direct_map: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    for adj in adjustments:
        adjustment_direct_map[adj.person_id] += Decimal(str(adj.delta_amount))

    for person_id in participant_ids:
        delta = adjustment_direct_map.get(person_id, Decimal("0"))
        if delta > 0:
            positive_parts.append(f"{people_by_id[person_id]} +{to_money(delta)}")
        elif delta < 0:
            others = ", ".join(people_by_id[pid] for pid in participant_ids if pid != person_id) or "others"
            negative_parts.append(f"{people_by_id[person_id]} -{to_money(abs(delta))} (shared by {others})")

    adjustments_display = " | ".join([part for part in [" | ".join(positive_parts), " | ".join(negative_parts)] if part])
    adjustment_line = f"Personal adjustments: {adjustments_display}" if adjustments_display else "Personal adjustments: none"

    participant_names = ", ".join(people_by_id[pid] for pid in participant_ids)
    avg_pool = to_money(base_amount / Decimal(str(len(participant_ids)))) if participant_ids else Decimal("0")
    process_line = (
        f"After removing adjustments, the shared pool is {to_money(base_amount)}. "
        f"{participant_names} share it across {len(participant_ids)} people, about {avg_pool} each."
    )

    participants_breakdown = " | ".join(
        f"{people_by_id[person_id]} {to_money(shares.get(person_id, Decimal('0')))}" for person_id in participant_ids
    )

    final_map = {
        person_id: to_money(shares.get(person_id, Decimal("0")) + adjustment_effects.get(person_id, Decimal("0")))
        for person_id in participant_ids
    }
    final_breakdown = " | ".join(f"{people_by_id[pid]} {final_map[pid]}" for pid in participant_ids)

    final_lines: list[str] = []
    for person_id in participant_ids:
        base = to_money(shares.get(person_id, Decimal("0")))
        effect = to_money(adjustment_effects.get(person_id, Decimal("0")))
        final = final_map[person_id]
        if effect != Decimal("0.00"):
            sign = "+" if effect >= 0 else "-"
            final_lines.append(f"{people_by_id[person_id]}: {final} ({base} {sign} {to_money(abs(effect))})")
        else:
            final_lines.append(f"{people_by_id[person_id]}: {final}")

    return {
        "title_and_amount": f"{expense.title}: {to_money(expense.amount)} {expense.currency}",
        "total_line": f"Total cost: {to_money(expense.amount)} (Payer: {people_by_id[expense.payer_id]})",
        "adjustment_line": adjustment_line,
        "process_line": process_line,
        "participants_breakdown": participants_breakdown,
        "final_breakdown": final_breakdown,
        "final_lines": final_lines,
        "adjustments_display": adjustments_display,
    }


@router.post("/calculate", response_model=CalculateResponse)
async def calculate(payload: CalculateRequest) -> dict:
    people_by_id = {person.id: person.name for person in payload.people}
    if len(people_by_id) != len(payload.people):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Duplicate person ids are not allowed")

    target_currency = payload.target_currency
    rates = {k.upper(): Decimal(str(v)) for k, v in payload.exchange_rates.items()}
    rates[target_currency] = Decimal("1")

    paid: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    owed: dict[int, Decimal] = defaultdict(lambda: Decimal("0"))
    expense_details: list[dict] = []

    for expense in payload.expenses:
        if expense.payer_id not in people_by_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid payer id: {expense.payer_id}")

        if expense.currency not in rates:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Missing exchange rate for {expense.currency}")

        rate = rates[expense.currency]
        if rate <= 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid exchange rate for {expense.currency}")

        for part in expense.participants:
            if part.person_id not in people_by_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid participant id: {part.person_id}")

        for adj in expense.adjustments:
            if adj.person_id not in people_by_id:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"Invalid adjustment id: {adj.person_id}")

        expense_target = to_money(expense.amount * rate)
        paid[expense.payer_id] += expense_target

        total_adjustments_abs, adjustment_effects = compute_adjustment_effects(expense.adjustments, expense.participants)

        # Public pool = total expense - all adjustment absolute values.
        base_amount = expense.amount - total_adjustments_abs
        if base_amount < 0:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Adjustments exceed expense amount")

        shares = compute_shares(base_amount, expense.participants)
        for person_id, share_amount in shares.items():
            final_share = share_amount + adjustment_effects.get(person_id, Decimal("0"))
            owed[person_id] += to_money(final_share * rate)

        expense_details.append(
            build_expense_detail(
                expense=expense,
                people_by_id=people_by_id,
                base_amount=to_money(base_amount),
                shares=shares,
                adjustment_effects=adjustment_effects,
                adjustments=expense.adjustments,
            )
        )

    person_ids = [person.id for person in payload.people]
    net: dict[int, Decimal] = {}
    for person_id in person_ids:
        paid[person_id] = to_money(paid[person_id])
        owed[person_id] = to_money(owed[person_id])
        net[person_id] = to_money(paid[person_id] - owed[person_id])

    creditors: list[tuple[int, Decimal]] = []
    debtors: list[tuple[int, Decimal]] = []
    for person_id in person_ids:
        if net[person_id] > 0:
            creditors.append((person_id, net[person_id]))
        elif net[person_id] < 0:
            debtors.append((person_id, -net[person_id]))

    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    transfers = []
    debtors_copy = debtors.copy()
    creditors_copy = creditors.copy()

    while debtors_copy and creditors_copy:
        debtor_id, debt_remaining = debtors_copy[0]
        creditor_id, credit_remaining = creditors_copy[0]

        amount = to_money(min(debt_remaining, credit_remaining))
        if amount > 0:
            transfers.append(
                {
                    "from_person_id": debtor_id,
                    "from_name": people_by_id[debtor_id],
                    "to_person_id": creditor_id,
                    "to_name": people_by_id[creditor_id],
                    "amount": str(amount),
                    "currency": target_currency,
                }
            )

        debt_remaining = to_money(debt_remaining - amount)
        credit_remaining = to_money(credit_remaining - amount)

        if debt_remaining == 0:
            debtors_copy.pop(0)
        else:
            debtors_copy[0] = (debtor_id, debt_remaining)

        if credit_remaining == 0:
            creditors_copy.pop(0)
        else:
            creditors_copy[0] = (creditor_id, credit_remaining)

    people_summary = [
        {
            "person_id": person_id,
            "name": people_by_id[person_id],
            "paid": str(to_money(paid[person_id])),
            "owed": str(to_money(owed[person_id])),
            "net": str(to_money(net[person_id])),
            "currency": target_currency,
        }
        for person_id in person_ids
    ]

    return {
        "target_currency": target_currency,
        "people": people_summary,
        "transfers": transfers,
        "expense_details": expense_details,
    }
