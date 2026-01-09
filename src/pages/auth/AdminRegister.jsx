import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import axios from 'axios';

const AdminRegister = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    adminKey: ""
  });
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post('/admin/register', formData);
      setMessage(response.data.message);
      // Redirect to login page after successful registration
      setTimeout(() => navigate('/admin/login'), 2000);
    } catch (error) {
      setMessage(error.response.data.error || 'Registration failed');
    }
  };

  return (
    <div className="container-fluid vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="row w-100 justify-content-center">
        <div className="col-12 col-md-8 col-lg-6 col-xl-5">
          <div className="card shadow-lg border-0">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <div className="bg-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: "70px", height: "70px" }}>
                  <i className="bi bi-person-plus fs-2 text-white"></i>
                </div>
                <h3 className="fw-bold text-dark mb-2">Admin Registration</h3>
                <p className="text-muted">Create an admin account for InsurAI</p>
              </div>
              {message && <div className="alert alert-info">{message}</div>}
              <form onSubmit={handleRegister}>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    <i className="bi bi-person me-2 text-primary"></i> Full Name
                  </label>
                  <input type="text" className="form-control py-2" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} required placeholder="Enter your full name" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    <i className="bi bi-envelope me-2 text-primary"></i> Email Address
                  </label>
                  <input type="email" className="form-control py-2" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} required placeholder="Enter your email" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold text-dark">
                    <i className="bi bi-key me-2 text-primary"></i> Admin Key
                  </label>
                  <input type="password" className="form-control py-2" value={formData.adminKey} onChange={(e) => setFormData({...formData, adminKey: e.target.value})} required placeholder="Enter admin key" />
                </div>
                <div className="mb-4">
                  <label className="form-label fw-semibold text-dark">
                    <i className="bi bi-lock me-2 text-primary"></i> Password
                  </label>
                  <input type="password" className="form-control py-2" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required placeholder="Create a strong password" />
                  <div className="form-text mt-1">Use 8+ characters with a mix of letters, numbers & symbols</div>
                </div>
                <button type="submit" className="btn btn-primary w-100 fw-semibold py-2 mb-3">
                  <i className="bi bi-person-plus me-2"></i> Create Admin Account
                </button>
              </form>
              <div className="text-center mt-4 pt-3 border-top">
                <p className="mb-2 text-muted">Already have an account?</p>
                <Link to="/admin/login" className="fw-semibold text-decoration-none">
                  <i className="bi bi-box-arrow-in-right me-2"></i> Admin Login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRegister;