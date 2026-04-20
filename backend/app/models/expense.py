from sqlalchemy import DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import mapped_column, relationship

from app.db.base import Base


class Expense(Base):
    __tablename__ = "expenses"

    id = mapped_column(Integer, primary_key=True, index=True)
    group_id = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    paid_by_member_id = mapped_column(
        ForeignKey("members.id", ondelete="RESTRICT"),
        nullable=False,
        index=True,
    )

    title = mapped_column(String(120), nullable=False)
    amount = mapped_column(Numeric(18, 2), nullable=False)
    currency = mapped_column(String(3), nullable=False)
    fx_rate = mapped_column(Numeric(18, 8), nullable=True)
    occurred_at = mapped_column(DateTime(timezone=True), nullable=False)
    note = mapped_column(Text, nullable=True)
    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    group = relationship("Group", back_populates="expenses")
    payer = relationship("Member", back_populates="paid_expenses", foreign_keys=[paid_by_member_id])
    participants = relationship("ExpenseParticipant", back_populates="expense", cascade="all, delete-orphan")
    adjustments = relationship("Adjustment", back_populates="expense", cascade="all, delete-orphan")
