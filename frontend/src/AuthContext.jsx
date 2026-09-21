import { useState } from "react";

import { AuthContext } from "./authContext";


function readStoredAuth() {

  const token = localStorage.getItem("access_token");
  const role = localStorage.getItem("auth_role");
  const id = localStorage.getItem("auth_id");
  const name = localStorage.getItem("auth_name");

  if (!token || !role || !id) {
    return null;
  }

  return { token, role, id, name };
}


export function AuthProvider({ children }) {

  const [auth, setAuth] = useState(readStoredAuth());


  function login({ token, role, id, name }) {

    localStorage.setItem("access_token", token);
    localStorage.setItem("auth_role", role);
    localStorage.setItem("auth_id", id);
    localStorage.setItem("auth_name", name || "");

    setAuth({ token, role, id, name });
  }


  function logout() {

    localStorage.removeItem("access_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_id");
    localStorage.removeItem("auth_name");

    setAuth(null);
  }


  return (
    <AuthContext.Provider value={{ auth, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
