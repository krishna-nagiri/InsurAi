import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "../Dashboard.css";
import axios from "axios";
import AgentQueries from "./AgentQueries";
import AgentClaims from "./AgentClaims";
import AgentAvailability from "./AgentAvailability";
import AgentReports from "./AgentReports";

export default function AgentDashboard() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("All");
  const [activeTab, setActiveTab] = useState("home");
  const [availability, setAvailability] = useState(false);
  const [employeeQueries, setEmployeeQueries] = useState([]);
  const [assistedClaims, setAssistedClaims] = useState([]);
  const [futureFrom, setFutureFrom] = useState("");
  const [futureTo, setFutureTo] = useState("");
  const [agentId, setAgentId] = useState(null);
  const [agentName, setAgentName] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // -------------------- Get agent info, availability, and queries --------------------
  useEffect(() => {
    const storedAgentId = localStorage.getItem("agentId");
    const storedAgentName = localStorage.getItem("agentName");
    const token = localStorage.getItem("token");

    if (!token) {
      alert("No token found, please login again");
      navigate("/agent/login");
      return;
    }

    if (storedAgentId && storedAgentName) {
      const id = parseInt(storedAgentId);
      setAgentId(id);
      setAgentName(storedAgentName);

      const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch availability
      axios.get(`http://localhost:8077/agent/${id}/availability`, axiosConfig)
        .then(res => {
          if (res.data && typeof res.data.available === "boolean") {
            setAvailability(res.data.available);
          }
        })
        .catch(err => console.error("Failed to fetch availability", err));

      // Fetch all employees once
      let employeeMap = {};
      axios.get("http://localhost:8077/auth/employees", axiosConfig)
        .then(empRes => {
          empRes.data.forEach(emp => {
            employeeMap[emp.id] = emp.name;
          });

          // Fetch all queries
          axios.get(`http://localhost:8077/agent/queries/all/${id}`, axiosConfig)
            .then(res => {
              if (res.data) {
                const allQueries = res.data.map(q => ({
                  id: q.id,
                  employeeId: q.employeeId,
                  employee: q.employee ? q.employee.name : employeeMap[q.employeeId] || `Employee ${q.employeeId}`,
                  query: q.queryText,
                  policyName: q.policyName || "-",
                  claimType: q.claimType || "-",
                  createdAt: q.createdAt,
                  updatedAt: q.updatedAt,
                  status: q.status === "resolved" ? "Resolved" : "Pending",
                  response: q.response || "",
                  agentId: q.agentId,
                  allowEdit: q.status === "pending"
                }));

                setEmployeeQueries(allQueries);

                // Derive assisted claims automatically
                const resolvedClaims = allQueries
                  .filter(q => q.status === "Resolved")
                  .map(q => ({
                    id: q.id,
                    employee: q.employee,
                    type: q.claimType || "-",
                    policyName: q.policyName || "-",
                    date: q.updatedAt ? new Date(q.updatedAt).toLocaleString() : "-",
                    status: "Approved"
                  }));

                setAssistedClaims(resolvedClaims);
              }
            })
            .catch(err => console.error("Failed to fetch queries", err));
        })
        .catch(err => console.error("Failed to fetch employees", err));
    } else {
      navigate("/agent/login");
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.clear();
    navigate("/agent/login");
  };

  // -------------------- Toggle availability --------------------
  const toggleAvailability = async () => {
    try {
      const newStatus = !availability;
      const token = localStorage.getItem("token");
      if (!token) return alert("No token found, please login again");

      const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post("http://localhost:8077/agent/availability", {
        agentId,
        available: newStatus,
        startTime: new Date().toISOString(),
        endTime: null
      }, axiosConfig);

      const res = await axios.get(`http://localhost:8077/agent/${agentId}/availability`, axiosConfig);
      if (res.data) setAvailability(res.data.available);

      alert(`You are now ${newStatus ? "available" : "unavailable"} for queries`);
    } catch (error) {
      console.error("Error updating availability:", error);
      alert("Failed to update availability");
    }
  };

  // -------------------- Schedule future availability --------------------
  const scheduleFutureAvailability = async () => {
    if (!futureFrom || !futureTo) {
      alert("Please select both start and end time.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("No token found, please login again");

      const axiosConfig = { headers: { Authorization: `Bearer ${token}` } };

      const startISO = new Date(futureFrom).toISOString();
      const endISO = new Date(futureTo).toISOString();

      await axios.post("http://localhost:8077/agent/availability", {
        agentId,
        available: true,
        startTime: startISO,
        endTime: endISO
      }, axiosConfig);

      const res = await axios.get(`http://localhost:8077/agent/${agentId}/availability`, axiosConfig);
      if (res.data) setAvailability(res.data.available);

      alert("Future availability scheduled successfully!");
      setFutureFrom("");
      setFutureTo("");
    } catch (error) {
      console.error("Error scheduling availability:", error);
      alert("Failed to schedule availability.");
    }
  };

  // -------------------- Respond to a query --------------------
  const respondToQuery = async (id, responseText, isUpdate = false) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return alert("No token found, please login again");

      const query = employeeQueries.find(q => q.id === id);
      if (!query) return alert("Query not found");

      await axios.put(
        `http://localhost:8077/agent/queries/respond/${id}`,
        { response: responseText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEmployeeQueries(prev =>
        prev.map(q =>
          q.id === id
            ? {
                ...q,
                response: responseText,
                status: isUpdate ? q.status : "Resolved",
                allowEdit: isUpdate ? true : true
              }
            : q
        )
      );

      alert(isUpdate ? "Response updated successfully!" : "Response sent successfully!");
    } catch (error) {
      console.error("Failed to send/update response:", error.response?.data || error.message);
      alert("Failed to send/update response");
    }
  };

  // -------------------- Handle response input changes --------------------
  const handleResponseChange = (id, value) => {
    setEmployeeQueries(prev =>
      prev.map(q => q.id === id ? { ...q, response: value } : q)
    );
  };

  // -------------------- Animated Counter Component --------------------
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

  // -------------------- Progress Bar Component --------------------
  const ProgressBar = ({ percentage, color = "success" }) => {
    return (
      <div className="progress" style={{ height: "8px", backgroundColor: "#e9ecef" }}>
        <div
          className={`progress-bar bg-${color}`}
          role="progressbar"
          style={{ width: `${percentage}%`, transition: "width 0.5s ease" }}
          aria-valuenow={percentage}
          aria-valuemin="0"
          aria-valuemax="100"
        ></div>
      </div>
    );
  };

  // -------------------- Render content based on active tab --------------------
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        const pendingQueries = employeeQueries.filter(
          q => q.status === "Pending" || !q.response || q.response.trim() === ""
        );

        const avgResponseTime = employeeQueries.length > 0
          ? (employeeQueries.reduce((acc, q) => {
              if (q.updatedAt && q.createdAt) {
                return acc + (new Date(q.updatedAt) - new Date(q.createdAt));
              }
              return acc;
            }, 0) / employeeQueries.length) / (1000 * 60 * 60)
          : 0;

        const satisfactionRate = employeeQueries.length > 0
          ? Math.round(
              (employeeQueries.filter(q => q.status === "Resolved").length /
                employeeQueries.length) *
                100
            )
          : 0;

        return (
          <div className="w-100">
            {/* Header Section */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
              <div>
                <h2 className="fw-bold text-gradient mb-2">Agent Dashboard Overview</h2>
                <p className="text-muted mb-0">Welcome back, {agentName}. Here's your performance summary.</p>
              </div>
              <div className="d-flex align-items-center gap-2">
                <span className={`badge ${availability ? "bg-success" : "bg-warning"} fs-6 px-3 py-2`}>
                  <i className={`bi ${availability ? "bi-check-circle" : "bi-clock"} me-1`}></i>
                  {availability ? "Available" : "Unavailable"}
                </span>
                <button
                  className={`btn ${availability ? "btn-warning" : "btn-success"} btn-sm rounded-pill shadow-sm`}
                  onClick={toggleAvailability}
                >
                  <i className={`bi ${availability ? "bi-pause" : "bi-play"} me-1`}></i>
                  {availability ? "Set Unavailable" : "Set Available"}
                </button>
              </div>
            </div>

            {/* Metrics Grid */}
            <div className="row g-4 mb-5">
              {/* Pending Queries Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">Pending Queries</h6>
                        <h2 className="fw-bold text-primary mb-0">
                          <AnimatedCounter value={pendingQueries.length} />
                        </h2>
                        <small className="text-muted">
                          <i className="bi bi-exclamation-circle-fill text-warning me-1"></i>
                          Require attention
                        </small>
                      </div>
                      <div className="metric-icon bg-primary bg-opacity-10">
                        <i className="bi bi-question-circle text-primary fs-4"></i>
                      </div>
                    </div>
                    <ProgressBar percentage={(pendingQueries.length / Math.max(employeeQueries.length, 1)) * 100} color="warning" />
                  </div>
                </div>
              </div>

              {/* Assisted Claims Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">Assisted Claims</h6>
                        <h2 className="fw-bold text-success mb-0">
                          <AnimatedCounter value={assistedClaims.length} />
                        </h2>
                        <small className="text-muted">
                          <i className="bi bi-check-circle-fill text-success me-1"></i>
                          Successfully completed
                        </small>
                      </div>
                      <div className="metric-icon bg-success bg-opacity-10">
                        <i className="bi bi-file-earmark-check text-success fs-4"></i>
                      </div>
                    </div>
                    <ProgressBar percentage={(assistedClaims.length / Math.max(employeeQueries.length, 1)) * 100} color="success" />
                  </div>
                </div>
              </div>

              {/* Average Response Time Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">Avg. Response Time</h6>
                        <h2 className="fw-bold text-info mb-0">{avgResponseTime.toFixed(1)}h</h2>
                        <small className="text-muted">
                          <i className="bi bi-clock-fill text-info me-1"></i>
                          Industry avg: 2.5h
                        </small>
                      </div>
                      <div className="metric-icon bg-info bg-opacity-10">
                        <i className="bi bi-speedometer2 text-info fs-4"></i>
                      </div>
                    </div>
                    <ProgressBar percentage={Math.min((avgResponseTime / 2.5) * 100, 100)} color="info" />
                  </div>
                </div>
              </div>

              {/* Satisfaction Rate Card */}
              <div className="col-xl-3 col-md-6">
                <div className="card metric-card border-0 shadow-hover h-100">
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-start">
                      <div>
                        <h6 className="card-subtitle text-muted mb-2">Satisfaction Rate</h6>
                        <h2 className="fw-bold text-warning mb-0">{satisfactionRate}%</h2>
                        <small className="text-muted">
                          <i className="bi bi-star-fill text-warning me-1"></i>
                          Based on resolved queries
                        </small>
                      </div>
                      <div className="metric-icon bg-warning bg-opacity-10">
                        <i className="bi bi-emoji-smile text-warning fs-4"></i>
                      </div>
                    </div>
                    <ProgressBar percentage={satisfactionRate} color="warning" />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Activity Section */}
            <div className="row g-4">
              {/* Recent Employee Queries */}
              <div className="col-xl-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h3 className="fw-bold text-gradient mb-0">Employee Queries</h3>
                      <button 
                        className="btn btn-outline-primary btn-sm rounded-pill"
                        onClick={() => setActiveTab("queries")}
                      >
                        View All <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    <div className="activity-timeline">
                      {employeeQueries.slice(0, 5).map((query, index) => {
                        const isAnswered = query.response && query.response.trim() !== "";
                        return (
                          <div key={query.id} className="activity-item d-flex align-items-start mb-3">
                            <div className="activity-indicator">
                              <div className={`indicator-dot ${isAnswered ? 'bg-success' : 'bg-warning'}`}></div>
                              {index < 4 && <div className="indicator-line"></div>}
                            </div>
                            <div className="activity-content flex-grow-1 ms-3">
                              <div className="d-flex justify-content-between align-items-start">
                                <h6 className="mb-1 fw-semibold">{query.employee}</h6>
                                <span className={`badge ${isAnswered ? 'bg-success' : 'bg-warning'} fs-7`}>
                                  {isAnswered ? 'Resolved' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-muted mb-1 small">{query.query}</p>
                              <small className="text-muted">
                                <i className="bi bi-clock me-1"></i>
                                {new Date(query.createdAt).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        );
                      })}
                      {employeeQueries.length === 0 && (
                        <div className="text-center py-4">
                          <i className="bi bi-inbox display-4 text-muted"></i>
                          <p className="text-muted mt-2">No queries assigned yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Recently Assisted Claims */}
              <div className="col-xl-6">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-header bg-transparent border-0 pb-0">
                    <div className="d-flex justify-content-between align-items-center">
                      <h3 className="fw-bold text-gradient mb-0">Assisted Claims</h3>
                      <button 
                        className="btn btn-outline-success btn-sm rounded-pill"
                        onClick={() => setActiveTab("claims")}
                      >
                        View All <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    </div>
                  </div>
                  <div className="card-body">
                    {assistedClaims.slice(0, 5).map((claim) => (
                      <div key={claim.id} className="claim-item border-bottom pb-3 mb-3 last:border-0 last:mb-0 last:pb-0">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="mb-0 fw-semibold text-truncate">{claim.employee}</h6>
                          <span className={`badge ${claim.status === 'Approved' ? 'bg-success' : 'bg-warning'} fs-7`}>
                            {claim.status}
                          </span>
                        </div>
                        <div className="d-flex justify-content-between align-items-center">
                          <div>
                            <small className="text-muted d-block">
                              <i className="bi bi-tag me-1"></i>
                              {claim.type}
                            </small>
                            <small className="text-muted">
                              <i className="bi bi-file-text me-1"></i>
                              {claim.policyName}
                            </small>
                          </div>
                          <small className="text-muted text-end">
                            <i className="bi bi-calendar me-1"></i>
                            {new Date(claim.date).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    ))}
                    {assistedClaims.length === 0 && (
                      <div className="text-center py-4">
                        <i className="bi bi-file-earmark-check display-4 text-muted"></i>
                        <p className="text-muted mt-2">No claims assisted yet</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case "queries":
        return (
          <AgentQueries
            availability={availability}
            filter={filter}
            setFilter={setFilter}
            employeeQueries={employeeQueries}
            handleResponseChange={handleResponseChange}
            respondToQuery={respondToQuery}
            axios={axios}
            setEmployeeQueries={setEmployeeQueries}
          />
        );

      case "claims":
        return <AgentClaims assistedClaims={assistedClaims} />;

      case "availability":
        return (
          <AgentAvailability
            agentName={agentName}
            availability={availability}
            toggleAvailability={toggleAvailability}
            futureFrom={futureFrom}
            setFutureFrom={setFutureFrom}
            futureTo={futureTo}
            setFutureTo={setFutureTo}
            scheduleFutureAvailability={scheduleFutureAvailability}
          />
        );

      case "reports":
        return (
          <AgentReports
            assistedClaims={assistedClaims}
            employeeQueries={employeeQueries}
            agentData={{ agentId, agentName }}
          />
        );

      default:
        return <h4>Welcome, {localStorage.getItem("agentName") || "Agent"}</h4>;
    }
  };

  return (
    <div className="agent-dashboard enterprise-dashboard">
      {/* Header */}
      <header className="dashboard-header text-white py-3 px-4 shadow-lg w-100">
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6 d-flex align-items-center">
              <button 
                className="btn btn-light btn-sm me-3 d-md-none"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                <i className="bi bi-list"></i>
              </button>
              <div className="d-flex align-items-center gap-3">
                <div className="brand-logo me-3">
                  <i className="bi bi-shield-check fs-2 text-white"></i>
                </div>
                <div>
                  <h2 className="mb-0 fw-bold">InsurAI Agent Portal</h2>
                  <small className="text-light opacity-75">Assistance Suite v2.0</small>
                </div>
              </div>
            </div>

            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <div className="d-flex align-items-center gap-4">
                <div className="text-end">
                  <div className="fw-bold">{localStorage.getItem("agentName") || "Agent"}</div>
                  <small className="text-light opacity-75">Insurance Agent</small>
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
              { id: "queries", icon: "bi-question-circle", label: "Employee Queries" },
              { id: "claims", icon: "bi-file-earmark-check", label: "Assisted Claims" },
              { id: "availability", icon: "bi-calendar-check", label: "Availability Settings" },
              { id: "reports", icon: "bi-graph-up", label: "Agent Performance Reports" },
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
                <i className={`${item.icon} me-3 fs-5`}></i>
                {item.label}
                {item.id === "queries" && employeeQueries.filter(q => q.status === "Pending").length > 0 && (
                  <span className="badge bg-danger ms-auto">
                    {employeeQueries.filter(q => q.status === "Pending").length}
                  </span>
                )}
              </a>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer mt-auto p-3 small text-muted border-top">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-success rounded-circle p-1 me-2">
                <i className="bi bi-circle-fill text-success" style={{fontSize: '8px'}}></i>
              </div>
              <span>System Online</span>
            </div>
            <div>v2.0.1 • Agent Suite</div>
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
        .agent-dashboard .dashboard-header {
          background: linear-gradient(135deg, #1e3a5f 100%);
        }

        /* Sidebar */
        .dashboard-sidebar {
          width: 250px;
          min-height: 100vh;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .sidebar-link {
          border-radius: 8px;
          margin-bottom: 5px;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          color: #495057;
          transition: all 0.3s ease;
        }

        .sidebar-link:hover {
          background-color: #ffffff;
          color: #1e3a5f;
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .sidebar-link.active {
          background: linear-gradient(135deg, #1e3a5f 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(8, 127, 91, 0.3);
        }

        .sidebar-footer {
          color: #495057;
        }

        /* Enhanced Cards with Theme Colors */
        .metric-card {
          transition: all 0.3s ease;
          border: none;
        }

        .metric-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        /* Progress Bars with Theme Colors */
        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
        }

        .progress-bar {
          border-radius: 10px;
        }

        .bg-primary {
          background: linear-gradient(135deg, #1e3a5f 100%) !important;
        }

        /* Buttons with Theme Colors */
        .btn-primary {
          background: linear-gradient(135deg,  #1e3a5f 100%);
          border: none;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #1e3a5f 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(8, 127, 91, 0.4);
        }

        .btn-outline-primary {
          color: #1e3a5f;
          border-color: #1e3a5f;
        }

        .btn-outline-primary:hover {
          background: linear-gradient(135deg,  #1e3a5f 100%);
          border-color: #1e3a5f;
          transform: translateY(-2px);
        }

        /* Badges */
        .badge {
          font-size: 0.7em;
        }

        /* Charts and Graphs */
        .chart-container {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        /* Table Styling */
        .table-theme {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .table-theme thead {
          background: linear-gradient(135deg,#1e3a5f 100%);
          color: white;
        }

        .table-theme th {
          border: none;
          padding: 15px;
          font-weight: 600;
        }

        .table-theme td {
          padding: 12px 15px;
          border-color: #dee2e6;
        }

        /* Form Controls */
        .form-control:focus {
          border-color: #1e3a5f;
          box-shadow: 0 0 0 0.2rem rgba(8, 127, 91, 0.25);
        }

        /* Alert Styling */
        .alert-success {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          border: 1px solid light grey;
          color: #1e3a5f;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed;
            top: 76px;
            left: -280px;
            height: calc(100vh - 76px);
            z-index: 1000;
            transition: left 0.3s ease;
          }
          .dashboard-sidebar.show {
            left: 0;
          }
          
          .metric-card {
            margin-bottom: 15px;
          }
          
          .dashboard-content-wrapper {
            padding: 15px;
          }
        }

        /* Animation for smooth transitions */
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Text gradient for headers */
        .text-gradient {
          background: linear-gradient(135deg,  #1e3a5f 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
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
          height: 100%;
          background-color: #e9ecef;
          position: absolute;
          top: 12px;
        }

        .shadow-hover {
          transition: all 0.3s ease;
        }

        .shadow-hover:hover {
          box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}