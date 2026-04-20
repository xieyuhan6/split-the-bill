from decimal import Decimal
from enum import Enum

from pydantic import BaseModel, Field, field_validator


class SplitType(str, Enum):
    EQUAL = "equal"
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class PersonInput(BaseModel):
    id: int
    name: str = Field(min_length=1, max_length=80)


class ExpenseParticipantInput(BaseModel):
    person_id: int
    split_type: SplitType
    split_value: Decimal = Field(gt=0)


class ExpenseAdjustmentInput(BaseModel):
    person_id: int
    delta_amount: Decimal


class ExpenseInput(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    payer_id: int
    amount: Decimal = Field(gt=0)
    currency: str = Field(min_length=3, max_length=3)
    participants: list[ExpenseParticipantInput]
    adjustments: list[ExpenseAdjustmentInput] = []

    @field_validator("currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class CalculateRequest(BaseModel):
    people: list[PersonInput] = Field(min_length=1)
    expenses: list[ExpenseInput]
    target_currency: str = Field(min_length=3, max_length=3)
    exchange_rates: dict[str, Decimal] = {}

    @field_validator("target_currency")
    @classmethod
    def normalize_target_currency(cls, value: str) -> str:
        return value.upper()


class PersonSummary(BaseModel):
    person_id: int
    name: str
    paid: str
    owed: str
    net: str
    currency: str


class TransferSummary(BaseModel):
    from_person_id: int
    from_name: str
    to_person_id: int
    to_name: str
    amount: str
    currency: str


class ExpenseDetailSummary(BaseModel):
    title_and_amount: str
    total_line: str
    adjustment_line: str
    process_line: str
    participants_breakdown: str
    final_breakdown: str
    final_lines: list[str]
    adjustments_display: str


class CalculateResponse(BaseModel):
    target_currency: str
    people: list[PersonSummary]
    transfers: list[TransferSummary]
    expense_details: list[ExpenseDetailSummary] = []
