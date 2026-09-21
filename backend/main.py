from pathlib import Path
from typing import Any, Optional

from fastapi import Depends, FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from pydantic import BaseModel

import student_service
from auth import (
    create_access_token,
    get_current_admin,
    get_current_principal,
    hash_password,
    require_self_or_admin
)
from db import admins_collection
from excel_export import build_report
from excel_import import import_workbook

app = FastAPI(
    title="Skill Certification Registration",
    version="3.0.0"
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
    # Custom headers are invisible to JS unless explicitly exposed.
    expose_headers=["X-Student-Count"]
)


# ============================================================
# REQUEST MODELS
# ============================================================

class RegistrationRequest(BaseModel):
    student_id: str
    course_code: str


class ReplacementRequest(BaseModel):
    student_id: str
    semester: str
    course_code: str


class StudentLoginRequest(BaseModel):
    student_id: str
    password: str


class ChangePasswordRequest(BaseModel):
    new_password: str


class AdminLoginRequest(BaseModel):
    username: str
    password: str


class AdminCreateRequest(BaseModel):
    username: str
    password: str


class StudentCreateRequest(BaseModel):
    student_id: str
    student_name: str


class SettingsUpdateRequest(BaseModel):
    replacement_access: str


class StudentUpdateRequest(BaseModel):
    student_name: Optional[str] = None
    placed: Optional[str] = None
    required: Optional[int] = None
    total_registered: Optional[int] = None
    gender: Optional[str] = None
    current_4_1: Optional[str] = None
    registered_4_1: Optional[bool] = None
    current_4_2: Optional[str] = None
    history: Optional[dict[str, dict[str, Any]]] = None


# ============================================================
# ROOT
# ============================================================

@app.get("/api/sample-excel")
def sample_excel():
    return FileResponse(
        Path(__file__).parent / "sample_upload_format.xlsx",
        media_type=(
            "application/vnd.openxmlformats-officedocument"
            ".spreadsheetml.sheet"
        ),
        filename="sample_upload_format.xlsx"
    )


@app.get("/")
def root():
    return {
        "status": "success",
        "message": "Skill Certification API is running"
    }


# ============================================================
# STUDENT AUTH
# ============================================================

@app.post("/api/auth/student/login")
def student_login(request: StudentLoginRequest):

    student = student_service.authenticate_student(
        request.student_id.strip(),
        request.password
    )

    if not student:
        raise HTTPException(
            status_code=401,
            detail="Invalid student ID or password."
        )

    token = create_access_token(student["student_id"], "student")

    return {
        "access_token": token,
        "token_type": "bearer",
        "student_id": student["student_id"],
        "student_name": student["student_name"],
        "must_change_password": student.get("must_change_password", False)
    }


@app.post("/api/auth/student/change-password")
def student_change_password(
    request: ChangePasswordRequest,
    principal: dict = Depends(get_current_principal)
):

    if principal["role"] != "student":
        raise HTTPException(
            status_code=403,
            detail="Student access required."
        )

    # ponytail: no length/complexity policy by request — only reject empty,
    # since a blank password would let anyone straight in.
    if not request.new_password:
        raise HTTPException(
            status_code=400,
            detail="Password cannot be empty."
        )

    student_service.change_student_password(
        principal["id"],
        request.new_password
    )

    return {"success": True, "message": "Password updated."}


# ============================================================
# ADMIN AUTH
# ============================================================

@app.post("/api/auth/admin/login")
def admin_login(request: AdminLoginRequest):

    admin = student_service.authenticate_admin(
        request.username.strip(),
        request.password
    )

    if not admin:
        raise HTTPException(
            status_code=401,
            detail="Invalid admin username or password."
        )

    token = create_access_token(admin["username"], "admin")

    return {
        "access_token": token,
        "token_type": "bearer",
        "username": admin["username"]
    }


@app.post("/api/auth/admin/create")
def admin_create(
    request: AdminCreateRequest,
    current_admin: str = Depends(get_current_admin)
):

    username = request.username.strip()

    if len(request.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    if admins_collection.find_one({"username": username}):
        raise HTTPException(
            status_code=400,
            detail="An admin with this username already exists."
        )

    admins_collection.insert_one({
        "username": username,
        "password_hash": hash_password(request.password),
        "created_by": current_admin
    })

    return {"success": True, "message": f"Admin '{username}' created."}


@app.get("/api/auth/admin/list")
def admin_list(current_admin: str = Depends(get_current_admin)):

    admins = list(
        admins_collection.find({}, {"_id": 0, "password_hash": 0})
    )

    return {"admins": admins}


@app.delete("/api/auth/admin/{username}")
def admin_delete(
    username: str,
    current_admin: str = Depends(get_current_admin)
):

    if username == current_admin:
        raise HTTPException(
            status_code=400,
            detail="You cannot delete your own account."
        )

    result = admins_collection.delete_one({"username": username})

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Admin not found."
        )

    return {"success": True, "message": f"Admin '{username}' removed."}


# ============================================================
# ADMIN: EXCEL UPLOAD
# ============================================================

@app.post("/api/admin/upload-excel")
def upload_excel(
    file: UploadFile = File(...),
    current_admin: str = Depends(get_current_admin)
):

    if not file.filename.lower().endswith((".xlsx", ".xlsm")):
        raise HTTPException(
            status_code=400,
            detail="Only .xlsx files are accepted."
        )

    try:
        result = import_workbook(file.file)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Could not process workbook: {exc}"
        )

    return {
        "success": True,
        "message": "Workbook imported successfully.",
        **result
    }


@app.get("/api/admin/report")
def admin_report(
    scope: str = "all",
    current_admin: str = Depends(get_current_admin)
):

    if scope not in ("all", "placed"):
        raise HTTPException(
            status_code=400,
            detail="Scope must be 'all' or 'placed'."
        )

    buffer, count = build_report(scope)

    filename = (
        "Skill_Certification_Report_"
        f"{'Placed' if scope == 'placed' else 'All'}_Students.xlsx"
    )

    return StreamingResponse(
        buffer,
        media_type=(
            "application/vnd.openxmlformats-officedocument"
            ".spreadsheetml.sheet"
        ),
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "X-Student-Count": str(count)
        }
    )


# ============================================================
# ADMIN: SETTINGS
# ============================================================

@app.get("/api/admin/settings")
def admin_get_settings(current_admin: str = Depends(get_current_admin)):
    return student_service.get_settings()


@app.put("/api/admin/settings")
def admin_update_settings(
    request: SettingsUpdateRequest,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.set_replacement_access(
        request.replacement_access
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


# ============================================================
# ADMIN: STUDENT CRUD
# ============================================================

@app.get("/api/admin/students")
def admin_list_students(
    search: str = "",
    page: int = 1,
    page_size: int = 25,
    current_admin: str = Depends(get_current_admin)
):
    return student_service.list_students(search, page, page_size)


@app.get("/api/admin/students/{student_id}")
def admin_get_student(
    student_id: str,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.get_student_admin(student_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Student ID not found."
        )

    return result


@app.post("/api/admin/students")
def admin_create_student(
    request: StudentCreateRequest,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.create_student(
        request.student_id,
        request.student_name
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.put("/api/admin/students/{student_id}")
def admin_update_student(
    student_id: str,
    request: StudentUpdateRequest,
    current_admin: str = Depends(get_current_admin)
):

    payload = request.model_dump(exclude_unset=True)
    history_updates = payload.pop("history", None)

    result = student_service.update_student(
        student_id,
        payload,
        history_updates
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.delete("/api/admin/students/{student_id}")
def admin_delete_student(
    student_id: str,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.delete_student(student_id)

    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])

    return result


@app.post("/api/admin/students/{student_id}/unlock/{semester}")
def admin_unlock_replacement(
    student_id: str,
    semester: str,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.unlock_replacement(student_id, semester)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.post("/api/admin/students/{student_id}/lock/{semester}")
def admin_lock_replacement(
    student_id: str,
    semester: str,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.lock_replacement(student_id, semester)

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.post("/api/admin/students/{student_id}/reset-password")
def admin_reset_student_password(
    student_id: str,
    current_admin: str = Depends(get_current_admin)
):

    result = student_service.reset_student_password(student_id)

    if not result["success"]:
        raise HTTPException(status_code=404, detail=result["message"])

    return result


# ============================================================
# STUDENT DATA
# ============================================================

@app.get("/api/student/{student_id}")
def student_details(
    student_id: str,
    principal: dict = Depends(get_current_principal)
):

    require_self_or_admin(student_id, principal)

    result = student_service.get_student_dashboard(student_id)

    if not result:
        raise HTTPException(
            status_code=404,
            detail="Student ID not found."
        )

    return result


@app.post("/api/register")
def register(
    request: RegistrationRequest,
    principal: dict = Depends(get_current_principal)
):

    require_self_or_admin(request.student_id, principal)

    result = student_service.register_4_1(
        request.student_id,
        request.course_code
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result


@app.post("/api/replace")
def replace(
    request: ReplacementRequest,
    principal: dict = Depends(get_current_principal)
):

    require_self_or_admin(request.student_id, principal)

    result = student_service.replace_certification(
        request.student_id,
        request.semester,
        request.course_code
    )

    if not result["success"]:
        raise HTTPException(status_code=400, detail=result["message"])

    return result
