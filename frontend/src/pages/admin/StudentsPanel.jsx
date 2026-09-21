import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import {
  adminCreateStudent,
  adminDeleteStudent,
  adminListStudents
} from "../../api";

const PAGE_SIZE = 20;

function StudentsPanel() {

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [searchVersion, setSearchVersion] = useState(0);
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [showCreate, setShowCreate] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [createError, setCreateError] = useState("");
  const [createLoading, setCreateLoading] = useState(false);


  async function loadStudents() {

    setLoading(true);
    setError("");

    try {

      const data = await adminListStudents(search, page, PAGE_SIZE);

      setStudents(data.students);
      setTotal(data.total);

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not load students."
      );

    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on page/search change
    loadStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, searchVersion]);


  function handleSearchSubmit(e) {
    e.preventDefault();

    if (page === 1) {
      setSearchVersion((v) => v + 1);
    } else {
      setPage(1);
    }
  }


  async function handleCreate(e) {

    e.preventDefault();

    setCreateError("");

    if (!newId.trim() || !newName.trim()) {
      setCreateError("Student ID and name are required.");
      return;
    }

    setCreateLoading(true);

    try {

      await adminCreateStudent(newId.trim(), newName.trim());

      setNewId("");
      setNewName("");
      setShowCreate(false);

      await loadStudents();

    } catch (err) {

      setCreateError(
        err.response?.data?.detail || "Could not create student."
      );

    } finally {
      setCreateLoading(false);
    }
  }


  async function handleDelete(studentId) {

    setError("");

    try {

      await adminDeleteStudent(studentId);

      await loadStudents();

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not delete student."
      );
    }
  }


  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);


  return (

    <section className="card">

      <div className="section-title">
        <h2>Students</h2>
        <p>Search, view, edit, or remove student records.</p>
      </div>

      <form onSubmit={handleSearchSubmit} className="inline-form">

        <div className="form-field">
          <label>Search</label>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by Student ID or Name"
          />
        </div>

        <button type="submit" disabled={loading}>
          Search
        </button>

        <button
          type="button"
          onClick={() => setShowCreate((prev) => !prev)}
        >
          {showCreate ? "Cancel" : "Add Student"}
        </button>

      </form>

      {showCreate && (

        <form onSubmit={handleCreate} className="inline-form create-form">

          <div className="form-field">
            <label>Student ID</label>
            <input
              type="text"
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="New Student ID"
            />
          </div>

          <div className="form-field">
            <label>Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Student Name"
            />
          </div>

          <button type="submit" disabled={createLoading}>
            {createLoading ? "Creating..." : "Create"}
          </button>

        </form>
      )}

      {createError && <div className="alert error">{createError}</div>}

      {error && <div className="alert error">{error}</div>}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Student ID</th>
            <th>Name</th>
            <th>Placed</th>
            <th>4-1</th>
            <th>4-2</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.student_id}>
              <td>{student.student_id}</td>
              <td>{student.student_name}</td>
              <td>{student.placed || "—"}</td>
              <td>{student.current_4_1 ? "Yes" : "No"}</td>
              <td>{student.current_4_2 ? "Yes" : "No"}</td>
              <td className="table-actions">
                <Link to={`/admin/students/${student.student_id}`}>
                  Edit
                </Link>
                <button
                  className="danger-button"
                  onClick={() => handleDelete(student.student_id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {!loading && students.length === 0 && (
        <div className="no-courses">No students found.</div>
      )}

      <div className="pagination">

        <button
          type="button"
          disabled={page <= 1 || loading}
          onClick={() => setPage((p) => p - 1)}
        >
          Previous
        </button>

        <span>Page {page} of {totalPages} ({total} students)</span>

        <button
          type="button"
          disabled={page >= totalPages || loading}
          onClick={() => setPage((p) => p + 1)}
        >
          Next
        </button>

      </div>

    </section>
  );
}

export default StudentsPanel;
