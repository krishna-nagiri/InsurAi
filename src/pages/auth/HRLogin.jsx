import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function HrLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z][a-zA-Z0-9-]*(\.[a-zA-Z]{2,})+$/;
    return re.test(email);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!validateEmail(email)) {
      alert("Please enter a valid email address");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("http://localhost:8077/hr/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        localStorage.setItem("token", data.token);
        localStorage.setItem("role", "hr");
        localStorage.setItem("name", data.name);
        localStorage.setItem("id", data.id);
        navigate("/hr/dashboard");
      } else {
        alert("Access Denied");
      }
    } catch (err) {
      alert("Secure server connection failed.");
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
        background: "radial-gradient(circle, #e0f7ff, #b3e5fc)", // light blue gradient
      }}
    >
      <div
        className="card border-0 shadow-lg p-5 text-center"
        style={{
          width: "420px",
          borderRadius: "30px",
          background: "rgba(255, 255, 255, 0.9)", // glassmorphism card
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0, 0, 0, 0.05)",
        }}
      >
        <div className="mb-4">
          <div
            className="d-inline-flex p-3 rounded-circle mb-3"
            style={{
              background: "linear-gradient(135deg, #4fc3f7, #0288d1)", // HR blue gradient
            }}
          >
            <span style={{ fontSize: "2rem" }}>👥</span>
          </div>
          <h3 className="fw-bold text-dark mb-0">HR Portal</h3>
          <p
            style={{
              color: "#0288d1",
              fontSize: "0.85rem",
              letterSpacing: "1px",
            }}
          >
            WORKFORCE MANAGEMENT
          </p>
        </div>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="HR Email"
            className="form-control mb-3 border-0 shadow-none"
            style={{
              backgroundColor: "rgba(173,216,230,0.3)", // light blue input
              color: "#000",
              padding: "14px",
              borderRadius: "15px",
            }}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="input-group mb-4">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Access Key"
              className="form-control border-0 shadow-none"
              style={{
                backgroundColor: "rgba(173,216,230,0.3)",
                color: "#000",
                padding: "14px",
                borderRadius: "15px 0 0 15px",
              }}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="btn"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                backgroundColor: "rgba(173,216,230,0.3)",
                borderRadius: "0 15px 15px 0",
                color: "#0288d1",
              }}
            >
              {showPassword ? "🙈" : "👁️"}
            </button>
          </div>

          <button
            className="btn w-100 fw-bold py-3 text-white border-0"
            style={{
              background: "linear-gradient(135deg, #4fc3f7, #0288d1)", // HR blue gradient button
              borderRadius: "15px",
              boxShadow: "0 10px 20px rgba(2, 136, 209, 0.3)",
            }}
          >
            {loading ? "VERIFYING..." : "OPEN HR CONSOLE 📈"}
          </button>
        </form>
      </div>
    </div>
  );
}