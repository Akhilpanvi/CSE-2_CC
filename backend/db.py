import os

import certifi
from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()

_client = MongoClient(
    os.environ["MONGODB_URI"],
    tlsCAFile=certifi.where()
)

db = _client[os.environ.get("MONGODB_DB_NAME", "cse2_certification")]

students_collection = db["students"]
courses_collection = db["courses"]
admins_collection = db["admins"]
settings_collection = db["settings"]

students_collection.create_index("student_id", unique=True)
courses_collection.create_index("code", unique=True)
admins_collection.create_index("username", unique=True)
