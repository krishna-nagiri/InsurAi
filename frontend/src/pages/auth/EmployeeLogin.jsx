import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import axios from "axios";

export default function EmployeeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorEmail, setErrorEmail] = useState("");
  const [errorPassword, setErrorPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // 🎨 Light Blue Theme Colors
  const colors = {
    bg: "#e0f2fe",       // Light Blue background
    primary: "#0ea5e9",  // Blue accent (buttons, highlights)
    softBlue: "#bae6fd", // Softer blue for borders/gradients
    black: "#000000",
    white: "#ffffff",
    textGray: "#64748b"
  };

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z]{2,})+$/;
    return re.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorEmail("");
    setErrorPassword("");

    if (!validateEmail(email)) {
      setErrorEmail("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await axios.post("http://localhost:8077/auth/login", {
        email: email.trim().toLowerCase(),
        password,
      });

      const data = res.data;
      if (!data || !data.token) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role?.toLowerCase() || "employee");
      localStorage.setItem("name", data.name || "");
      localStorage.setItem("employeeId", data.employeeId || "");
      localStorage.setItem("id", data.id || "");

      navigate("/employee/dashboard", { replace: true });
    } catch (err) {
      if (err.response?.status === 404) {
        setErrorEmail("User not found.");
      } else if (err.response?.status === 401) {
        setErrorPassword("Incorrect password.");
      } else {
        setErrorPassword("Login failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center"
      style={{
        minHeight: "100vh",
        width: "100vw",
        backgroundColor: colors.bg,
      }}
    >
      <div
        className="card border-0 shadow-lg"
        style={{
          width: "420px",
          borderRadius: "30px",
          backgroundColor: colors.white,
          overflow: "hidden"
        }}
      >
        {/* Header with Light Blue Gradient */}
        <div
          style={{
            background: `linear-gradient(135deg, ${colors.softBlue}, ${colors.bg})`,
            padding: "40px 30px",
            textAlign: "center",
            borderBottom: `1px solid ${colors.softBlue}`
          }}
        >
          <div
            className="d-inline-flex p-3 rounded-circle mb-3"
            style={{
              background: colors.white,
              boxShadow: "0 4px 10px rgba(0,0,0,0.05)"
            }}
          >
            <span style={{ fontSize: "2rem" }}>👤</span>
          </div>
          <h3 className="fw-bold mb-1" style={{ color: colors.black }}>
            Employee Portal
          </h3>
          <p
            style={{
              color: colors.primary,
              fontSize: "0.8rem",
              fontWeight: "700",
              letterSpacing: "1px",
              textTransform: "uppercase"
            }}
          >
            InsurAI Global Network
          </p>
        </div>

        {/* Body */}
        <div className="card-body p-4 p-md-5">
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label
                className="form-label fw-bold"
                style={{ color: colors.black, fontSize: "0.9rem" }}
              >
                Email Address
              </label>
              <input
                type="email"
                className="form-control shadow-none"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.softBlue}`,
                  padding: "14px",
                  borderRadius: "15px"
                }}
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {errorEmail && (
                <small className="text-danger mt-1 d-block">{errorEmail}</small>
              )}
            </div>

            <div className="mb-4">
              <label
                className="form-label fw-bold"
                style={{ color: colors.black, fontSize: "0.9rem" }}
              >
                Password
              </label>
              <div className="position-relative">
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control shadow-none"
                  style={{
                    backgroundColor: colors.bg,
                    border: `1px solid ${colors.softBlue}`,
                    padding: "14px",
                    paddingRight: "45px",
                    borderRadius: "15px"
                  }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 shadow-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
              {errorPassword && (
                <small className="text-danger mt-1 d-block">{errorPassword}</small>
              )}
            </div>

            <button
              type="submit"
              className="btn w-100 fw-bold py-3 text-white border-0 mt-2"
              disabled={loading}
              style={{
                background: colors.primary,
                borderRadius: "15px",
                boxShadow: `0 10px 20px rgba(14, 165, 233, 0.3)`,
                transition: "all 0.3s"
              }}
            >
              {loading ? "Authenticating..." : "Sign In"}
            </button>
          </form>

          <div className="text-center mt-4">
            <p className="small text-muted mb-1">New to the platform?</p>
            <Link
              to="/employee/register"
              className="fw-bold text-decoration-none"
              style={{ color: colors.primary }}
            >
              Create Account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}