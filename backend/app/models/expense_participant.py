from enum import Enum

from sqlalchemy import Enum as SQLEnum
from sqlalchemy import ForeignKey, Integer, Numeric, UniqueConstraint
from sqlalchemy.orm import mapped_column, relationship

from app.db.base import Base


class SplitType(str, Enum):
    EQUAL = "equal"
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class ExpenseParticipant(Base):
    __tablename__ = "expense_participants"
    __table_args__ = (UniqueConstraint("expense_id", "member_id", name="uq_expense_member"),)

    id = mapped_column(Integer, primary_key=True, index=True)
    expense_id = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    split_type = mapped_column(SQLEnum(SplitType, name="split_type"), nullable=False)
    split_value = mapped_column(Numeric(18, 6), nullable=False)

    expense = relationship("Expense", back_populates="participants")
    member = relationship("Member", back_populates="splits")
