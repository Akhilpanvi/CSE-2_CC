import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import Logo from "../../Logo";
import {
  adminDeleteStudent,
  adminGetStudent,
  adminLockReplacement,
  adminResetPassword,
  adminUnlockReplacement,
  adminUpdateStudent
} from "../../api";

const SEMESTERS = ["2-1", "2-2", "3-1", "3-2"];

const SEMESTER_FIELDS = [
  ["course_code", "Course Code"],
  ["course_name", "Course Name"],
  ["erp_status", "ERP Status"],
  ["current_status", "Current Status"],
  ["replacement_code", "Replacement Code"],
  ["replacement_name", "Replacement Name"]
];

function StudentEditor() {

  const { studentId } = useParams();
  const navigate = useNavigate();

  const [student, setStudent] = useState(null);
  const [form, setForm] = useState(null);
  const [history, setHistory] = useState(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");


  async function loadStudent() {

    setLoading(true);
    setError("");

    try {

      const data = await adminGetStudent(studentId);

      setStudent(data);

      setForm({
        student_name: data.student_name || "",
        placed: data.placed || "",
        required: data.required ?? "",
        total_registered: data.total_registered ?? "",
        gender: data.gender || "",
        current_4_1: data.current_4_1 || "",
        registered_4_1: Boolean(data.registered_4_1),
        current_4_2: data.current_4_2 || ""
      });

      setHistory(data.history);

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not load student."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    loadStudent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);


  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }


  function updateSemesterField(semester, key, value) {
    setHistory((prev) => ({
      ...prev,
      [semester]: { ...prev[semester], [key]: value }
    }));
  }


  async function handleSave(e) {

    e.preventDefault();

    setSaving(true);
    setError("");
    setMessage("");

    const historyPayload = {};

    for (const semester of SEMESTERS) {

      const data = history[semester];

      historyPayload[semester] = {
        course_code: data.course_code || "",
        course_name: data.course_name || "",
        erp_status: data.erp_status || "",
        current_status: data.current_status || "",
        replacement_code: data.replacement_code || "",
        replacement_name: data.replacement_name || ""
      };
    }

    try {

      await adminUpdateStudent(
        studentId,
        {
          ...form,
          required:
            form.required === "" ? null : Number(form.required),
          total_registered:
            form.total_registered === ""
              ? null
              : Number(form.total_registered)
        },
        historyPayload
      );

      setMessage("Student updated.");

      await loadStudent();

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not update student."
      );

    } finally {
      setSaving(false);
    }
  }


  async function handleToggleLock(semester, locked) {

    setError("");
    setMessage("");

    try {

      const action = locked ? adminUnlockReplacement : adminLockReplacement;

      const result = await action(studentId, semester);

      setMessage(result.message);

      await loadStudent();

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not update lock state."
      );
    }
  }


  async function handleResetPassword() {

    setError("");
    setMessage("");

    try {

      const result = await adminResetPassword(studentId);

      setMessage(result.message);

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not reset password."
      );
    }
  }


  async function handleDelete() {

    setError("");

    try {

      await adminDeleteStudent(studentId);

      navigate("/admin");

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not delete student."
      );
    }
  }


  if (loading) {
    return (
      <div className="app">
        <main className="container">
          <div className="card">Loading student...</div>
        </main>
      </div>
    );
  }

  if (!student || !form || !history) {
    return (
      <div className="app">
        <main className="container">
          {error && <div className="alert error">{error}</div>}
        </main>
      </div>
    );
  }

  return (

    <div className="app">

      <header className="header">
        <div className="header-content admin-header-content">
          <div>
            <Logo />
            <h1>Edit Student</h1>
            <p>{studentId}</p>
          </div>
          <button onClick={() => navigate("/admin")}>
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="container">

        {error && <div className="alert error">{error}</div>}
        {message && <div className="alert success">{message}</div>}

        <form onSubmit={handleSave}>

          <section className="card">

            <div className="section-title">
              <h2>Student Details</h2>
            </div>

            <div className="editor-grid">

              <div className="form-field">
                <label>Name</label>
                <input
                  type="text"
                  value={form.student_name}
                  onChange={(e) =>
                    updateField("student_name", e.target.value)
                  }
                />
              </div>

              <div className="form-field">

                <label>Placed</label>

                {/* Radio, not free text: the placed-only replacement gate
                    matches "placed" exactly, so a typo would silently
                    lock a student out. */}
                <div className="radio-row">

                  <label
                    className={
                      `radio-option ${
                        form.placed === "PLACED" ? "active" : ""
                      }`
                    }
                  >
                    <input
                      type="radio"
                      name="placed"
                      checked={form.placed === "PLACED"}
                      onChange={() => updateField("placed", "PLACED")}
                    />
                    Placed
                  </label>

                  <label
                    className={
                      `radio-option ${
                        form.placed === "PLACED" ? "" : "active"
                      }`
                    }
                  >
                    <input
                      type="radio"
                      name="placed"
                      checked={form.placed !== "PLACED"}
                      onChange={() => updateField("placed", "Not Placed")}
                    />
                    Not Placed
                  </label>

                </div>

              </div>

              <div className="form-field">
                <label>Gender</label>
                <input
                  type="text"
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Required Certifications</label>
                <input
                  type="number"
                  value={form.required}
                  onChange={(e) => updateField("required", e.target.value)}
                />
              </div>

              <div className="form-field">
                <label>Total Registered</label>
                <input
                  type="number"
                  value={form.total_registered}
                  onChange={(e) =>
                    updateField("total_registered", e.target.value)
                  }
                />
              </div>

              <div className="form-field">
                <label>4-1 Registration</label>
                <input
                  type="text"
                  value={form.current_4_1}
                  onChange={(e) =>
                    updateField("current_4_1", e.target.value)
                  }
                />
              </div>

              <div className="form-field">
                <label>4-2 Registration</label>
                <input
                  type="text"
                  value={form.current_4_2}
                  onChange={(e) =>
                    updateField("current_4_2", e.target.value)
                  }
                />
              </div>

            </div>

          </section>

          {SEMESTERS.map((semester) => {

            const data = history[semester];

            return (

              <section className="card" key={semester}>

                <div className="section-title semester-editor-title">
                  <h2>{semester}</h2>

                  <button
                    type="button"
                    className={
                      data.replacement_locked
                        ? "danger-button"
                        : ""
                    }
                    onClick={() =>
                      handleToggleLock(semester, data.replacement_locked)
                    }
                  >
                    {data.replacement_locked
                      ? "🔒 Locked — Unlock"
                      : "🔓 Unlocked — Lock"}
                  </button>
                </div>

                <div className="editor-grid">

                  {SEMESTER_FIELDS.map(([key, label]) => (

                    <div className="form-field" key={key}>
                      <label>{label}</label>
                      <input
                        type="text"
                        value={data[key] || ""}
                        onChange={(e) =>
                          updateSemesterField(semester, key, e.target.value)
                        }
                      />
                    </div>
                  ))}

                </div>

              </section>
            );
          })}

          <section className="card editor-actions">

            <button type="submit" disabled={saving}>
              {saving ? "Saving..." : "Save Changes"}
            </button>

            <button
              type="button"
              onClick={handleResetPassword}
            >
              Reset Password to Student ID
            </button>

            <button
              type="button"
              className="danger-button"
              onClick={handleDelete}
            >
              Delete Student
            </button>

          </section>

        </form>

      </main>

    </div>
  );
}

export default StudentEditor;
