import { Navigate } from "react-router-dom";

import { useAuth } from "./useAuth";

function ProtectedRoute({ role, children }) {

  const { auth } = useAuth();

  if (!auth || auth.role !== role) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
