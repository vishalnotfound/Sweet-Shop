import os
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import JWTError, jwt

import models, schemas, auth
from database import engine, get_db

app = FastAPI()

@app.on_event("startup")
async def startup():
    models.Base.metadata.create_all(bind=engine)
    db = next(get_db())
    try:
        if db.query(models.Sweet).count() == 0:
            db.add_all([
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
            ])
            db.commit()
    finally:
        db.close()

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username = payload.get("sub")
        if not username:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise credentials_exception
    return user

async def get_admin_user(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin privileges required")
    return current_user

@app.post("/api/auth/register", response_model=schemas.UserOut)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    if db.query(models.User).filter(models.User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered")
    new_user = models.User(
        username=user.username,
        hashed_password=auth.get_password_hash(user.password),
        role=user.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/api/auth/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect username or password")
    token = auth.create_access_token({"sub": user.username, "role": user.role})
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@app.get("/api/sweets", response_model=List[schemas.SweetOut])
def get_sweets(search: Optional[str] = None, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(models.Sweet)
    if search:
        query = query.filter(
            models.Sweet.name.contains(search) |
            models.Sweet.category.contains(search)
        )
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
