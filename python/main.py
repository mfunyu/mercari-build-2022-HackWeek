import os
import logging
import pathlib
import json
import sqlite3
from fastapi import FastAPI, Form, HTTPException
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()
logger = logging.getLogger("uvicorn")
logger.level = logging.INFO
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
def add_item(name: str = Form(...), category: str = Form(...)):
    logger.info(f"Receive item: {name} Category: {category}")
    
    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    print("Database connected to Sqlite")

    c.execute("INSERT INTO items (name, category) VALUES (?, ?)", (name, category))
    conn.commit()
    conn.close()
    return {"message": f"item received: {name}"}


@app.get("/items")
def show_item():

    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    print("Database connected to Sqlite")

    c.execute("SELECT id, name, category FROM items")
    response = { "items": [{"id": item_id,  "name": name, "category": category} for (item_id, name, category) in c] }
    conn.close()

    return response


@app.get("/search")
def search_item(keyword: str):
    print(keyword)
    conn = sqlite3.connect(dbname)
    c = conn.cursor()
    print("Database connected to Sqlite")

    c.execute('SELECT id, name, category FROM items WHERE name LIKE (?)', (f'%{keyword}%',))
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
