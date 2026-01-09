import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import AgentRegister from "../../auth/AgentRegister";
import HrRegister from "../../auth/HRRegister";
import AdminPolicy from "./AdminPolicy";
import AdminAllClaims from './AdminAllClaims';
import AdminReportsAnalytics from "./AdminReportsAnalytics";
import AdminUserManagement from "./AdminUserManagement";
import AdminFraudClaims from "./AdminFraudClaims";
import AdminAuditLogs from "./AdminAuditLogs";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [users, setUsers] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [claims, setClaims] = useState([]);
  const [policies, setPolicies] = useState([]);

  const [newHR, setNewHR] = useState({ name: "", email: "", password: "" });
  const [newAgent, setNewAgent] = useState({ name: "", email: "", password: "" });

  // Theme colors
  const themeColors = {
  primary: '#0d47a1',   // Deep Blue
  secondary: '#1976d2', // Medium Blue
  accent: '#42a5f5',    // Light Blue Accent
  light: '#e3f2fd',     // Very Light Blue Background
  dark: '#082567'       // Navy/Dark Blue
};

  const handleLogout = () => {
    localStorage.clear();
    navigate("/admin/login");
  };

  // ---------------- fetchUsers ----------------
  const fetchUsers = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");

      // Fetch agents
      const agentsRes = await axios.get("http://localhost:8077/agent", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const agentsData = Array.isArray(agentsRes.data) ? agentsRes.data : [];
      const mappedAgents = agentsData.map((a) => ({
        id: a.id,
        name: a.name,
        email: a.email,
        role: "Agent",
        status: "Active",
      }));

      // Fetch employees
      const employeesRes = await axios.get("http://localhost:8077/auth/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employeesData = Array.isArray(employeesRes.data) ? employeesRes.data : [];
      const mappedEmployees = employeesData.map((e) => ({
        id: e.id,
        name: e.name,
        email: e.email,
        role: "Employee",
        status: e.active ? "Active" : "Inactive",
      }));

      // Fetch HRs
      const hrsRes = await axios.get("http://localhost:8077/hr", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hrsData = Array.isArray(hrsRes.data) ? hrsRes.data : [];
      const mappedHRs = hrsData.map((h) => ({
        id: h.id,
        name: h.name,
        email: h.email,
        role: "HR",
        status: "Active",
      }));

      // Combine agents + employees + HRs
      const allUsers = [...mappedAgents, ...mappedEmployees, ...mappedHRs];
      setUsers(allUsers);
    } catch (err) {
      console.error("Failed to fetch users", err);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ---------------- Register HR ----------------
  const handleRegisterHR = async (hrData) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8077/admin/hr/register", hrData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewHR({ name: "", email: "", password: "" });
      setActiveTab("users");
      fetchUsers();
    } catch (err) {
      console.error("Failed to register HR", err);
      alert("Error registering HR");
    }
  };

  // ---------------- Register Agent ----------------
  const handleRegisterAgent = async (agentData) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:8077/admin/agent/register", agentData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNewAgent({ name: "", email: "", password: "" });
      setActiveTab("users");
      fetchUsers();
    } catch (err) {
      console.error("Failed to register Agent", err);
      alert("Error registering Agent");
    }
  };

  // ---------------- Fetch all claims with policies, employee & HR mapping ----------------
  const fetchAllClaims = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      // Fetch claims
      const claimsRes = await fetch("http://localhost:8077/admin/claims", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!claimsRes.ok) {
        console.error("Failed to fetch claims");
        return;
      }
      const claimsData = await claimsRes.json();

      // Fetch employees
      const empRes = await fetch("http://localhost:8077/auth/employees", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const employees = await empRes.json();

      // Fetch HRs
      const hrRes = await fetch("http://localhost:8077/hr", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const hrs = await hrRes.json();

      // Fetch policies
      const policyRes = await fetch("http://localhost:8077/admin/policies", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const policiesData = await policyRes.json();
      setPolicies(policiesData);

      // Map claims with employee, HR, and policy details
      const mappedClaims = claimsData.map((claim) => {
        const employee = employees.find(
          (emp) => emp.id === claim.employeeId || emp.id === claim.employee_id
        );
        const hr = hrs.find(
          (hr) => hr.id === claim.assignedHrId || hr.id === claim.assigned_hr_id
        );
        const policy = policiesData.find(
          (p) => p.id === claim.policyId || p.id === claim.policy_id
        );

        return {
          ...claim,
          employeeName: employee?.name || "Unknown",
          employeeIdDisplay: employee?.employeeId || "N/A",
          documents: claim.documents || [],
          assignedHrName: hr?.name || "Not Assigned",
          policyName: policy?.policyName || "N/A",
          remarks: claim.remarks || "",
        };
      });

      setClaims(mappedClaims);
    } catch (err) {
      console.error("Error fetching claims:", err);
    }
  };

  useEffect(() => {
    fetchAllClaims();
  }, []);

  // ---------------- Animated Counter Component ----------------
  const AnimatedCounter = ({ value, duration = 1000 }) => {
    const [count, setCount] = useState(0);

    useEffect(() => {
      let start = 0;
      const end = parseInt(value);
      if (start === end) return;

      const incrementTime = (duration / end);
      const timer = setInterval(() => {
        start += 1;
        setCount(start);
        if (start >= end) clearInterval(timer);
      }, incrementTime);

      return () => clearInterval(timer);
    }, [value, duration]);

    return <span>{count}</span>;
  };

  // ---------------- Progress Bar Component ----------------
  const ProgressBar = ({ percentage, color = "theme" }) => {
    return (
      <div className="progress" style={{ height: "8px", backgroundColor: "#e9ecef" }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{ 
            width: `${percentage}%`, 
            transition: "width 0.5s ease",
            backgroundColor: color === "theme" ? themeColors.secondary : undefined
          }}
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    );
  };

  // ---------------- Render content ----------------
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        // --- Users ---
        const totalUsers = users.length;
        const totalHR = users.filter(u => u.role === "HR").length;
        const totalAgents = users.filter(u => u.role === "Agent").length;
        const totalEmployees = users.filter(u => u.role === "Employee").length;
        const activeUsers = users.filter(u => (u.status || '').toString().toLowerCase() === "active").length;

        // --- Claims ---
        const totalClaims = claims.length;

        // helper: normalize status and parse dates from multiple possible property names
        const normalizeStatus = (c) => {
          const raw = (c.status || c.claimStatus || c.state || c.verdict || "").toString().toLowerCase().trim();
          return raw;
        };

        const isPendingStatus = (s) =>
          ["pending", "awaiting", "open", "in_progress", "in progress", "submitted"].includes(s);

        const isResolvedStatus = (s) =>
          ["resolved", "approved", "closed", "completed", "settled"].includes(s);

        const parseDateField = (value) => {
          if (!value) return null;
          const d = new Date(value);
          return isNaN(d) ? null : d;
        };

        const pendingClaims = claims.filter(c => {
          const s = normalizeStatus(c);
          return isPendingStatus(s);
        }).length;

        const resolvedClaims = claims.filter(c => {
          const s = normalizeStatus(c);
          return isResolvedStatus(s);
        }).length;

        const highPriorityAlerts = claims.filter(c => {
          const p = (c.priority || c.priorityLevel || "").toString().toLowerCase();
          return ["high", "urgent", "critical"].includes(p);
        }).length;

        // --- Time-based stats ---
        const todayStr = new Date().toDateString();

        // handle multiple created date property names for users
        const userCreatedDate = (u) =>
          parseDateField(u.createdAt || u.created_at || u.createdOn || u.created_on || u.registeredAt || u.registered_at);

        const newUsersToday = users.filter(u => {
          const dt = userCreatedDate(u);
          return dt && dt.toDateString() === todayStr;
        }).length;

        // resolved today: check updated/resolved timestamps and normalized status
        const claimResolvedDate = (c) =>
          parseDateField(c.updatedAt || c.updated_at || c.resolvedAt || c.resolved_at || c.closedAt || c.closed_at);

        const resolvedToday = claims.filter(c => {
          const s = normalizeStatus(c);
          if (!isResolvedStatus(s)) return false;
          const dt = claimResolvedDate(c);
          return dt && dt.toDateString() === todayStr;
        }).length;

        // --- Recent Activity ---
        const recentActivities = claims
          .slice(-5)
          .reverse()
          .map(c => {
            const s = normalizeStatus(c);
            return {
              id: c.id,
              action: `Claim by ${c.employeeName || "Unknown"}`,
              user: `Policy: ${c.policyName || "N/A"}`,
              time: parseDateField(c.createdAt || c.created_at || c.createdOn || c.created_on)?.toLocaleString() || "Unknown time",
              type: isPendingStatus(s) ? "warning" : (isResolvedStatus(s) ? "success" : "info"),
            };
          });

        // --- Chart Data ---
        const claimChartData = [
          { name: "Pending", value: pendingClaims },
          { name: "Resolved", value: resolvedClaims },
          { name: "High Priority", value: highPriorityAlerts },
        ];

        return (
          <div className="w-100">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div>
                <h2 style={{ color: themeColors.primary }} className="fw-bold mb-2">Admin Dashboard Overview</h2>
                <p className="text-muted mb-0">Welcome back, Admin. Here's your system overview.</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className="badge fs-6 px-3 py-2" style={{ backgroundColor: themeColors.secondary, color: 'white' }}>
                  <i className="bi bi-check-circle me-1"></i>
                  System Online
                </span>
                <small className="text-muted">
                  Updated: {new Date().toLocaleTimeString()}
                </small>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="row g-4 mb-5">
              {/* Total Users Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">Total Users</h6>
                        <h2 className="fw-bold mb-0" style={{ color: themeColors.primary }}>
                          <AnimatedCounter value={totalUsers} />
                        </h2>
                        <small className="text-muted">
                          <i className="bi bi-people-fill me-1" style={{ color: themeColors.primary }}></i>
                          {totalHR} HR • {totalAgents} Agents • {totalEmployees} Employees
                        </small>
                      </div>
                      <div className="metric-icon" style={{ backgroundColor: `${themeColors.primary}15` }}>
                        <i className="bi bi-people fs-4" style={{ color: themeColors.primary }}></i>
                      </div>
                    </div>
                    <ProgressBar percentage={(activeUsers / Math.max(totalUsers, 1)) * 100} color="theme" />
                  </div>
                </div>
              </div>

              {/* Claims Overview Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">Claims Overview</h6>
                        <h2 className="fw-bold mb-0" style={{ color: themeColors.accent }}>
                          <AnimatedCounter value={totalClaims} />
                        </h2>
                        <small className="text-muted">
                          <i className="bi bi-exclamation-triangle-fill me-1" style={{ color: themeColors.accent }}></i>
                          {pendingClaims} pending • {resolvedClaims} resolved
                        </small>
                      </div>
                      <div className="metric-icon" style={{ backgroundColor: `${themeColors.accent}15` }}>
                        <i className="bi bi-clipboard-data fs-4" style={{ color: themeColors.accent }}></i>
                      </div>
                    </div>
                    <ProgressBar percentage={(resolvedClaims / Math.max(totalClaims, 1)) * 100} color="theme" />
                  </div>
                </div>
              </div>

              {/* High Priority Alerts Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">High Priority Alerts</h6>
                        <h2 className="fw-bold mb-0" style={{ color: '#dc3545' }}>
                          <AnimatedCounter value={highPriorityAlerts} />
                        </h2>
                        <small className="text-muted">
                          <i className="bi bi-shield-exclamation me-1" style={{ color: '#dc3545' }}></i>
                          Require immediate attention
                        </small>
                      </div>
                      <div className="metric-icon" style={{ backgroundColor: '#dc354515' }}>
                        <i className="bi bi-exclamation-triangle fs-4" style={{ color: '#dc3545' }}></i>
                      </div>
                    </div>
                    <ProgressBar percentage={Math.min((highPriorityAlerts / Math.max(totalClaims, 1)) * 100, 100)} color="theme" />
                  </div>
                </div>
              </div>

              {/* System Health Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">System Health</h6>
                        <h2 className="fw-bold mb-0" style={{ color: '#28a745' }}>100%</h2>
                        <small className="text-muted">
                          <i className="bi bi-check-circle-fill me-1" style={{ color: '#28a745' }}></i>
                          All systems operational
                        </small>
                      </div>
                      <div className="metric-icon" style={{ backgroundColor: '#28a74515' }}>
                        <i className="bi bi-server fs-4" style={{ color: '#28a745' }}></i>
                      </div>
                    </div>
                    <ProgressBar percentage={100} color="theme" />
                  </div>
                </div>
              </div>
            </div>

            {/* Charts & Info Section */}
            <div className="row g-4 mb-5">
              {/* Quick Stats */}
              <div className="col-lg-4">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h5 className="fw-bold mb-0" style={{ color: themeColors.primary }}>Today's Summary</h5>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ backgroundColor: themeColors.light }}>
                      <span className="text-muted">New Users:</span>
                      <strong style={{ color: themeColors.primary }}>{newUsersToday}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mb-3 p-3 rounded" style={{ backgroundColor: themeColors.light }}>
                      <span className="text-muted">Pending Claims:</span>
                      <strong style={{ color: themeColors.accent }}>{pendingClaims}</strong>
                    </div>
                    <div className="d-flex justify-content-between align-items-center p-3 rounded" style={{ backgroundColor: themeColors.light }}>
                      <span className="text-muted">Resolved Today:</span>
                      <strong style={{ color: '#28a745' }}>{resolvedToday}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart */}
              <div className="col-lg-8">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <h5 className="fw-bold mb-0" style={{ color: themeColors.primary }}>Claims Overview</h5>
                  </div>
                  <div className="card-body">
                    <div style={{ height: "300px" }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={claimChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            dataKey="value" 
                            fill={themeColors.secondary}
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="row g-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="fw-bold mb-0" style={{ color: themeColors.primary }}>Recent Activity</h5>
                      <button className="btn btn-sm rounded-pill" style={{ backgroundColor: themeColors.primary, color: 'white' }}>
                        View All <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="activity-timeline">
                      {recentActivities.map((activity, index) => (
                        <div key={activity.id} className="activity-item d-flex align-items-start mb-3">
                          <div className="activity-indicator">
                            <div 
                              className="indicator-dot" 
                              style={{ 
                                backgroundColor: activity.type === 'warning' ? ' #1e3a5f' : 
                                              activity.type === 'success' ? '#28a745' : themeColors.secondary 
                              }}
                            ></div>
                            {index < recentActivities.length - 1 && <div className="indicator-line"></div>}
                          </div>
                          <div className="activity-content flex-grow-1 ms-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <h6 className="mb-1 fw-semibold" style={{ color: themeColors.primary }}>{activity.action}</h6>
                              <span 
                                className="badge fs-7" 
                                style={{ 
                                  backgroundColor: activity.type === 'warning' ? ' #1e3a5f' : 
                                                activity.type === 'success' ? '#28a745' : themeColors.secondary,
                                  color: 'white'
                                }}
                              >
                                {activity.type === 'warning' ? 'Pending' : 'Resolved'}
                              </span>
                            </div>
                            <p className="text-muted mb-1 small">{activity.user}</p>
                            <small className="text-muted">
                              <i className="bi bi-clock me-1"></i>
                              {activity.time}
                            </small>
                          </div>
                        </div>
                      ))}
                      {recentActivities.length === 0 && (
                        <div className="text-center py-4">
                          <i className="bi bi-inbox display-4 text-muted"></i>
                          <p className="text-muted mt-2">No recent activity</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Alerts Section */}
            {highPriorityAlerts > 0 && (
              <div className="row g-4 mt-3">
                <div className="col-12">
                  <div className="alert border-0 shadow-sm" style={{ backgroundColor: '#fff3cd', borderLeft: `4px solid ${themeColors.accent}` }}>
                    <div className="d-flex align-items-center justify-content-between">
                      <div>
                        <h6 className="alert-heading mb-1" style={{ color: themeColors.primary }}>
                          <i className="bi bi-exclamation-triangle me-2"></i>
                          Action Required
                        </h6>
                        <p className="mb-0">You have {highPriorityAlerts} high-priority claims requiring immediate attention.</p>
                      </div>
                      <button 
                        className="btn btn-sm rounded-pill"
                        style={{ backgroundColor: themeColors.accent, color: 'white' }}
                        onClick={() => setActiveTab("claims")}
                      >
                        Review Claims <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case "users":
        return (
          <div className="w-100">
            <AdminUserManagement users={users} setActiveTab={setActiveTab} />
          </div>
        );

      case "registerHR":
        return (
          <div className="w-100">
            <HrRegister
              onBack={() => setActiveTab("users")}
              onRegister={handleRegisterHR}
              newHR={newHR}
              setNewHR={setNewHR}
            />
          </div>
        );

      case "registerAgent":
        return (
          <div className="w-100">
            <AgentRegister
              onBack={() => setActiveTab("users")}
              onRegister={handleRegisterAgent}
              newAgent={newAgent}
              setNewAgent={setNewAgent}
            />
          </div>
        );

      case "createPolicy":
        return (
          <div className="w-100">
            <AdminPolicy />
          </div>
        );

      case "claims":
        return (
          <div className="w-100">
            <AdminAllClaims claims={claims} />
          </div>
        );

      case "reports":
        return (
          <div className="w-100">
            <AdminReportsAnalytics />
          </div>
        );

      case "fraud":
        return (
          <div className="w-100">
            <AdminFraudClaims />
          </div>
        );

      case "audit":
  return (
    <div className="w-100">
      <AdminAuditLogs themeColors={themeColors} />
    </div>
  );

      
      default:
        return (
          <div className="w-100">
            <h4 style={{ color: themeColors.primary }}>Welcome to Admin Dashboard</h4>
          </div>
        );
    }
  };

  return (
    <div className="admin-dashboard enterprise-dashboard">
      {/* Header */}
      <header className="dashboard-header text-white py-3 px-4 shadow-lg w-100">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6 d-flex align-items-center">
              <button 
                className="btn btn-light btn-sm me-3 d-md-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                style={{ backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', color: 'white' }}
              >
                <i className="bi bi-list"></i>
              </button>
              <div className="d-flex align-items-center gap-3">
                <div className="brand-logo me-3">
                  <i className="bi bi-shield-check fs-2 text-white"></i>
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">InsurAI Admin Portal</h2>
                  <small className="text-light opacity-75">Administration Suite v2.0</small>
                </div>
              </div>
            </div>

            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <div className="d-flex align-items-center gap-4">
                <div className="text-end">
                  <div className="fw-bold">System Administrator</div>
                  <small className="text-light opacity-75">Admin User</small>
                </div>
                <div className="vr bg-light opacity-50" style={{height: '30px'}}></div>
                <button
                  className="btn btn-outline-light btn-sm"
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right me-2"></i>
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="dashboard-main d-flex">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar shadow-sm ${isMobileMenuOpen ? 'show' : ''}`}>
          <nav className="nav flex-column p-3">
            {[
              { id: "home", icon: "bi-speedometer2", label: "Dashboard" },
              { id: "users", icon: "bi-people", label: "User Management" },
              { id: "registerHR", icon: "bi-person-plus", label: "Register HR" },
              { id: "registerAgent", icon: "bi-person-badge", label: "Register Agent" },
              { id: "createPolicy", icon: "bi-file-medical", label: "Policy Management" },
              { id: "claims", icon: "bi-card-list", label: "Claims Overview" },
              { id: "reports", icon: "bi-graph-up", label: "Reports & Analytics" },
              { id: "fraud", icon: "bi-shield-exclamation", label: "Fraud Detection" },
              { id: "audit", icon: "bi-list-check", label: "Audit Logs" },
            ].map((item) => (
              <a
                key={item.id}
                href="#"
                className={`nav-link sidebar-link ${activeTab === item.id ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  setActiveTab(item.id);
                  setIsMobileMenuOpen(false);
                }}
              >
                <i className={`${item.icon} me-3`}></i>
                {item.label}
              </a>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer p-3 border-top">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-success rounded-circle p-1 me-2">
                <i className="bi bi-circle-fill text-success" style={{fontSize: '8px'}}></i>
              </div>
              <small className="text-muted">System Online</small>
            </div>
            <small className="text-muted d-block mt-1">v2.0.1 • Admin Suite</small>
          </div>
        </aside>

        {/* Content Area */}
        <main className="dashboard-content bg-light flex-grow-1">
          <div className="dashboard-content-wrapper p-4">
            {renderContent()}
          </div>
        </main>
      </div>

      {/* Global Styles */}
      <style>{`
        .enterprise-dashboard {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

      /* Header Gradient */
      .admin-dashboard .dashboard-header {
        background: linear-gradient(135deg, #1e3a5f 100%);
      }

      /* Sidebar */
      .dashboard-sidebar {
        color: #ffffff;
        width: 250px;
        min-height: 100vh;
        transition: all 0.3s ease;
      }

      .sidebar-link {
        border-radius: 8px;
        margin-bottom: 5px;
        transition: all 0.3s ease;
        color: rgba(0, 0, 0, 1);
        padding: 12px 15px;
        display: flex;
        align-items: center;
      }

      .sidebar-link:hover {
        background-color: rgba(255,255,255,0.1);
        transform: translateX(5px);
      }

      .sidebar-link.active {
        background: linear-gradient(135deg,  #1e3a5f 100%);
        color: white;
        font-weight: 600;
        box-shadow: 0 2px 10px rgba(0,123,255,0.3);
      }

      .sidebar-footer {
        color: #ffffff;
      }

        /* Metric Cards */
        .metric-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(0,0,0,0.1) !important;
        }

        .metric-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Activity Timeline */
        .activity-indicator {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-right: 15px;
        }

        .indicator-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          z-index: 2;
        }

        .indicator-line {
          width: 2px;
          flex: 1;
          background-color: #dae2eaff;
          margin-top: 5px;
        }

        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            height: 100vh;
            z-index: 1000;
          }
          .dashboard-sidebar.show {
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}