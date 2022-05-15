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
conn = sqlite3.connect(dbname, check_same_thread=False)
c = conn.cursor()
print("Database connected to Sqlite")


@app.get("/")
def root():
    return {"message": "Hello, world!"}


@app.post("/items")
def add_item(name: str = Form(...), category: str = Form(...)):
    logger.info(f"Receive item: {name} Category: {category}")

    c.execute("INSERT INTO items (name, category) VALUES (?, ?)", (name, category))
    conn.commit()
    return {"message": f"item received: {name}"}


@app.get("/items")
def show_item():
    c.execute("SELECT id, name, category FROM items")
    return { "items": [{"id": item_id,  "name": name, "category": category} for (item_id, name, category) in c] }
 

@app.get("/image/{items_image}")
async def get_image(items_image):
    # Create image path
    image = images / items_image

    if not items_image.endswith(".jpg"):
        raise HTTPException(status_code=400, detail="Image path does not end with .jpg")

    if not image.exists():
        logger.debug(f"Image not found: {image}")
        image = images / "default.jpg"

    return FileResponse(image)
