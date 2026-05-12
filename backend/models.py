from pydantic import BaseModel
from typing import List, Optional

class Product(BaseModel):
    id: int
    name: str
    price: float
    imageUrl: str

class CartItem(BaseModel):
    id: int
    quantity: int

class PaymentRequest(BaseModel):
    items: List[CartItem]
    total: float

class ChatRequest(BaseModel):
    message: str

class ProductCreate(BaseModel):
    name: str
    price: float
    imageUrl: str
    category: Optional[str] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    imageUrl: Optional[str] = None
    category: Optional[str] = None

class ContactRequest(BaseModel):
    name: str
    email: str
    subject: str
    message: str
