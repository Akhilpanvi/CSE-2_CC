import { useEffect, useState } from "react";

import { createAdmin, deleteAdmin, listAdmins } from "../../api";
import { useAuth } from "../../useAuth";

function AdminsPanel() {

  const { auth } = useAuth();

  const [admins, setAdmins] = useState([]);
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminMessage, setAdminMessage] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);


  async function refreshAdmins() {

    try {
      const data = await listAdmins();
      setAdmins(data);
    } catch (err) {
      setAdminError(
        err.response?.data?.detail || "Could not load admins."
      );
    }
  }


  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    refreshAdmins();
  }, []);


  async function handleCreateAdmin(e) {

    e.preventDefault();

    setAdminError("");
    setAdminMessage("");

    if (!newUsername.trim() || newPassword.length < 8) {
      setAdminError(
        "Username is required and password must be at least 8 characters."
      );
      return;
    }

    setAdminLoading(true);

    try {

      const result = await createAdmin(newUsername.trim(), newPassword);

      setAdminMessage(result.message);
      setNewUsername("");
      setNewPassword("");

      await refreshAdmins();

    } catch (err) {

      setAdminError(
        err.response?.data?.detail || "Could not create admin."
      );

    } finally {
      setAdminLoading(false);
    }
  }


  async function handleDeleteAdmin(username) {

    setAdminError("");
    setAdminMessage("");

    try {

      const result = await deleteAdmin(username);

      setAdminMessage(result.message);

      await refreshAdmins();

    } catch (err) {

      setAdminError(
        err.response?.data?.detail || "Could not remove admin."
      );
    }
  }


  return (

    <section className="card">

      <div className="section-title">
        <h2>Manage Admin Accounts</h2>
        <p>Create or remove administrator logins.</p>
      </div>

      <form onSubmit={handleCreateAdmin} className="inline-form">

        <div className="form-field">
          <label>Username</label>
          <input
            type="text"
            value={newUsername}
            onChange={(e) => setNewUsername(e.target.value)}
            placeholder="New admin username"
          />
        </div>

        <div className="form-field">
          <label>Password</label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
          />
        </div>

        <button type="submit" disabled={adminLoading}>
          {adminLoading ? "Creating..." : "Create Admin"}
        </button>

      </form>

      {adminError && <div className="alert error">{adminError}</div>}

      {adminMessage && (
        <div className="alert success">{adminMessage}</div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Created By</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {admins.map((admin) => (
            <tr key={admin.username}>
              <td>{admin.username}</td>
              <td>{admin.created_by || "—"}</td>
              <td>
                <button
                  className="danger-button"
                  disabled={admin.username === auth?.id}
                  onClick={() => handleDeleteAdmin(admin.username)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

    </section>
  );
}

export default AdminsPanel;
