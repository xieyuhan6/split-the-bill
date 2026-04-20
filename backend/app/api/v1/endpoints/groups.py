from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_db
from app.models.group import Group
from app.schemas.group import GroupCreate, GroupRead

router = APIRouter()


@router.post("", response_model=GroupRead, status_code=status.HTTP_201_CREATED)
async def create_group(payload: GroupCreate, db: AsyncSession = Depends(get_db)) -> Group:
    group = Group(name=payload.name, base_currency=payload.base_currency)
    db.add(group)
    await db.commit()
    await db.refresh(group)
    return group


@router.get("", response_model=list[GroupRead])
async def list_groups(db: AsyncSession = Depends(get_db)) -> list[Group]:
    result = await db.execute(select(Group).order_by(Group.id.desc()))
    return list(result.scalars().all())


@router.get("/{group_id}", response_model=GroupRead)
async def get_group(group_id: int, db: AsyncSession = Depends(get_db)) -> Group:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group


@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_group(group_id: int, db: AsyncSession = Depends(get_db)) -> None:
    group = await db.get(Group, group_id)
    if group is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    await db.delete(group)
    await db.commit()
