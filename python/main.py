import os
import logging
import pathlib
import sqlite3
import hashlib
import uuid
from fastapi import FastAPI, Form, HTTPException, File, UploadFile
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime

app = FastAPI()
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

def init_db():
    if os.path.isfile(dbname):
        return

    conn = sqlite3.connect(dbname)
    c = conn.cursor() 

    with open(dbfile, 'r') as f:
        sql_as_string = f.read()
        c.executescript(sql_as_string)

    conn.commit()
    conn.close()

@app.get("/")
def root():
    return {"message": "Hello, world!"}


@app.post("/items", status_code=201)
async def add_item(
        name: str = Form(...), category: str = Form(...), image: UploadFile = File(...),
        price: int = Form(7000), is_auction: int = Form(0), on_sale: int = Form(1)
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
            items (id, name, category_id, image, price, is_auction, on_sale) 
        VALUES 
            (?, ?, ?, ?, ?, ?, ?)
        ''',
        (id, name, category, hashed_file_name, price, is_auction, on_sale)
    )

    conn.commit()
    conn.close()
    return {"message": f"item received: {name}"}


@app.get("/items")
def show_item():
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
            items.on_sale
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
def item_details(id):
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
            items.on_sale
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
def search_item(keyword: str):
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
async def get_image(image_filename):
    # Create image path
    image = images / image_filename

    if not image_filename.endswith(".jpg"):
        raise HTTPException(status_code=400, detail="Image path does not end with .jpg")

    if not image.exists():
        logger.debug(f"Image not found: {image}")
        image = images / "default.jpg"


    return FileResponse(image)


@app.post("/categories")
def add_category(name: str = Form(...)):
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
def show_category():
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
def update_status(id):
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
def add_bid(item_id: str, bid_price: str = Form(...)):
    logger.info(f"New bid: {bid_price} yen for items_id: {item_id}")

    # generate UUID
    generated_id = str(uuid.uuid4())

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    c.execute("SELECT name FROM items WHERE id = (?)", (item_id,))
    data = c.fetchall()
    
    (name, ) = data[0]
    print(name)
    c.execute(
        '''
        INSERT INTO
            auction (id, bidder_name, items_id, bid_price, item_name)
        VALUES 
            (?, ?, ?, ?, ?)
        ''',
        (generated_id, "Bidder 1", item_id, bid_price, name)
    )

    conn.commit()
    conn.close()   
    return {data[0]}
    #return {"message": f"item received: {name}"}

@app.get("/auction/{item_id}")
def show_auction(item_id):
    conn = sqlite3.connect(dbname)
    conn.row_factory = sqlite3.Row
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            bidder_name,
            bid_price
        FROM 
            auction 
        WHERE
            items_id = ?
        ''',
        (item_id,)
    )
    response = { "items": [row for row in c] }
    conn.close()

    return response

init_db()
