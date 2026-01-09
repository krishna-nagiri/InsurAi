import React, { useState } from "react";
import axios from "axios";

export default function HrRegister({ onBack }) {
  const [newHr, setNewHr] = useState({
    name: "",
    email: "",
    phoneNumber: "",
    hrId: "",
    password: ""
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);

 const validateEmail = (email) => {
  const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return re.test(email);
};


 const validatePhone = (phone) => {
  const digits = phone.replace(/\D/g, '');
  const re = /^[6-9]\d{9}$/;
  return re.test(digits);
};


  const checkPasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthColor = () => {
    if (passwordStrength >= 75) return "bg-success";
    if (passwordStrength >= 50) return "bg-warning";
    if (passwordStrength >= 25) return "bg-danger";
    return "bg-secondary";
  };

  const getPasswordStrengthText = () => {
    if (passwordStrength >= 75) return "Strong";
    if (passwordStrength >= 50) return "Medium";
    if (passwordStrength >= 25) return "Weak";
    return "Very Weak";
  };

const handlePhoneChange = (e) => {
  let value = e.target.value.replace(/\D/g, '');
  if (value.length > 10) value = value.slice(0, 10);
  const formattedValue = value.length > 5 ? value.slice(0, 5) + ' ' + value.slice(5) : value;
  setNewHr({ ...newHr, phoneNumber: formattedValue });
};


  const handlePasswordChange = (e) => {
    setNewHr({ ...newHr, password: e.target.value });
    checkPasswordStrength(e.target.value);
  };

  const handleRegisterHr = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(newHr.email)) {
      setError("⚠️ Please enter a valid email address (e.g., user@example.com).");
      setLoading(false);
      return;
    }

    if (!validatePhone(newHr.phoneNumber)) {
      setError("⚠️ Please enter a valid 10-digit phone number.");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        setError("⚠️ Please login as Admin first.");
        setLoading(false);
        return;
      }

      const response = await axios.post(
        "http://localhost:8077/admin/hr/register",
        newHr,
        {
          headers: { 
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          withCredentials: true,
        }
      );

      setSuccess(response.data || "HR staff registered successfully!");
      setError("");
      setNewHr({ name: "", email: "", phoneNumber: "", hrId: "", password: "" });
      setPasswordStrength(0);
    } catch (err) {
      console.error("Register HR error:", err);
      setError(err.response?.data || "Failed to register HR staff");
      setSuccess("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="hr-registration">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-gray-800 mb-1">
            <i className="bi bi-person-badge me-2 text-primary"></i>
            Register HR Staff
          </h4>
          <p className="text-gray-600 mb-0">Create a new HR staff account with administrative access</p>
        </div>
        <div className="text-end">
          <div className="badge bg-primary">
            <i className="bi bi-shield-check me-1"></i>
            Admin Access Required
          </div>
        </div>
      </div>

      {/* Registration Card */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-4 border-0">
          <div className="text-center">
            <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" 
                 style={{ width: "70px", height: "70px" }}>
              <i className="bi bi-person-badge text-white fs-3"></i>
            </div>
            <h5 className="fw-bold text-gray-800 mb-2">HR Staff Registration</h5>
            <p className="text-muted mb-0">Fill in the details to create a new HR account</p>
          </div>
        </div>

        <div className="card-body p-4 p-md-5">
          {/* Success Message */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div className="flex-grow-1">{success}</div>
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div className="flex-grow-1">{error}</div>
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleRegisterHr}>
            {/* Full Name Field */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-gray-700 mb-3">
                <i className="bi bi-person me-2 text-primary"></i> 
                Full Name
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person text-gray-500"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 py-3"
                  value={newHr.name}
                  onChange={(e) => setNewHr({ ...newHr, name: e.target.value })}
                  required
                  placeholder="Enter HR staff's full name"
                />
              </div>
            </div>

            {/* Email Field */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-gray-700 mb-3">
                <i className="bi bi-envelope me-2 text-primary"></i> 
                Email Address
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-at text-gray-500"></i>
                </span>
                <input
                  type="email"
                  className="form-control border-start-0 py-3"
                  value={newHr.email}
                  onChange={(e) => setNewHr({ ...newHr, email: e.target.value })}
                  required
                  placeholder="Enter corporate email address"
                />
              </div>
              <div className="form-text text-muted mt-2">
                <i className="bi bi-info-circle me-1"></i>
                Must be a valid corporate email address
              </div>
            </div>

            {/* Phone Number Field */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-gray-700 mb-3">
                <i className="bi bi-phone me-2 text-primary"></i> 
                Phone Number
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-telephone text-gray-500"></i>
                </span>
                <input
                  type="tel"
                  className="form-control border-start-0 py-3"
                  value={newHr.phoneNumber}
                  onChange={handlePhoneChange}
                  required
                  placeholder="9876543210"
                  maxLength="11"
                />
              </div>
              <div className="form-text text-muted mt-2">
                <i className="bi bi-info-circle me-1"></i>
                10-digit phone number required
              </div>
            </div>

            {/* HR ID Field */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-gray-700 mb-3">
                <i className="bi bi-id-card me-2 text-primary"></i> 
                HR ID
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-person-badge text-gray-500"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0 py-3"
                  value={newHr.hrId}
                  onChange={(e) => setNewHr({ ...newHr, hrId: e.target.value })}
                  required
                  placeholder="Enter unique HR ID"
                />
              </div>
              <div className="form-text text-muted mt-2">
                <i className="bi bi-info-circle me-1"></i>
                Unique identifier for HR staff
              </div>
            </div>

            {/* Password Field */}
            <div className="mb-4">
              <label className="form-label fw-semibold text-gray-700 mb-3">
                <i className="bi bi-lock me-2 text-primary"></i> 
                Password
              </label>
              <div className="input-group input-group-lg">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-key text-gray-500"></i>
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control border-start-0 py-3"
                  value={newHr.password}
                  onChange={handlePasswordChange}
                  required
                  placeholder="Create a secure password"
                />
                <button
                  type="button"
                  className="input-group-text bg-light border-start-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"} text-gray-500`}></i>
                </button>
              </div>

              {/* Password Strength Meter */}
              {newHr.password && (
                <div className="mt-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <small className="fw-semibold text-gray-700">Password Strength</small>
                    <small className={`fw-bold ${
                      passwordStrength >= 75 ? "text-success" :
                      passwordStrength >= 50 ? "text-warning" :
                      "text-danger"
                    }`}>
                      {getPasswordStrengthText()}
                    </small>
                  </div>
                  <div className="progress" style={{ height: "6px" }}>
                    <div 
                      className={`progress-bar ${getPasswordStrengthColor()}`}
                      style={{ width: `${passwordStrength}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {/* Password Requirements */}
              <div className="form-text text-muted mt-3">
                <div className="row">
                  <div className="col-6">
                    <small className={`d-flex align-items-center mb-1 ${
                      newHr.password.length >= 8 ? "text-success" : "text-muted"
                    }`}>
                      <i className={`bi ${newHr.password.length >= 8 ? "bi-check-circle-fill" : "bi-circle"} me-2`}></i>
                      8+ characters
                    </small>
                    <small className={`d-flex align-items-center mb-1 ${
                      /[A-Z]/.test(newHr.password) ? "text-success" : "text-muted"
                    }`}>
                      <i className={`bi ${/[A-Z]/.test(newHr.password) ? "bi-check-circle-fill" : "bi-circle"} me-2`}></i>
                      Uppercase letter
                    </small>
                  </div>
                  <div className="col-6">
                    <small className={`d-flex align-items-center mb-1 ${
                      /[0-9]/.test(newHr.password) ? "text-success" : "text-muted"
                    }`}>
                      <i className={`bi ${/[0-9]/.test(newHr.password) ? "bi-check-circle-fill" : "bi-circle"} me-2`}></i>
                      Number
                    </small>
                    <small className={`d-flex align-items-center mb-1 ${
                      /[^A-Za-z0-9]/.test(newHr.password) ? "text-success" : "text-muted"
                    }`}>
                      <i className={`bi ${/[^A-Za-z0-9]/.test(newHr.password) ? "bi-check-circle-fill" : "bi-circle"} me-2`}></i>
                      Special character
                    </small>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="d-flex gap-3 mt-4 pt-3">
              <button
                type="submit"
                className="btn btn-primary flex-fill fw-semibold py-3 rounded-2 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Registering HR Staff...
                  </>
                ) : (
                  <>
                    <i className="bi bi-person-plus me-2"></i>
                    Register HR Staff
                  </>
                )}
              </button>
              <button
                type="button"
                className="btn btn-outline-secondary fw-semibold py-3 rounded-2"
                onClick={onBack}
                disabled={loading}
              >
                <i className="bi bi-arrow-left me-2"></i>
                Back to Users
              </button>
            </div>
          </form>

          {/* Security Notice */}
          <div className="alert alert-light border mt-4 text-center">
            <small className="text-muted">
              <i className="bi bi-shield-check me-1 text-success"></i>
              HR staff will have access to employee management and claims processing
            </small>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hr-registration {
          animation: fadeIn 0.5s ease-in;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }
      `}</style>
    </div>
  );
}