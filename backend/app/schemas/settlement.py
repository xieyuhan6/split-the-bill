from pydantic import BaseModel


class SettlementMemberSummary(BaseModel):
    member_id: int
    member_name: str
    paid: str
    owed: str
    net: str
    currency: str


class SettlementTransfer(BaseModel):
    from_member_id: int
    from_member_name: str
    to_member_id: int
    to_member_name: str
    amount: str
    currency: str


class SettlementRead(BaseModel):
    base_currency: str
    members: list[SettlementMemberSummary]
    transfers: list[SettlementTransfer]
