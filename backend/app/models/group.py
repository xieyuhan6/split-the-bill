from sqlalchemy import DateTime, Integer, String, func
from sqlalchemy.orm import mapped_column, relationship

from app.db.base import Base


class Group(Base):
    __tablename__ = "groups"

    id = mapped_column(Integer, primary_key=True, index=True)
    name = mapped_column(String(100), nullable=False)
    base_currency = mapped_column(String(3), nullable=False, default="USD")
    created_at = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    members = relationship("Member", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")
