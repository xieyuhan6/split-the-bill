from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    base_currency: str = Field(default="USD", min_length=3, max_length=3)

    @field_validator("base_currency")
    @classmethod
    def normalize_currency(cls, value: str) -> str:
        return value.upper()


class GroupRead(BaseModel):
    id: int
    name: str
    base_currency: str
    created_at: datetime

    model_config = {"from_attributes": True}
