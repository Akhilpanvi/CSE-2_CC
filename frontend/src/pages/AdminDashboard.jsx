import { useState } from "react";
import { useNavigate } from "react-router-dom";

import Logo from "../Logo";
import AdminsPanel from "./admin/AdminsPanel";
import SettingsPanel from "./admin/SettingsPanel";
import StudentsPanel from "./admin/StudentsPanel";
import UploadPanel from "./admin/UploadPanel";
import { useAuth } from "../useAuth";

const TABS = [
  { key: "students", label: "Students" },
  { key: "settings", label: "Settings" },
  { key: "upload", label: "Data & Reports" },
  { key: "admins", label: "Admin Accounts" }
];

function AdminDashboard() {

  const navigate = useNavigate();
  const { auth, logout } = useAuth();

  const [activeTab, setActiveTab] = useState("students");


  function handleLogout() {
    logout();
    navigate("/");
  }


  return (

    <div className="app">

      <header className="header">
        <div className="header-content admin-header-content">
          <div>
            <Logo />
            <h1>Skill Certification Registration</h1>
            <p>Administrator Portal &mdash; {auth?.name}</p>
          </div>
          <button className="logout-button" onClick={handleLogout}>
            Log Out
          </button>
        </div>
      </header>

      <main className="container">

        <div className="tab-row">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={
                `tab-button ${activeTab === tab.key ? "active" : ""}`
              }
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "students" && <StudentsPanel />}
        {activeTab === "settings" && <SettingsPanel />}
        {activeTab === "upload" && <UploadPanel />}
        {activeTab === "admins" && <AdminsPanel />}

      </main>

      <footer>
        <p>Skill Certification Registration Portal</p>
      </footer>

    </div>
  );
}

export default AdminDashboard;
