import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ResetPassword() {
  const { token } = useParams(); // Reset token from URL
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Check token existence when component mounts
  useEffect(() => {
    if (!token) {
      setError("Reset token is missing.");
      setTokenValid(false);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!token) {
      setError("Reset token is missing.");
      setTokenValid(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    try {
      // Send new password to backend
      const res = await axios.post(
        `http://localhost:8077/auth/reset-password/${token}`,
        { newPassword: password } // Backend expects this field
      );

      setMessage(res.data || "Password reset successfully!");
      setTokenValid(false); // Disable form after success
      // Redirect to login after short delay
      setTimeout(() => navigate("/employee/login"), 2000);
    } catch (err) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 400) {
        setError(typeof data === "string" ? data : "Invalid or expired reset token.");
        setTokenValid(false);
      } else {
        setError("Failed to reset password. Try again later.");
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
        background: "linear-gradient(135deg, #1b262c 0%, #143240 50%, #206c95 100%)",
        padding: "20px",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        className="card shadow-lg border-0"
        style={{
          maxWidth: "480px",
          width: "95%",
          borderRadius: "20px",
          overflow: "hidden",
          background: "rgba(255, 255, 255, 0.95)",
        }}
      >
        <div className="card-body p-4 p-md-5">
          {/* Header */}
          <div className="text-center mb-4">
            <div
              style={{
                width: "70px",
                height: "70px",
                background: "linear-gradient(135deg, #206c95, #1b262c)",
                borderRadius: "16px",
                margin: "0 auto 16px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 8px 25px rgba(32, 108, 149, 0.3)",
                color: "white",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <path d="M20 8v6" />
                <path d="M23 11h-6" />
              </svg>
            </div>
            <h3 className="fw-bold" style={{ color: "#1b262c" }}>Reset Password</h3>
            <p className="text-muted mb-0">
              Create your new secure password
            </p>
          </div>

          {/* Security Notice */}
          {tokenValid && (
            <div 
              className="alert alert-info d-flex align-items-center"
              style={{
                borderRadius: "12px",
                border: "none",
                background: "rgba(32, 108, 149, 0.1)",
                color: "#206c95",
                fontSize: "0.9rem",
                padding: "12px 16px",
                marginBottom: "25px"
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="me-2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Password must be at least 6 characters long
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div 
              className="alert alert-danger d-flex align-items-center"
              style={{
                borderRadius: "12px",
                border: "none",
                background: "rgba(220, 53, 69, 0.1)",
                color: "#dc3545",
                fontSize: "0.9rem",
                padding: "12px 16px",
                marginBottom: "20px"
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="me-2"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          {/* Success Alert */}
          {message && (
            <div 
              className="alert alert-success d-flex align-items-center"
              style={{
                borderRadius: "12px",
                border: "none",
                background: "rgba(40, 167, 69, 0.1)",
                color: "#28a745",
                fontSize: "0.9rem",
                padding: "12px 16px",
                marginBottom: "20px"
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="me-2"
              >
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22,4 12,14.01 9,11.01" />
              </svg>
              {message}
            </div>
          )}

          {/* Reset Form */}
          {tokenValid && (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label fw-semibold" style={{ color: "#1b262c", fontSize: "0.9rem" }}>
                  New Password
                </label>
                <div className="position-relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Enter new password"
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e0e0e0",
                      padding: "12px 44px 12px 44px",
                      fontSize: "0.95rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#206c95";
                      e.target.style.boxShadow = "0 0 0 3px rgba(32, 108, 149, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="position-absolute"
                    style={{
                      top: "50%",
                      left: "16px",
                      transform: "translateY(-50%)",
                      color: "#206c95",
                      opacity: 0.6,
                    }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <button
                    type="button"
                    className="btn btn-link position-absolute p-0 border-0"
                    style={{
                      top: "50%",
                      right: "16px",
                      transform: "translateY(-50%)",
                      color: "#206c95",
                      background: "none",
                      opacity: 0.6,
                    }}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {showPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold" style={{ color: "#1b262c", fontSize: "0.9rem" }}>
                  Confirm Password
                </label>
                <div className="position-relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    className="form-control"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Confirm new password"
                    style={{
                      borderRadius: "10px",
                      border: "1px solid #e0e0e0",
                      padding: "12px 44px 12px 44px",
                      fontSize: "0.95rem",
                      transition: "all 0.3s ease",
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = "#206c95";
                      e.target.style.boxShadow = "0 0 0 3px rgba(32, 108, 149, 0.1)";
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = "#e0e0e0";
                      e.target.style.boxShadow = "none";
                    }}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="position-absolute"
                    style={{
                      top: "50%",
                      left: "16px",
                      transform: "translateY(-50%)",
                      color: "#206c95",
                      opacity: 0.6,
                    }}
                  >
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <button
                    type="button"
                    className="btn btn-link position-absolute p-0 border-0"
                    style={{
                      top: "50%",
                      right: "16px",
                      transform: "translateY(-50%)",
                      color: "#206c95",
                      background: "none",
                      opacity: 0.6,
                    }}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      {showConfirmPassword ? (
                        <>
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </>
                      ) : (
                        <>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn w-100 fw-semibold position-relative"
                disabled={loading}
                style={{
                  borderRadius: "10px",
                  background: "linear-gradient(135deg, #206c95, #1b262c)",
                  border: "none",
                  color: "white",
                  padding: "14px",
                  fontSize: "1rem",
                  transition: "all 0.3s ease",
                  boxShadow: "0 4px 15px rgba(32, 108, 149, 0.3)",
                  opacity: loading ? 0.7 : 1,
                }}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.target.style.transform = "translateY(-2px)";
                    e.target.style.boxShadow = "0 6px 20px rgba(32, 108, 149, 0.4)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading) {
                    e.target.style.transform = "translateY(0)";
                    e.target.style.boxShadow = "0 4px 15px rgba(32, 108, 149, 0.3)";
                  }
                }}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Resetting Password...
                  </>
                ) : (
                  "Reset Password"
                )}
              </button>
            </form>
          )}

          {/* Back to Login */}
          <div className="text-center mt-4">
            <button
              className="btn btn-link text-decoration-none p-0 border-0 d-inline-flex align-items-center"
              style={{
                color: "#206c95",
                fontSize: "0.9rem",
                fontWeight: "500",
                transition: "color 0.3s ease",
              }}
              onClick={() => navigate("/employee/login")}
              onMouseEnter={(e) => {
                e.target.style.color = "#1b262c";
              }}
              onMouseLeave={(e) => {
                e.target.style.color = "#206c95";
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="me-2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              Back to Login
            </button>
          </div>

          {/* Security Badge */}
          <div className="text-center mt-4 pt-3" style={{ borderTop: "1px solid #e0e0e0" }}>
            <div className="d-flex align-items-center justify-content-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                className="me-2"
                style={{ color: "#206c95" }}
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <small style={{ color: "#666", fontSize: "0.8rem" }}>
                Secure Password Reset • Encrypted Connection
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}