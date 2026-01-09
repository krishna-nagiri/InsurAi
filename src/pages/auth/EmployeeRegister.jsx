import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function EmployeeRegister() {
  const [employeeId, setEmployeeId] = useState(""); 
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
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

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch("http://localhost:8077/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId, name, email, password }),
      });
      if (res.ok) {
        navigate("/employee/login");
      } else {
        setMessage("Registration failed. Try again.");
      }
    } catch (err) {
      setMessage("Server error occurred.");
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
        padding: "40px 20px"
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
            Employee Registration
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
            InsurAI Employee Portal
          </p>
        </div>

        {/* Body */}
        <div className="card-body p-4 p-md-5">
          {message && (
            <div
              className="alert alert-info py-2"
              style={{ borderRadius: "10px" }}
            >
              {message}
            </div>
          )}
          <form onSubmit={handleRegister}>
            <div className="mb-3">
              <label
                className="form-label fw-bold"
                style={{ color: colors.black, fontSize: "0.9rem" }}
              >
                Employee ID
              </label>
              <input
                type="text"
                placeholder="EMP123"
                className="form-control shadow-none"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.softBlue}`,
                  color: colors.black,
                  padding: "14px",
                  borderRadius: "15px"
                }}
                onChange={(e) => setEmployeeId(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label fw-bold"
                style={{ color: colors.black, fontSize: "0.9rem" }}
              >
                Full Name
              </label>
              <input
                type="text"
                placeholder="John Doe"
                className="form-control shadow-none"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.softBlue}`,
                  color: colors.black,
                  padding: "14px",
                  borderRadius: "15px"
                }}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="mb-3">
              <label
                className="form-label fw-bold"
                style={{ color: colors.black, fontSize: "0.9rem" }}
              >
                Email Address
              </label>
              <input
                type="email"
                placeholder="name@company.com"
                className="form-control shadow-none"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.softBlue}`,
                  color: colors.black,
                  padding: "14px",
                  borderRadius: "15px"
                }}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="mb-4">
              <label
                className="form-label fw-bold"
                style={{ color: colors.black, fontSize: "0.9rem" }}
              >
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                className="form-control shadow-none"
                style={{
                  backgroundColor: colors.bg,
                  border: `1px solid ${colors.softBlue}`,
                  color: colors.black,
                  padding: "14px",
                  borderRadius: "15px"
                }}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn w-100 fw-bold py-3 text-white border-0 mt-2"
              style={{
                background: colors.primary,
                borderRadius: "15px",
                boxShadow: `0 10px 20px rgba(14, 165, 233, 0.3)`,
                transition: "all 0.3s"
              }}
              disabled={loading}
            >
              {loading ? "Registering..." : "Create Account"}
            </button>
          </form>

          <div className="text-center mt-4">
            <Link
              to="/employee/login"
              style={{
                color: colors.primary,
                textDecoration: "none",
                fontWeight: "600"
              }}
            >
              Already have an account? Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}