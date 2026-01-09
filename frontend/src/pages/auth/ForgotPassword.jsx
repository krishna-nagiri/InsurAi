import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:8077/auth/forgot-password", { 
        email: email.trim().toLowerCase() 
      });

      // Backend now returns a plain string message, so handle accordingly
      setMessage(res.data || "Password reset link sent! Check your email.");
    } catch (err) {
      if (err.response?.status === 404) {
        setError("Email not found. Please check or register.");
      } else {
        setError("Failed to send reset link. Try again later.");
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
                <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
              </svg>
            </div>
            <h3 className="fw-bold" style={{ color: "#1b262c" }}>Reset Your Password</h3>
            <p className="text-muted mb-0">
              Enter your email to receive a password reset link
            </p>
          </div>

          {/* Security Notice */}
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
            We'll send you a secure link to reset your password
          </div>

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
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="form-label fw-semibold" style={{ color: "#1b262c", fontSize: "0.9rem" }}>
                Email Address
              </label>
              <div className="position-relative">
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="Enter your registered email"
                  style={{
                    borderRadius: "10px",
                    border: "1px solid #e0e0e0",
                    padding: "12px 16px 12px 44px",
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
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
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
                  Sending Reset Link...
                </>
              ) : (
                "Send Reset Link"
              )}
            </button>
          </form>

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