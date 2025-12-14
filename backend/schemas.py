from pydantic import BaseModel
from typing import Optional

class UserCreate(BaseModel):
    username: str
    password: str
    role: str = "user" # 'user' or 'admin'

class UserOut(BaseModel):
    id: int
    username: str
    role: str
    class Config:
        orm_mode = True

class SweetCreate(BaseModel):
    name: str
    category: str
    price: float
    quantity: int

class SweetUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    price: Optional[float] = None
    quantity: Optional[int] = None

class SweetOut(SweetCreate):
    id: int
    class Config:
        orm_mode = True

class CartItemCreate(BaseModel):
    sweet_id: int
    quantity: int = 1

class CartItemOut(BaseModel):
    id: int
    sweet_id: int
    quantity: int
    class Config:
        orm_mode = True

class CartOut(BaseModel):
    items: list[CartItemOut]
    total_price: float