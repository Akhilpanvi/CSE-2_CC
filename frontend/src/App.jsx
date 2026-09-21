import { Route, Routes } from "react-router-dom";

import "./App.css";

import ProtectedRoute from "./ProtectedRoute";
import AdminDashboard from "./pages/AdminDashboard";
import ChangePassword from "./pages/ChangePassword";
import StudentDashboard from "./pages/StudentDashboard";
import StudentLogin from "./pages/StudentLogin";
import StudentEditor from "./pages/admin/StudentEditor";


function App() {

  return (

    <Routes>

      <Route path="/" element={<StudentLogin />} />

      <Route
        path="/change-password"
        element={
          <ProtectedRoute role="student">
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute role="student">
            <StudentDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute role="admin">
            <AdminDashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/students/:studentId"
        element={
          <ProtectedRoute role="admin">
            <StudentEditor />
          </ProtectedRoute>
        }
      />

    </Routes>
  );
}


export default App;
