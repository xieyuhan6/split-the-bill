from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import mapped_column, relationship

from app.db.base import Base


class Adjustment(Base):
    __tablename__ = "adjustments"

    id = mapped_column(Integer, primary_key=True, index=True)
    expense_id = mapped_column(ForeignKey("expenses.id", ondelete="CASCADE"), nullable=False, index=True)
    member_id = mapped_column(ForeignKey("members.id", ondelete="CASCADE"), nullable=False, index=True)
    delta_amount = mapped_column(Numeric(18, 2), nullable=False)
    currency = mapped_column(String(3), nullable=False)
    reason = mapped_column(Text, nullable=True)

    expense = relationship("Expense", back_populates="adjustments")
    member = relationship("Member", back_populates="adjustments")
