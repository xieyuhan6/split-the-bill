from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, Field, field_validator

from app.models.expense_participant import SplitType


class ExpenseParticipantCreate(BaseModel):
    member_id: int
    split_type: SplitType
    split_value: Decimal = Field(gt=0)


class AdjustmentCreate(BaseModel):
    member_id: int
    delta_amount: Decimal
    currency: str = Field(min_length=3, max_length=3)
    reason: str | None = None

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class ExpenseCreate(BaseModel):
    paid_by_member_id: int
    title: str = Field(min_length=1, max_length=120)
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    fx_rate: Decimal | None = Field(default=None, gt=0)
    occurred_at: datetime
    note: str | None = None
    participants: list[ExpenseParticipantCreate]
    adjustments: list[AdjustmentCreate] = []

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class ExpenseRead(BaseModel):
    id: int
    group_id: int
    paid_by_member_id: int
    title: str
    amount: Decimal
    currency: str
    fx_rate: Decimal | None
    occurred_at: datetime
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ExpenseParticipantShareRead(BaseModel):
    member_id: int
    member_name: str
    split_type: SplitType
    split_value: Decimal
    owed_amount: Decimal
    currency: str


class ExpenseAdjustmentRead(BaseModel):
    member_id: int
    member_name: str
    delta_amount: Decimal
    currency: str
    reason: str | None


class ExpenseHistoryRead(BaseModel):
    id: int
    group_id: int
    paid_by_member_id: int
    payer_name: str
    title: str
    amount: Decimal
    currency: str
    fx_rate: Decimal | None
    occurred_at: datetime
    note: str | None
    created_at: datetime
    participant_shares: list[ExpenseParticipantShareRead]
    adjustments: list[ExpenseAdjustmentRead]
