import React, { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";

// ------------------ PrivateRoute for both Admin and Employee ------------------
const PrivateRoute = ({ children, role }) => {
  // role can be "admin" or "employee"
  if (role === "admin") {
    const isAdminLoggedIn = localStorage.getItem("adminLoggedIn");
    return isAdminLoggedIn ? children : <Navigate to="/admin/login" />;
  } else if (role === "employee") {
    const token = localStorage.getItem("token");
    // ✅ Just check that Base64 token exists and is a string
    if (!token || typeof token !== "string" || token.trim() === "") {
      return <Navigate to="/employee/login" />;
    }
    return children;
  } else {
    // fallback
    return <Navigate to="/" />;
  }
};

export default PrivateRoute;

// ------------------ Admin Login Component ------------------
const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("http://localhost:8077/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json(); // assuming backend returns JSON { message, token, role, name }

      if (data.message === "Login successful") {
        // store token as string for admin
        localStorage.setItem("adminLoggedIn", "true");
        if (data.token) localStorage.setItem("token", data.token);
        if (data.name) localStorage.setItem("name", data.name);
        if (data.role) localStorage.setItem("role", data.role.toLowerCase());

        navigate("/admin/dashboard");
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Login failed. Please try again later.");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
        required
      />
      <button type="submit">Login</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
    </form>
  );
};

export { Login };
