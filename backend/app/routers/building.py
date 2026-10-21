from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.building import Building
from app.models.user import User
from app.schemas.building import (
    BuildingCreate,
    BuildingUpdate,
    BuildingResponse
)
from app.dependencies.auth import require_roles

router = APIRouter(
    prefix="/buildings",
    tags=["Buildings"]
)


@router.post(
    "",
    response_model=BuildingResponse
)
def create_building(
    data: BuildingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    existing = db.query(Building).filter(
        Building.building_code == data.building_code
    ).first()

    if existing:
        raise HTTPException(
            status_code=400,
            detail="Mã tòa nhà đã tồn tại"
        )

    building = Building(
        building_code=data.building_code,
        name=data.name,
        address=data.address,
        total_floors=data.total_floors,
        total_apartments=data.total_apartments,
        status=data.status
    )

    db.add(building)
    db.commit()
    db.refresh(building)

    return building
@router.get(
    "",
    response_model=list[BuildingResponse]
)
def get_buildings(
    db: Session = Depends(get_db)
):
    buildings = db.query(Building).all()
    return buildings


@router.get(
    "/{building_id}",
    response_model=BuildingResponse
)
def get_building(
    building_id: int,
    db: Session = Depends(get_db)
):
    building = db.query(Building).filter(
        Building.id == building_id
    ).first()

    if building is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tòa nhà"
        )

    return building
@router.put(
    "/{building_id}",
    response_model=BuildingResponse
)
def update_building(
    building_id: int,
    data: BuildingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN", "STAFF")
    )
):

    building = db.query(Building).filter(
        Building.id == building_id
    ).first()

    if building is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tòa nhà"
        )

    duplicate = db.query(Building).filter(
        Building.building_code == data.building_code,
        Building.id != building_id
    ).first()

    if duplicate:
        raise HTTPException(
            status_code=400,
            detail="Mã tòa nhà đã tồn tại"
        )

    building.building_code = data.building_code
    building.name = data.name
    building.address = data.address
    building.total_floors = data.total_floors
    building.total_apartments = data.total_apartments
    building.status = data.status

    db.commit()
    db.refresh(building)

    return building
@router.delete("/{building_id}")
def delete_building(
    building_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles("ADMIN")
    )
):

    building = db.query(Building).filter(
        Building.id == building_id
    ).first()

    if building is None:
        raise HTTPException(
            status_code=404,
            detail="Không tìm thấy tòa nhà"
        )

    db.delete(building)
    db.commit()

    return {
        "message": "Xóa tòa nhà thành công"
    }