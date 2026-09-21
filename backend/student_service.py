from auth import hash_password
from db import (
    admins_collection,
    courses_collection,
    settings_collection,
    students_collection
)

SEMESTERS = ["2-1", "2-2", "3-1", "3-2"]

SETTINGS_DOC_ID = "global_settings"


# ============================================================
# GLOBAL SETTINGS
# ============================================================

def get_settings():

    doc = settings_collection.find_one({"_id": SETTINGS_DOC_ID})

    return {
        "replacement_access": (doc or {}).get("replacement_access", "ALL")
    }


def set_replacement_access(mode):

    if mode not in ("ALL", "PLACED"):
        return {
            "success": False,
            "message": "Mode must be 'ALL' or 'PLACED'."
        }

    settings_collection.update_one(
        {"_id": SETTINGS_DOC_ID},
        {"$set": {"replacement_access": mode}},
        upsert=True
    )

    return {"success": True, "message": f"Replacement access set to {mode}."}


def is_student_placed(placed_value):
    return (placed_value or "").strip().lower() == "placed"


def replacement_allowed_for_student(student):

    settings = get_settings()

    if settings["replacement_access"] == "ALL":
        return True

    return is_student_placed(student.get("placed"))


# ============================================================
# REPLACEMENT ELIGIBILITY
# ============================================================

def can_replace(course_code, erp_status, current_status):

    if not course_code:
        return False

    erp = (erp_status or "").strip().lower()
    current = (current_status or "").strip().lower()

    completed_values = {
        "completed",
        "completed and results released",
        "completed but marked as gp",
        "completed but result yet to be released",
        "pass",
        "passed"
    }

    if current in completed_values:
        return False

    if "not completed" in current or "not done" in current:
        return True

    if erp == "gp":
        return True

    return False


# ============================================================
# COURSES
# ============================================================

def get_courses():
    return list(
        courses_collection.find({}, {"_id": 0}).sort("code", 1)
    )


# ============================================================
# STUDENT LOOKUP
# ============================================================

def find_student(student_id):
    return students_collection.find_one(
        {"student_id": student_id},
        {"_id": 0}
    )


def get_registered_codes(student):

    registered = set()

    for semester in SEMESTERS:

        data = student["history"].get(semester, {})

        if data.get("course_code"):
            registered.add(data["course_code"])

        if data.get("replacement_code"):
            registered.add(data["replacement_code"])

    for field in ("current_4_1", "current_4_2"):

        value = student.get(field) or ""

        if value:
            code = value.split("-", 1)[0].strip()

            if code:
                registered.add(code)

    return registered


def get_available_courses(student):

    registered_codes = get_registered_codes(student)

    courses = get_courses()

    return [
        course
        for course in courses
        if course["code"] not in registered_codes
    ]


def build_history_with_eligibility(student):

    history = {}

    placement_allows_replacement = replacement_allowed_for_student(student)

    for semester in SEMESTERS:

        data = dict(student["history"].get(semester, {}))

        data["can_replace"] = (
            can_replace(
                data.get("course_code"),
                data.get("erp_status"),
                data.get("current_status")
            )
            and placement_allows_replacement
        )

        # Older documents may not have this field yet; treat an
        # existing replacement without an explicit flag as locked.
        if "replacement_locked" not in data:
            data["replacement_locked"] = bool(data.get("replacement_code"))

        history[semester] = data

    return history


# ============================================================
# STUDENT DASHBOARD
# ============================================================

def get_student_dashboard(student_id):

    student = find_student(student_id)

    if not student:
        return None

    history = build_history_with_eligibility(student)

    available_courses = get_available_courses(student)

    replacement_needed = [
        semester
        for semester, data in history.items()
        if data["can_replace"]
    ]

    return {
        "student_id": student["student_id"],
        "student_name": student["student_name"],
        "placed": student["placed"],
        "required": student["required"],
        "total_registered": student["total_registered"],
        "gender": student["gender"],
        "current_4_1": student["current_4_1"],
        "registered_4_1": student["registered_4_1"],
        "current_4_2": student["current_4_2"],
        "must_change_password": student["must_change_password"],
        "history": history,
        "replacement_needed": replacement_needed,
        "available_courses": available_courses
    }


# ============================================================
# 4-1 REGISTRATION
# ============================================================

def register_4_1(student_id, course_code):

    student = find_student(student_id)

    if not student:
        return {"success": False, "message": "Student ID not found."}

    course_code = (course_code or "").strip()

    selected_course = courses_collection.find_one(
        {"code": course_code},
        {"_id": 0}
    )

    if not selected_course:
        return {
            "success": False,
            "message": "Invalid certification selected."
        }

    registered_codes = get_registered_codes(student)

    if course_code in registered_codes:
        return {
            "success": False,
            "message":
                "You have already registered for this certification."
        }

    if student.get("current_4_1"):
        return {
            "success": False,
            "message": "A 4-1 registration already exists."
        }

    value = f"{selected_course['code']}-{selected_course['title']}"

    students_collection.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "current_4_1": value,
                "registered_4_1": True
            }
        }
    )

    return {
        "success": True,
        "message": "4-1 registration successful.",
        "course": selected_course
    }


# ============================================================
# 4-2 REGISTRATION
# ============================================================

def register_4_2(student_id, course_code):

    student = find_student(student_id)

    if not student:
        return {"success": False, "message": "Student ID not found."}

    course_code = (course_code or "").strip()

    selected_course = courses_collection.find_one(
        {"code": course_code},
        {"_id": 0}
    )

    if not selected_course:
        return {
            "success": False,
            "message": "Invalid certification selected."
        }

    registered_codes = get_registered_codes(student)

    if course_code in registered_codes:
        return {
            "success": False,
            "message":
                "You have already registered for this certification."
        }

    if student.get("current_4_2"):
        return {
            "success": False,
            "message": "A 4-2 registration already exists."
        }

    value = f"{selected_course['code']}-{selected_course['title']}"

    students_collection.update_one(
        {"student_id": student_id},
        {"$set": {"current_4_2": value}}
    )

    return {
        "success": True,
        "message": "4-2 registration successful.",
        "course": selected_course
    }


# ============================================================
# REPLACE CERTIFICATION
# ============================================================

def replace_certification(student_id, semester, new_course_code):

    if semester not in SEMESTERS:
        return {"success": False, "message": "Invalid semester."}

    student = find_student(student_id)

    if not student:
        return {"success": False, "message": "Student ID not found."}

    new_course_code = (new_course_code or "").strip()

    selected_course = courses_collection.find_one(
        {"code": new_course_code},
        {"_id": 0}
    )

    if not selected_course:
        return {
            "success": False,
            "message": "Invalid certification selected."
        }

    registered_codes = get_registered_codes(student)

    if new_course_code in registered_codes:
        return {
            "success": False,
            "message":
                "This certification was already "
                "registered by this student."
        }

    semester_data = student["history"].get(semester, {})

    if not can_replace(
        semester_data.get("course_code"),
        semester_data.get("erp_status"),
        semester_data.get("current_status")
    ):
        return {
            "success": False,
            "message":
                "This certification is not eligible for replacement."
        }

    if not replacement_allowed_for_student(student):
        return {
            "success": False,
            "message":
                "Replacement certification is currently restricted to "
                "placed students."
        }

    is_locked = semester_data.get(
        "replacement_locked",
        bool(semester_data.get("replacement_code"))
    )

    if is_locked:
        return {
            "success": False,
            "message":
                "A replacement has already been registered for this "
                "semester and is locked. Ask an admin to unlock it "
                "if you need to change it."
        }

    students_collection.update_one(
        {"student_id": student_id},
        {
            "$set": {
                f"history.{semester}.replacement_code":
                    selected_course["code"],
                f"history.{semester}.replacement_name":
                    selected_course["title"],
                f"history.{semester}.replacement_locked": True
            }
        }
    )

    return {
        "success": True,
        "message":
            f"{semester} certification "
            "replacement submitted successfully.",
        "semester": semester,
        "course": selected_course
    }


# ============================================================
# AUTH HELPERS
# ============================================================

def authenticate_student(student_id, password):

    student = students_collection.find_one({"student_id": student_id})

    if not student:
        return None

    if not student.get("password_hash"):
        return None

    from auth import verify_password

    if not verify_password(password, student["password_hash"]):
        return None

    return student


def change_student_password(student_id, new_password):

    students_collection.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "password_hash": hash_password(new_password),
                "must_change_password": False
            }
        }
    )


def authenticate_admin(username, password):

    from auth import verify_password

    admin = admins_collection.find_one({"username": username})

    if not admin:
        return None

    if not verify_password(password, admin["password_hash"]):
        return None

    return admin


# ============================================================
# ADMIN: REPLACEMENT LOCK
# ============================================================

def unlock_replacement(student_id, semester):

    if semester not in SEMESTERS:
        return {"success": False, "message": "Invalid semester."}

    result = students_collection.update_one(
        {"student_id": student_id},
        {"$set": {f"history.{semester}.replacement_locked": False}}
    )

    if result.matched_count == 0:
        return {"success": False, "message": "Student ID not found."}

    return {
        "success": True,
        "message":
            f"{semester} replacement unlocked. The student can now "
            "submit a new replacement."
    }


def lock_replacement(student_id, semester):

    if semester not in SEMESTERS:
        return {"success": False, "message": "Invalid semester."}

    result = students_collection.update_one(
        {"student_id": student_id},
        {"$set": {f"history.{semester}.replacement_locked": True}}
    )

    if result.matched_count == 0:
        return {"success": False, "message": "Student ID not found."}

    return {"success": True, "message": f"{semester} replacement locked."}


# ============================================================
# ADMIN: STUDENT CRUD
# ============================================================

def empty_semester_entry():
    return {
        "course_code": "",
        "course_name": "",
        "erp_status": "",
        "current_status": "",
        "replacement_code": "",
        "replacement_name": "",
        "replacement_locked": False
    }


def list_students(search="", page=1, page_size=25):

    query = {}

    search = (search or "").strip()

    if search:
        query = {
            "$or": [
                {"student_id": {"$regex": search, "$options": "i"}},
                {"student_name": {"$regex": search, "$options": "i"}}
            ]
        }

    total = students_collection.count_documents(query)

    page = max(page, 1)
    page_size = max(min(page_size, 100), 1)

    cursor = (
        students_collection
        .find(
            query,
            {
                "_id": 0,
                "student_id": 1,
                "student_name": 1,
                "placed": 1,
                "gender": 1,
                "current_4_1": 1,
                "current_4_2": 1,
                "required": 1,
                "total_registered": 1
            }
        )
        .sort("student_id", 1)
        .skip((page - 1) * page_size)
        .limit(page_size)
    )

    return {
        "students": list(cursor),
        "total": total,
        "page": page,
        "page_size": page_size
    }


def get_student_admin(student_id):
    return get_student_dashboard(student_id)


def create_student(student_id, student_name, extra_fields=None):

    student_id = (student_id or "").strip()
    student_name = (student_name or "").strip()

    if not student_id or not student_name:
        return {
            "success": False,
            "message": "Student ID and name are required."
        }

    if students_collection.find_one({"student_id": student_id}):
        return {
            "success": False,
            "message": "A student with this ID already exists."
        }

    document = {
        "student_id": student_id,
        "student_name": student_name,
        "placed": "",
        "required": None,
        "total_registered": None,
        "gender": "",
        "current_4_1": "",
        "registered_4_1": False,
        "current_4_2": "",
        "history": {
            semester: empty_semester_entry()
            for semester in SEMESTERS
        },
        "password_hash": hash_password(student_id),
        "must_change_password": True
    }

    if extra_fields:
        document.update(extra_fields)

    students_collection.insert_one(document)

    return {"success": True, "message": "Student created."}


STUDENT_EDITABLE_FIELDS = {
    "student_name",
    "placed",
    "required",
    "total_registered",
    "gender",
    "current_4_1",
    "registered_4_1",
    "current_4_2"
}

SEMESTER_EDITABLE_FIELDS = {
    "course_code",
    "course_name",
    "erp_status",
    "current_status",
    "replacement_code",
    "replacement_name",
    "replacement_locked"
}


def update_student(student_id, fields, history_updates=None):

    student = students_collection.find_one({"student_id": student_id})

    if not student:
        return {"success": False, "message": "Student ID not found."}

    updates = {}

    for key, value in (fields or {}).items():
        if key in STUDENT_EDITABLE_FIELDS:
            updates[key] = value

    for semester, semester_fields in (history_updates or {}).items():

        if semester not in SEMESTERS:
            continue

        for key, value in (semester_fields or {}).items():
            if key in SEMESTER_EDITABLE_FIELDS:
                updates[f"history.{semester}.{key}"] = value

    if not updates:
        return {"success": False, "message": "No valid fields to update."}

    students_collection.update_one(
        {"student_id": student_id},
        {"$set": updates}
    )

    return {"success": True, "message": "Student updated."}


def delete_student(student_id):

    result = students_collection.delete_one({"student_id": student_id})

    if result.deleted_count == 0:
        return {"success": False, "message": "Student ID not found."}

    return {"success": True, "message": "Student deleted."}


def reset_student_password(student_id):

    result = students_collection.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "password_hash": hash_password(student_id),
                "must_change_password": True
            }
        }
    )

    if result.matched_count == 0:
        return {"success": False, "message": "Student ID not found."}

    return {
        "success": True,
        "message":
            "Password reset to the student's ID. They will be asked "
            "to set a new password on next login."
    }
