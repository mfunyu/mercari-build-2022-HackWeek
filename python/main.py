import os
import logging
import pathlib
import sqlite3
import hashlib
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
logger = logging.getLogger("uvicorn")
logger.level = logging.DEBUG
images = pathlib.Path(__file__).parent.resolve() / "image"
origins = [ os.environ.get('FRONT_URL', 'http://localhost:3000') ]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET","POST","PUT","DELETE"],
    allow_headers=["*"],
)

dbname = "mercari.sqlite3"


@app.get("/")
def root():
    return {"message": "Hello, world!"}


@app.post("/items")
def add_item(name: str = Form(...), category: int = Form(...), image: str = Form(...)):
    logger.info(f"Receive item: {name} Category: {category} Image: {image}")
    
    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    hashed_image = hashlib.sha256(image.encode()).hexdigest()
    c.execute(
        '''
        INSERT INTO
            items (name, category_id, image) 
        VALUES 
            (?, ?, ?)
        ''',
        (name, category, f'{hashed_image}.jpg')
    )
    
    conn.commit()
    conn.close()

    return {"message": f"item received: {name}"}


@app.get("/items")
def show_item():

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            items.id, 
            items.name, 
            items.image, 
            category.name 
        FROM 
            items 
        INNER JOIN 
            category 
        ON 
            items.category_id=category.id
        '''
    )
    response = { "items": [{"name": name, "category": category_name, "image": image} for (item_id, name, image, category_name) in c] }
    conn.close()

    return response


@app.get("/items/{id}")
def item_details(id):

    conn = sqlite3.connect(dbname)
    c = conn.cursor()

    c.execute(
        '''
        SELECT 
            items.id, 
            items.name, 
            items.image, 
            category.name 
        FROM 
            items 
        INNER JOIN 
            category 
        ON 
            items.category_id=category.id 
        WHERE 
            items.id 
        IS 
            ?
        ''',
        id
    )
    response = [{"name": name, "category": category_name, "image": image} for (item_id, name, image, category_name) in c]
    conn.close()

    return response[0]


@app.get("/search")
def search_item(keyword: str):

    conn = sqlite3.connect(dbname)
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
    response = { "items": [{ "name": name, "category": category} for (item_id, name, category) in c] }

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


@app.post("/category")
def add_category(name: str = Form(...)):

    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    print("Database connected to Sqlite")

    c.execute("INSERT OR IGNORE INTO category (name) VALUES (?)", (name,))
    conn.commit()
    conn.close()

    return {"message": f"New category added: {name}"}