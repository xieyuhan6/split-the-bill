from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import mapped_column, relationship

from app.db.base import Base


class Member(Base):
    __tablename__ = "members"

    id = mapped_column(Integer, primary_key=True, index=True)
    group_id = mapped_column(ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True)
    display_name = mapped_column(String(80), nullable=False)
    email = mapped_column(String(255), nullable=True)
    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    group = relationship("Group", back_populates="members")
    paid_expenses = relationship("Expense", back_populates="payer", foreign_keys="Expense.paid_by_member_id")
    splits = relationship("ExpenseParticipant", back_populates="member", cascade="all, delete-orphan")
    adjustments = relationship("Adjustment", back_populates="member", cascade="all, delete-orphan")
