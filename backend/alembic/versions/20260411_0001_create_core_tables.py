"""create core split bill tables

Revision ID: 20260411_0001
Revises: 
Create Date: 2026-04-11 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = "20260411_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    split_type = sa.Enum("equal", "percentage", "fixed", name="split_type")
    split_type.create(op.get_bind(), checkfirst=True)

    op.create_table(
        "groups",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("base_currency", sa.String(length=3), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_groups_id"), "groups", ["id"], unique=False)

    op.create_table(
        "members",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("display_name", sa.String(length=80), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_members_group_id"), "members", ["group_id"], unique=False)
    op.create_index(op.f("ix_members_id"), "members", ["id"], unique=False)

    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("group_id", sa.Integer(), nullable=False),
        sa.Column("paid_by_member_id", sa.Integer(), nullable=False),
        sa.Column("title", sa.String(length=120), nullable=False),
        sa.Column("amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("fx_rate", sa.Numeric(precision=18, scale=8), nullable=True),
        sa.Column("occurred_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("note", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP"), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["paid_by_member_id"], ["members.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_expenses_group_id"), "expenses", ["group_id"], unique=False)
    op.create_index(op.f("ix_expenses_id"), "expenses", ["id"], unique=False)
    op.create_index(op.f("ix_expenses_paid_by_member_id"), "expenses", ["paid_by_member_id"], unique=False)

    op.create_table(
        "adjustments",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("expense_id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("delta_amount", sa.Numeric(precision=18, scale=2), nullable=False),
        sa.Column("currency", sa.String(length=3), nullable=False),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["expense_id"], ["expenses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_adjustments_expense_id"), "adjustments", ["expense_id"], unique=False)
    op.create_index(op.f("ix_adjustments_id"), "adjustments", ["id"], unique=False)
    op.create_index(op.f("ix_adjustments_member_id"), "adjustments", ["member_id"], unique=False)

    op.create_table(
        "expense_participants",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("expense_id", sa.Integer(), nullable=False),
        sa.Column("member_id", sa.Integer(), nullable=False),
        sa.Column("split_type", split_type, nullable=False),
        sa.Column("split_value", sa.Numeric(precision=18, scale=6), nullable=False),
        sa.ForeignKeyConstraint(["expense_id"], ["expenses.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["member_id"], ["members.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("expense_id", "member_id", name="uq_expense_member"),
    )
    op.create_index(op.f("ix_expense_participants_expense_id"), "expense_participants", ["expense_id"], unique=False)
    op.create_index(op.f("ix_expense_participants_id"), "expense_participants", ["id"], unique=False)
    op.create_index(op.f("ix_expense_participants_member_id"), "expense_participants", ["member_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_expense_participants_member_id"), table_name="expense_participants")
    op.drop_index(op.f("ix_expense_participants_id"), table_name="expense_participants")
    op.drop_index(op.f("ix_expense_participants_expense_id"), table_name="expense_participants")
    op.drop_table("expense_participants")

    op.drop_index(op.f("ix_adjustments_member_id"), table_name="adjustments")
    op.drop_index(op.f("ix_adjustments_id"), table_name="adjustments")
    op.drop_index(op.f("ix_adjustments_expense_id"), table_name="adjustments")
    op.drop_table("adjustments")

    op.drop_index(op.f("ix_expenses_paid_by_member_id"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_id"), table_name="expenses")
    op.drop_index(op.f("ix_expenses_group_id"), table_name="expenses")
    op.drop_table("expenses")

    op.drop_index(op.f("ix_members_id"), table_name="members")
    op.drop_index(op.f("ix_members_group_id"), table_name="members")
    op.drop_table("members")

    op.drop_index(op.f("ix_groups_id"), table_name="groups")
    op.drop_table("groups")

    split_type = sa.Enum("equal", "percentage", "fixed", name="split_type")
    split_type.drop(op.get_bind(), checkfirst=True)
