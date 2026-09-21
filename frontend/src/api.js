
import axios from "axios";

export const API_URL =
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

const API = axios.create({ baseURL: API_URL });

API.interceptors.request.use((config) => {

  const token = localStorage.getItem("access_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});


// ==================================================
// STUDENT AUTH
// ==================================================

export async function studentLogin(studentId, password) {

  const response = await API.post(
    "/api/auth/student/login",
    { student_id: studentId, password }
  );

  return response.data;
}


export async function changeStudentPassword(newPassword) {

  const response = await API.post(
    "/api/auth/student/change-password",
    { new_password: newPassword }
  );

  return response.data;
}


// ==================================================
// ADMIN AUTH
// ==================================================

export async function adminLogin(username, password) {

  const response = await API.post(
    "/api/auth/admin/login",
    { username, password }
  );

  return response.data;
}


export async function changeAdminPassword(currentPassword, newPassword) {

  const response = await API.post(
    "/api/auth/admin/change-password",
    { current_password: currentPassword, new_password: newPassword }
  );

  return response.data;
}


export async function createAdmin(username, password) {

  const response = await API.post(
    "/api/auth/admin/create",
    { username, password }
  );

  return response.data;
}


export async function listAdmins() {

  const response = await API.get("/api/auth/admin/list");

  return response.data.admins;
}


export async function deleteAdmin(username) {

  const response = await API.delete(
    `/api/auth/admin/${encodeURIComponent(username)}`
  );

  return response.data;
}


export async function uploadExcel(file) {

  const formData = new FormData();
  formData.append("file", file);

  const response = await API.post(
    "/api/admin/upload-excel",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } }
  );

  return response.data;
}


// ==================================================
// GET STUDENT
// ==================================================

export async function getStudent(studentId) {

  const response = await API.get(
    `/api/student/${encodeURIComponent(studentId)}`
  );

  return response.data;
}


// ==================================================
// 4-1 REGISTRATION
// ==================================================

export async function registerCourse(
  studentId,
  courseCode
) {

  const response = await API.post(
    "/api/register",
    {
      student_id: studentId,
      course_code: courseCode
    }
  );

  return response.data;
}


// ==================================================
// REPLACEMENT
// ==================================================

export async function replaceCourse(
  studentId,
  semester,
  courseCode
) {

  const response = await API.post(
    "/api/replace",
    {
      student_id: studentId,
      semester: semester,
      course_code: courseCode
    }
  );

  return response.data;
}


// ==================================================
// ADMIN: SETTINGS
// ==================================================

export async function getStats() {

  const response = await API.get("/api/admin/stats");

  return response.data;
}


export async function downloadReport(scope) {

  const response = await API.get("/api/admin/report", {
    params: { scope },
    responseType: "blob"
  });

  // Blob download: the <a href> approach can't send the auth header.
  const url = URL.createObjectURL(response.data);
  const link = document.createElement("a");

  link.href = url;
  link.download =
    `Skill_Certification_Report_${
      scope === "placed" ? "Placed" : "All"
    }_Students.xlsx`;

  link.click();
  URL.revokeObjectURL(url);

  return Number(response.headers["x-student-count"]) || 0;
}


export async function getSettings() {

  const response = await API.get("/api/admin/settings");

  return response.data;
}


export async function updateSettings(replacementAccess) {

  const response = await API.put(
    "/api/admin/settings",
    { replacement_access: replacementAccess }
  );

  return response.data;
}


// ==================================================
// ADMIN: STUDENT CRUD
// ==================================================

export async function adminListStudents(search, page, pageSize) {

  const response = await API.get("/api/admin/students", {
    params: { search, page, page_size: pageSize }
  });

  return response.data;
}


export async function adminGetStudent(studentId) {

  const response = await API.get(
    `/api/admin/students/${encodeURIComponent(studentId)}`
  );

  return response.data;
}


export async function adminCreateStudent(studentId, studentName) {

  const response = await API.post(
    "/api/admin/students",
    { student_id: studentId, student_name: studentName }
  );

  return response.data;
}


export async function adminUpdateStudent(studentId, fields, history) {

  const payload = { ...fields };

  if (history) {
    payload.history = history;
  }

  const response = await API.put(
    `/api/admin/students/${encodeURIComponent(studentId)}`,
    payload
  );

  return response.data;
}


export async function adminDeleteStudent(studentId) {

  const response = await API.delete(
    `/api/admin/students/${encodeURIComponent(studentId)}`
  );

  return response.data;
}


export async function adminUnlockReplacement(studentId, semester) {

  const response = await API.post(
    `/api/admin/students/${encodeURIComponent(studentId)}`
    + `/unlock/${encodeURIComponent(semester)}`
  );

  return response.data;
}


export async function adminLockReplacement(studentId, semester) {

  const response = await API.post(
    `/api/admin/students/${encodeURIComponent(studentId)}`
    + `/lock/${encodeURIComponent(semester)}`
  );

  return response.data;
}


export async function adminResetPassword(studentId) {

  const response = await API.post(
    `/api/admin/students/${encodeURIComponent(studentId)}/reset-password`
  );

  return response.data;
}
