from datetime import datetime

from pydantic import BaseModel, Field


class MemberCreate(BaseModel):
    display_name: str = Field(min_length=1, max_length=80)
    email: str | None = Field(default=None, max_length=255)


class MemberRead(BaseModel):
    id: int
    group_id: int
    display_name: str
    email: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
