import os
import logging
import pathlib
import sqlite3
import hashlib
import uuid
import bcrypt
from datetime import timedelta
from fastapi import FastAPI, Form, HTTPException, File, UploadFile, Depends
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi_login import LoginManager
from fastapi.security import OAuth2PasswordRequestForm
from fastapi_login.exceptions import InvalidCredentialsException

SECRET = os.environ.get('JWT_SECRET', 'test')

app = FastAPI()
manager = LoginManager(SECRET, token_url='/login', default_expiry=timedelta(hours=12))
logger = logging.getLogger("uvicorn")
logger.level = logging.DEBUG
images = pathlib.Path(__file__).parent.resolve() / "images"
origins = [ os.environ.get('FRONT_URL', 'http://localhost:3000') ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

dbfile = "../db/items.db"
dbname = "mercari.sqlite3"

categories = [
    "Women",
    "Men",
    "Baby / Kids",
    "Interior / House / Accessories",
    "Books / Music / Games",
    "Toys / Hobbies / Goods",
    "Cosmetic / Perfume / Beauties",
    "Home appliances / Smartphones / Cameras",
    "Sport / Leisure",
    "Handmade",
    "Ticket",
    "Car / Motorcycle",
    "others"
]


def init_db():
    if os.path.isfile(dbname):
        return

    conn = sqlite3.connect(dbname)
    c = conn.cursor() 

    with open(dbfile, 'r') as f:
        sql_as_string = f.read()
        c.executescript(sql_as_string)

    for c in categories:
        add_category(c)

    conn.commit()
    conn.close()

@app.get("/")
def root():
    return {"message": "Hello, world!"}

@manager.user_loader()
async def query_user(username: str):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT
            id, username, password
        FROM
            users
        WHERE
            username = ?
        ''',
        (username,)
    )

    response = [row for row in c]
    conn.close()

    if len(response) == 0:
        return None

    return response[0]

@app.post("/login")
async def login(data: OAuth2PasswordRequestForm = Depends()):
    username = data.username
    password = data.password

    # Get the user DB
    user = await query_user(username)

    # Confirm password matches
    if not user:
        raise InvalidCredentialsException
    elif not bcrypt.checkpw(bytes(password, 'utf-8'), user['password']):
        raise InvalidCredentialsException

    access_token = manager.create_access_token(
        data={'sub': user["username"], 'id': user["id"]},
        expires=timedelta(hours=12)
    )

    return {'access_token': access_token}

@app.get('/protected')
def protected_route(user=Depends(manager)):
    user = {
        "id": user["id"],
        "username": user["username"]
    }
    return user

@app.post("/register")
async def create_users(username: str = Form(...), password: str = Form(...)):
    # generate UUID
    userid = str(uuid.uuid4())
    hashed = bcrypt.hashpw(bytes(password, 'utf-8'), bcrypt.gensalt())

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    c.execute(
        '''
        INSERT INTO
            users
        VALUES
            (?, ?, ?)
        ''',
        (userid, username, hashed)
    )

    conn.commit()
    conn.close()

    return {"status": "registration complete"}


@app.post("/items", status_code=201)
async def add_item(
        user=Depends(manager),
        name: str = Form(...), category: str = Form(...), image: UploadFile = File(...),
        price: int = Form(...), is_auction: int = Form(0), on_sale: int = Form(1),
    ):
    logger.info(f"Receive item: {name} Category: {category} Image: {image}")

    # generate UUID
    id = str(uuid.uuid4())
    # check if the image is .jpg
    file_name = image.filename
    if not file_name.lower().endswith(('.jpg')):
        raise HTTPException(status_code=400, detail="File does not end with .jpg")

    # hash the file name and save it in images folder
    hashed_file_name = f"{hashlib.sha256(file_name.encode()).hexdigest()}.jpg"
    image_bytes = await image.read()
    with open(images / hashed_file_name, "wb") as f:
        f.write(image_bytes)

    # save hashed file name to db
    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    c.execute(
        '''
        INSERT INTO
            items (id, name, category_id, image, price, is_auction, on_sale, seller_id) 
        VALUES 
            (?, ?, ?, ?, ?, ?, ?, ?)
        ''',
        (id, name, category, hashed_file_name, price, is_auction, on_sale, user["id"])
    )

    conn.commit()
    conn.close()
    return {"message": f"item received: {name}"}


@app.get("/items")
def show_item(user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            items.id,
            items.name, 
            category.name as category,
            items.image,
            items.price,
            items.is_auction,
            items.on_sale,
            items.seller_id
        FROM 
            items 
        INNER JOIN 
            category 
        ON 
            items.category_id=category.id
        '''
    )
    response = { "items": [row for row in c] }
    conn.close()

    return response


@app.get("/items/{id}")
def item_details(id, user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            items.id, 
            items.name, 
            category.name as category,
            items.image, 
            items.price,
            items.is_auction,
            items.on_sale,
            items.seller_id
        FROM 
            items 
        INNER JOIN 
            category 
        ON 
            items.category_id=category.id 
        WHERE 
            items.id = (?)
        ''',
        (id,)
    )
    response = [row for row in c]
    conn.close()

    if len(response) == 0:
        logger.debug(f"item with id {id} not found")
        raise HTTPException(status_code=404, detail="Item not found")

    return response[0]


@app.get("/search")
def search_item(keyword: str, user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT
            id,
            name, 
            category_id 
        FROM 
            items 
        WHERE 
            name 
        LIKE 
            (?)
        ''',
        (f'%{keyword}%',)
    )
    response = { "items": [row for row in c] }

    return response


@app.get("/image/{image_filename}")
async def get_image(image_filename, user=Depends(manager)):
    # Create image path
    image = images / image_filename

    if not image_filename.endswith(".jpg"):
        raise HTTPException(status_code=400, detail="Image path does not end with .jpg")

    if not image.exists():
        logger.debug(f"Image not found: {image}")
        image = images / "default.jpg"


    return FileResponse(image)


@app.post("/categories")
def add_category(name: str = Form(...), user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    try:
        # generate UUID
        id = str(uuid.uuid4())
        c.execute("INSERT INTO category (id, name) VALUES (?, ?)", (id, name))
        conn.commit()
    except sqlite3.IntegrityError as err:
        if "UNIQUE constraint" in str(err):
            raise HTTPException(status_code=400, detail=f"This category already exists: {name}")
        # Log unhandled errors and re-raise
        logger.error(f"Unhandled error occurred")
        raise err
    finally:
        conn.close()

    return {"message": f"New category added: {name}"}

@app.get("/categories")
def show_category(user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            id,
            name
        FROM 
            category
        '''
    )
    response = { "items": [row for row in c] }
    conn.close()

    return response

@app.put("/update/status/{id}")
def update_status(id,user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        UPDATE 
            items
        SET
            on_sale = 0
        WHERE
            id = (?)
        ''',
        (id,)
    )

    conn.commit()
    conn.close()

    return item_details(id)

@app.post("/auction/{item_id}", status_code=201)
def add_bid(item_id: str, bid_price: str = Form(...), user=Depends(manager)):
    logger.info(f"New bid: {bid_price} yen for items_id: {item_id}")

    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    
    try:
        # generate UUID
        generated_id = str(uuid.uuid4())
    
        c.execute("SELECT name FROM items WHERE id = (?)", (item_id,))
        data = c.fetchall()
        
        (name, ) = data[0]

        c.execute(
            '''
            INSERT INTO
                auction (id, bidder_id, items_id, bid_price, item_name)
            VALUES 
                (?, ?, ?, ?, ?)
            ''',
            (generated_id, user["id"], item_id, bid_price, name)
        )
        conn.commit()
    except sqlite3.IntegrityError as err:
        if "UNIQUE constraint" in str(err):
            logger.error(f"Unhandled error occurred")
            raise HTTPException(status_code=400, detail=f"This user already has a bid for this item")
    finally:
        conn.close()

    return {name}

@app.get("/auction/seller")   #FOR Seller
def show_auction(user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            auction.id,
            auction.bidder_id,
            auction.items_id,
            auction.bid_price,
            auction.item_name
        FROM 
            auction
        INNER JOIN
            items
        ON
            auction.items_id = items.id
        WHERE
            items.seller_id = (?)
        ''',
        (user["id"],)
    )

@app.get("/auction/bidder")   #FOR Buyer
def show_auction(user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            auction.id,
            auction.bidder_id,
            auction.items_id,
            auction.bid_price,
            auction.item_name
        FROM 
            auction
        INNER JOIN
            items
        ON
            auction.items_id = items.id
        WHERE
            auction.bidder_id = (?)
        ''',
        (user["id"],)
    )
    
    response = { "items": [row for row in c] }
    conn.close()

    return response

@app.put("/auction/{item_id}")
def update_bid(item_id: str, bid_price: str = Form(...), user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    
    c.execute(
    '''
    UPDATE 
        auction
    SET
        bid_price = (?)
    WHERE
        items_id = ? AND bidder_id = ?
    ''',
        (bid_price, item_id, user["id"])
    )
    conn.commit()
    conn.close()

    if c.rowcount > 0:
        return {"message": f"bid price updated: {bid_price}"}

    logger.debug(f"item with id {item_id} not found")
    raise HTTPException(status_code=404, detail=f"Item not found")

@app.delete("/auction/{item_id}")
def delete_bid(item_id: str, user=Depends(manager)):
    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    c.execute(
    '''
    DELETE FROM 
        auction
    WHERE
        items_id = ? AND bidder_id = ?
    ''',
        (item_id, user["id"])
    )
    conn.commit()
    conn.close()

    if c.rowcount > 0:
        return {"message": f"bid for {item_id} is deleted"}

    logger.debug(f"item with id {item_id} not found")
    raise HTTPException(status_code=404, detail=f"Item not found")

init_db()
