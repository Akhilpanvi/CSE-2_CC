import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

import Logo from "../Logo";
import { changeStudentPassword } from "../api";

function ChangePassword() {

  const navigate = useNavigate();
  const voluntary = Boolean(useLocation().state?.voluntary);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  async function handleSubmit(e) {

    e.preventDefault();

    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    setError("");

    try {

      await changeStudentPassword(newPassword);

      navigate("/dashboard");

    } catch (err) {

      setError(
        err.response?.data?.detail || "Could not update password."
      );

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

          <h2>Set a New Password</h2>

          <p className="description">
            {voluntary
              ? "Choose a new password for your account."
              : "For security, please set a new password before continuing."}
          </p>

          <form onSubmit={handleSubmit}>

            <div className="form-field">
              <label>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
              />
            </div>

            <div className="form-field">
              <label>Confirm Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
              />
            </div>

            {error && <div className="alert error">{error}</div>}

            <div className="editor-actions">

              <button type="submit" disabled={loading}>
                {loading ? "Saving..." : "Save Password"}
              </button>

              {/* ponytail: no cancel on the forced first-login reset */}
              {voluntary && (
                <button
                  type="button"
                  className="tab-button"
                  onClick={() => navigate("/dashboard")}
                >
                  Cancel
                </button>
              )}

            </div>

          </form>

        </section>

      </main>

      <footer>
        <p>Skill Certification Registration Portal</p>
      </footer>

    </div>
  );
}

export default ChangePassword;
