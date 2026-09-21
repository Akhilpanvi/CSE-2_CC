import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "../Logo";
import { adminLogin, studentLogin } from "../api";
import { useAuth } from "../useAuth";

function StudentLogin() {

  const navigate = useNavigate();
  const { login } = useAuth();

  const [studentId, setStudentId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(e) {

    e.preventDefault();

    if (!studentId.trim() || !password) {
      setError("Please enter your Student ID and password.");
      return;
    }

    setLoading(true);
    setError("");

    try {

      // ponytail: one form for both roles — the admin portal is not
      // advertised anywhere. Student first, admin only if that fails.
      let data;
      let isAdmin = false;

      try {
        data = await studentLogin(studentId.trim(), password);
      } catch {
        data = await adminLogin(studentId.trim(), password);
        isAdmin = true;
      }

      if (isAdmin) {

        login({
          token: data.access_token,
          role: "admin",
          id: data.username,
          name: data.username
        });

        navigate("/admin");

      } else {

        login({
          token: data.access_token,
          role: "student",
          id: data.student_id,
          name: data.student_name
        });

        navigate(
          data.must_change_password ? "/change-password" : "/dashboard"
        );
      }

    } catch {

      // Same message either way — never reveal which account type matched.
      setError("Invalid ID or password.");

    } finally {
      setLoading(false);
    }
  }


  return (

    <div className="app">

      <header className="header">
        <div className="header-content">
          <Logo />
          <h1>Skill Certification Registration</h1>
          <p>Student Certification Portal</p>
        </div>
      </header>

      <main className="container">

        <section className="card search-card auth-card">

          <h2>Student Login</h2>

          <p className="description">
            Log in with your Student ID. If this is your first time,
            your password is your Student ID.
          </p>

          <form onSubmit={handleSubmit}>

            <div className="form-field">
              <label>Student ID</label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="Enter Student ID"
              />
            </div>

            <div className="form-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter Password"
              />
            </div>

            {error && <div className="alert error">{error}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>

          </form>

        </section>

      </main>

      <footer>
        <p>Skill Certification Registration Portal</p>
      </footer>

    </div>
  );
}

export default StudentLogin;
