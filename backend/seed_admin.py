"""
One-time bootstrap: create the first admin account.

Usage:
    python3 seed_admin.py <username> <password>
"""

import sys

from auth import hash_password
from db import admins_collection

if __name__ == "__main__":

    if len(sys.argv) != 3:
        print("Usage: python3 seed_admin.py <username> <password>")
        sys.exit(1)

    username, password = sys.argv[1], sys.argv[2]

    if admins_collection.find_one({"username": username}):
        print(f"Admin '{username}' already exists.")
        sys.exit(1)

    admins_collection.insert_one({
        "username": username,
        "password_hash": hash_password(password)
    })

    print(f"Admin '{username}' created.")
