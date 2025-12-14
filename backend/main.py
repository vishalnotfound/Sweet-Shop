import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt

import models, schemas, auth
from database import engine, get_db

# Create DB Tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

# Seed default candies on startup
@app.on_event("startup")
async def seed_data():
    db = next(get_db())
    try:
        # Check if candies already exist
        existing_count = db.query(models.Sweet).count()
        if existing_count == 0:
            default_candies = [
                models.Sweet(name="Gummy Bears", category="Gummies", price=4.99, quantity=20),
                models.Sweet(name="Chocolate Truffles", category="Chocolate", price=6.99, quantity=15),
                models.Sweet(name="Lollipops", category="Hard Candy", price=1.99, quantity=50),
                models.Sweet(name="Marshmallows", category="Soft Candy", price=3.49, quantity=25),
                models.Sweet(name="Licorice Strips", category="Licorice", price=2.99, quantity=30),
                models.Sweet(name="Caramel Cubes", category="Caramel", price=5.49, quantity=18),
                models.Sweet(name="Jelly Beans", category="Gummies", price=3.99, quantity=40),
                models.Sweet(name="Peppermint Bark", category="Chocolate", price=7.99, quantity=12),
                models.Sweet(name="Rock Candy", category="Hard Candy", price=4.49, quantity=22),
                models.Sweet(name="Toffees", category="Candy", price=5.99, quantity=19),
                models.Sweet(name="Swedish Fish", category="Gummies", price=4.49, quantity=35),
                models.Sweet(name="Butterscotch Drops", category="Hard Candy", price=2.49, quantity=45),
                models.Sweet(name="Fudge Squares", category="Chocolate", price=6.49, quantity=14),
                models.Sweet(name="Taffy Assortment", category="Soft Candy", price=5.99, quantity=20),
                models.Sweet(name="Cotton Candy", category="Spun Sugar", price=3.99, quantity=28),
                models.Sweet(name="Sour Gummy Worms", category="Gummies", price=3.49, quantity=32),
                models.Sweet(name="Chocolate Covered Cherries", category="Chocolate", price=7.49, quantity=11),
                models.Sweet(name="Jawbreaker", category="Hard Candy", price=0.99, quantity=60),
                models.Sweet(name="Candy Corn", category="Seasonal", price=2.99, quantity=38),
                models.Sweet(name="Malt Balls", category="Chocolate", price=5.99, quantity=25),
            ]
            db.add_all(default_candies)
            db.commit()
            print("✓ Default candies seeded successfully")
    finally:
        db.close()

# CORS Setup (Allow Frontend)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"], # Vite default port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    # Allow the specific Vercel URL
    allow_origins=[FRONTEND_URL], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- Dependencies ---
async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

# --- Auth Endpoints ---
@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(username=user.username, hashed_password=hashed_password, role=user.role)
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    access_token = auth.create_access_token(data={"sub": user.username, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer", "role": user.role}

# --- Sweet Endpoints ---
@app.get("/api/sweets", response_model=List[schemas.SweetOut])
def get_sweets(
    search: Optional[str] = None, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(models.Sweet)
    if search:
        query = query.filter(models.Sweet.name.contains(search) | models.Sweet.category.contains(search))
    return query.all()

@app.get("/api/sweets/search", response_model=List[schemas.SweetOut])
def search_sweets(
    name: Optional[str] = None, 
    category: Optional[str] = None, 
    min_price: Optional[float] = None, 
    max_price: Optional[float] = None, 
    current_user: models.User = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    query = db.query(models.Sweet)
    
    if name:
        query = query.filter(models.Sweet.name.contains(name))
    if category:
        query = query.filter(models.Sweet.category.contains(category))
    if min_price is not None:
        query = query.filter(models.Sweet.price >= min_price)
    if max_price is not None:
        query = query.filter(models.Sweet.price <= max_price)
    
    return query.all()

@app.post("/api/sweets", response_model=schemas.SweetOut)
def create_sweet(sweet: schemas.SweetCreate, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    new_sweet = models.Sweet(**sweet.dict())
    db.add(new_sweet)
    db.commit()
    db.refresh(new_sweet)
    return new_sweet

@app.put("/api/sweets/{sweet_id}", response_model=schemas.SweetOut)
def update_sweet(sweet_id: int, sweet_update: schemas.SweetUpdate, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Sweet not found")
    
    for field, value in sweet_update.dict(exclude_unset=True).items():
        setattr(sweet, field, value)
    
    db.commit()
    db.refresh(sweet)
    return sweet

@app.delete("/api/sweets/{sweet_id}")
def delete_sweet(sweet_id: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Sweet not found")
    db.delete(sweet)
    db.commit()
    return {"message": "Sweet deleted"}

@app.post("/api/sweets/{sweet_id}/purchase")
def purchase_sweet(sweet_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Sweet not found")
    if sweet.quantity < 1:
        raise HTTPException(status_code=400, detail="Out of stock")
    
    sweet.quantity -= 1
    db.commit()
    return {"message": "Purchase successful", "remaining_quantity": sweet.quantity}

@app.post("/api/sweets/{sweet_id}/restock")
def restock_sweet(sweet_id: int, quantity: int, db: Session = Depends(get_db), admin: models.User = Depends(get_admin_user)):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Sweet not found")
    
    sweet.quantity += quantity
    db.commit()
    return {"message": "Restocked successfully", "new_quantity": sweet.quantity}

# --- Cart Endpoints ---
@app.post("/api/cart/add")
def add_to_cart(item: schemas.CartItemCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    sweet = db.query(models.Sweet).filter(models.Sweet.id == item.sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Sweet not found")
    if sweet.quantity < item.quantity:
        raise HTTPException(status_code=400, detail="Not enough stock")
    
    # Decrease stock
    sweet.quantity -= item.quantity
    
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.user_id == current_user.id,
        models.CartItem.sweet_id == item.sweet_id
    ).first()
    
    if cart_item:
        cart_item.quantity += item.quantity
    else:
        cart_item = models.CartItem(user_id=current_user.id, sweet_id=item.sweet_id, quantity=item.quantity)
        db.add(cart_item)
    
    db.commit()
    return {"message": "Added to cart", "quantity": cart_item.quantity, "remaining_stock": sweet.quantity}

@app.get("/api/cart")
def get_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    total_price = sum(item.sweet.price * item.quantity for item in cart_items)
    items_with_sweet = []
    for item in cart_items:
        items_with_sweet.append({
            "id": item.id,
            "sweet_id": item.sweet_id,
            "sweet_name": item.sweet.name,
            "sweet_price": item.sweet.price,
            "quantity": item.quantity
        })
    return {"items": items_with_sweet, "total_price": total_price}

@app.delete("/api/cart/{cart_item_id}")
def remove_from_cart(cart_item_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.id == cart_item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    # Return stock to inventory
    sweet = db.query(models.Sweet).filter(models.Sweet.id == cart_item.sweet_id).first()
    if sweet:
        sweet.quantity += cart_item.quantity
    
    db.delete(cart_item)
    db.commit()
    return {"message": "Removed from cart"}

@app.put("/api/cart/{cart_item_id}/quantity")
def update_cart_quantity(cart_item_id: int, new_quantity: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart_item = db.query(models.CartItem).filter(
        models.CartItem.id == cart_item_id,
        models.CartItem.user_id == current_user.id
    ).first()
    if not cart_item:
        raise HTTPException(status_code=404, detail="Cart item not found")
    
    sweet = db.query(models.Sweet).filter(models.Sweet.id == cart_item.sweet_id).first()
    if not sweet:
        raise HTTPException(status_code=404, detail="Sweet not found")
    
    # Calculate quantity difference
    quantity_diff = new_quantity - cart_item.quantity
    
    if quantity_diff > 0:
        # Increasing quantity - check if stock available
        if sweet.quantity < quantity_diff:
            raise HTTPException(status_code=400, detail="Not enough stock")
        sweet.quantity -= quantity_diff
    elif quantity_diff < 0:
        # Decreasing quantity - return to stock
        sweet.quantity += abs(quantity_diff)
    
    if new_quantity <= 0:
        # Remove item if quantity is 0 or less
        db.delete(cart_item)
        db.commit()
        return {"message": "Item removed from cart"}
    
    cart_item.quantity = new_quantity
    db.commit()
    return {"message": "Quantity updated", "quantity": cart_item.quantity, "remaining_stock": sweet.quantity}

@app.delete("/api/cart")
def clear_cart(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
    db.commit()
    return {"message": "Cart cleared"}

@app.post("/api/cart/checkout")
def checkout(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    cart_items = db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).all()
    
    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")
    
    purchased_items = []
    for item in cart_items:
        sweet = db.query(models.Sweet).filter(models.Sweet.id == item.sweet_id).first()
        if sweet:
            sweet.quantity -= item.quantity
            purchased_items.append({
                "name": sweet.name,
                "quantity": item.quantity,
                "price": sweet.price
            })
    
    # Clear the cart
    db.query(models.CartItem).filter(models.CartItem.user_id == current_user.id).delete()
    db.commit()
    
    return {
        "message": "Purchase successful",
        "items": purchased_items,
        "total_items": len(purchased_items)
    }