from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.group import Group
from app.models.member import Member
from app.schemas.member import MemberCreate, MemberRead

router = APIRouter()


@router.post("/groups/{group_id}/members", response_model=MemberRead, status_code=status.HTTP_201_CREATED)
async def create_member(group_id: int, payload: MemberCreate, db: AsyncSession = Depends(get_db)) -> Member:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    member = Member(group_id=group_id, display_name=payload.display_name, email=payload.email)
    db.add(member)
    await db.commit()
    await db.refresh(member)
    return member


@router.get("/groups/{group_id}/members", response_model=list[MemberRead])
async def list_members(group_id: int, db: AsyncSession = Depends(get_db)) -> list[Member]:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    result = await db.execute(
        select(Member).where(Member.group_id == group_id).order_by(Member.id.asc())
    )
    return list(result.scalars().all())
