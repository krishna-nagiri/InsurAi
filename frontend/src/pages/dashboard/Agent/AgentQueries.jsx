import React, { useState, useMemo } from "react";

export default function AgentQueries({ 
  availability, 
  filter, 
  setFilter, 
  employeeQueries, 
  handleResponseChange, 
  respondToQuery, 
  axios, 
  setEmployeeQueries 
}) {
  const [activeChart, setActiveChart] = useState("status");
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [quickResponse, setQuickResponse] = useState("");

  // Enhanced statistics with chart data
  const queryStats = useMemo(() => {
    const total = employeeQueries.length;
    const pending = employeeQueries.filter(q => q.status === "Pending").length;
    const resolvedQueries = employeeQueries.filter(q => q.status === "Resolved");
    const resolved = resolvedQueries.length;
    const responseRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    
    // Data for charts
    const queriesByDay = {};
    const queriesByType = {};
    const responseTimeData = [];

    employeeQueries.forEach(query => {
      // Count by day
      if (query.createdAt) {
        const date = new Date(query.createdAt);
        const day = date.toLocaleDateString('en-US', { weekday: 'short' });
        queriesByDay[day] = (queriesByDay[day] || 0) + 1;
      }

      // Count by type
      const type = query.claimType || "General";
      queriesByType[type] = (queriesByType[type] || 0) + 1;

      // Response time calculation for resolved queries
      if (query.status === "Resolved" && (query.resolvedAt || query.updatedAt)) {
        const created = new Date(query.createdAt);
        const resolved = new Date(query.resolvedAt || query.updatedAt);
        if (!isNaN(created) && !isNaN(resolved)) {
          const hours = (resolved - created) / (1000 * 60 * 60);
          responseTimeData.push(hours);
        }
      }
    });

    // Compute average response time correctly in hours
    const avgResponseTime =
      responseTimeData.length > 0
        ? responseTimeData.reduce((a, b) => a + b, 0) / responseTimeData.length
        : 0;

    return { 
      total, 
      pending, 
      resolved, 
      responseRate,
      avgResponseTime,
      queriesByDay,
      queriesByType
    };
  }, [employeeQueries]);

  // Quick respond function
  const handleQuickRespond = (queryId) => {
    if (!quickResponse.trim()) {
      alert("Please enter a response");
      return;
    }
    handleResponseChange(queryId, quickResponse);
    respondToQuery(queryId, quickResponse);
    setQuickResponse("");
  };

  // Toggle availability
  const toggleAvailability = () => {
    alert(`You are now ${!availability ? 'available' : 'unavailable'} for queries`);
  };

  // Enhanced Statistics Cards with Theme Colors
  const renderStatsCards = () => (
    <div className="row mb-4">
      {[
        { 
          title: "Total Queries", 
          value: queryStats.total, 
          icon: "bi-chat-left-text", 
          color: "primary",
          description: "All time queries"
        },
        { 
          title: "Pending", 
          value: queryStats.pending, 
          icon: "bi-clock", 
          color: "warning",
          description: "Require attention"
        },
        { 
          title: "Resolved", 
          value: queryStats.resolved, 
          icon: "bi-check-circle", 
          color: "success",
          description: "Successfully closed"
        },
        { 
          title: "Avg Response", 
          value: `${queryStats.avgResponseTime.toFixed(1)}h`, 
          icon: "bi-graph-up", 
          color: "info",
          description: "Average resolution time"
        },
      ].map((stat, idx) => (
        <div key={idx} className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-muted text-uppercase mb-1">
                    {stat.title}
                  </div>
                  <div className="h4 mb-0 fw-bold text-dark">{stat.value}</div>
                  <small className="text-muted">{stat.description}</small>
                </div>
                <div className="col-auto">
                  <div className={`metric-icon bg-${stat.color} bg-opacity-10`}>
                    <i className={`bi ${stat.icon} text-${stat.color} fs-4`}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Interactive Charts Section with Theme Colors
  const renderCharts = () => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0 py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="fw-bold text-dark mb-0">Query Analytics</h6>
          <div className="btn-group btn-group-sm">
            {[
              { key: "status", label: "Status" },
              { key: "timeline", label: "Timeline" },
              { key: "types", label: "Types" }
            ].map(chart => (
              <button
                key={chart.key}
                className={`btn ${activeChart === chart.key ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveChart(chart.key)}
              >
                {chart.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Status Chart */}
        {activeChart === "status" && (
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex justify-content-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative"
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    background: `conic-gradient(
                      #10B981 0% ${(queryStats.resolved / Math.max(queryStats.total, 1)) * 100}%,
                      #F59E0B 0% 100%
                    )`
                  }}
                >
                  <div className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow-sm"
                       style={{ width: '150px', height: '150px' }}>
                    <div className="text-center">
                      <div className="h4 mb-0 fw-bold text-dark">
                        {queryStats.responseRate}%
                      </div>
                      <small className="text-muted">Resolved</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <div className="d-flex align-items-center mb-2">
                  <div className="bg-success rounded me-2" style={{width: '12px', height: '12px'}}></div>
                  <span className="flex-grow-1 text-dark">Resolved</span>
                  <span className="fw-bold text-dark">{queryStats.resolved}</span>
                  <span className="text-muted ms-2">
                    ({queryStats.total > 0 ? Math.round((queryStats.resolved / queryStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="d-flex align-items-center">
                  <div className="bg-warning rounded me-2" style={{width: '12px', height: '12px'}}></div>
                  <span className="flex-grow-1 text-dark">Pending</span>
                  <span className="fw-bold text-dark">{queryStats.pending}</span>
                  <span className="text-muted ms-2">
                    ({queryStats.total > 0 ? Math.round((queryStats.pending / queryStats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timeline Chart */}
        {activeChart === "timeline" && (
          <div>
            <h6 className="text-center mb-4 text-dark">Queries by Day</h6>
            <div className="d-flex align-items-end justify-content-between" style={{height: '150px'}}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const count = queryStats.queriesByDay[day] || 0;
                const maxCount = Math.max(...Object.values(queryStats.queriesByDay), 1);
                const height = (count / maxCount) * 100;
                
                return (
                  <div key={day} className="text-center mx-1">
                    <div 
                      className="bg-primary rounded-top mx-auto"
                      style={{ 
                        height: `${height}px`, 
                        width: '25px',
                        opacity: 0.8,
                        background: 'linear-gradient(135deg, #0f0f1a 0%, #206c95ff 100%) !important'
                      }}
                    ></div>
                    <div className="small text-muted mt-1">{day}</div>
                    <div className="small fw-bold text-dark">{count}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Types Chart */}
        {activeChart === "types" && (
          <div>
            <h6 className="text-center mb-4 text-dark">Queries by Type</h6>
            <div className="row">
              {Object.entries(queryStats.queriesByType).map(([type, count], index) => {
                const percentage = (count / Math.max(queryStats.total, 1)) * 100;
                const colors = ['primary', 'success', 'warning', 'info', 'secondary'];
                const color = colors[index % colors.length];
                
                return (
                  <div key={type} className="col-md-6 mb-3">
                    <div className="d-flex align-items-center">
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between mb-1">
                          <span className="fw-semibold text-dark">{type}</span>
                          <span className="fw-bold text-dark">{count}</span>
                        </div>
                        <div className="progress" style={{height: '8px'}}>
                          <div 
                            className={`progress-bar bg-${color}`}
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                        <div className="text-end">
                          <small className="text-muted">{percentage.toFixed(1)}%</small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Quick Response Section
  const renderQuickResponse = () => (
    <div className="card border-0 shadow-sm mb-4">
      <div className="card-header bg-white border-0">
        <h6 className="fw-bold text-dark mb-0">Quick Response</h6>
      </div>
      <div className="card-body">
        <div className="row">
          <div className="col-md-8">
            <input
              type="text"
              className="form-control"
              placeholder="Type a quick response that can be used for multiple queries..."
              value={quickResponse}
              onChange={(e) => setQuickResponse(e.target.value)}
            />
          </div>
          <div className="col-md-4">
            <button 
              className="btn btn-primary w-100"
              onClick={() => {
                if (quickResponse.trim()) {
                  // Apply to all pending queries
                  employeeQueries
                    .filter(q => q.status === "Pending")
                    .forEach(query => {
                      handleResponseChange(query.id, quickResponse);
                    });
                  alert(`Quick response applied to ${employeeQueries.filter(q => q.status === "Pending").length} pending queries`);
                }
              }}
            >
              Apply to All Pending
            </button>
          </div>
        </div>
        <div className="mt-2">
          <small className="text-muted">
            Use this to quickly respond to multiple similar queries
          </small>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4">
      {/* Header with Enhanced Availability Toggle */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="mb-2" style={{ fontWeight: '700', background: 'linear-gradient(to right, #010f0c, #087f5b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Employee Queries</h3>

          <p className="text-muted mb-0">Manage and respond to employee inquiries</p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <span className="text-muted">Status:</span>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              checked={availability}
              onChange={toggleAvailability}
              style={{transform: 'scale(1.2)'}}
            />
          </div>
          <span className={`badge ${availability ? "bg-success" : "bg-warning"}`}>
            {availability ? "Available" : "Unavailable"}
          </span>
        </div>
      </div>

      {/* Enhanced Components */}
      {renderStatsCards()}
      {renderCharts()}
      {renderQuickResponse()}

      {/* Filters */}
      <div className="card border-0 shadow-sm mb-4">
        <div className="card-body">
          <div className="d-flex align-items-center gap-3">
            <span className="fw-semibold text-muted">Filter:</span>
            <div className="btn-group">
              {[
                { label: "All", value: "All", color: "primary" },
                { label: "Pending", value: "Pending", color: "warning" },
                { label: "Resolved", value: "Resolved", color: "success" }
              ].map(filterBtn => (
                <button
                  key={filterBtn.value}
                  className={`btn btn-sm ${filter === filterBtn.value ? `btn-${filterBtn.color}` : `btn-outline-${filterBtn.color}`}`}
                  onClick={() => setFilter(filterBtn.value)}
                >
                  {filterBtn.label} 
                  <span className="badge bg-dark ms-2">
                    {employeeQueries.filter(q => filterBtn.value === "All" ? true : q.status === filterBtn.value).length}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Table with All Functionality */}
      <div className="card border-0 shadow-sm">
        <div className="card-header bg-white border-0 py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="fw-bold text-dark mb-0">
              Query Management
              <span className="badge bg-primary ms-2">{employeeQueries.filter(q => filter === "All" ? true : q.status === filter).length}</span>
            </h6>
            <div className="text-muted small">
              {queryStats.pending} pending queries • {queryStats.avgResponseTime.toFixed(1)}h avg response
            </div>
          </div>
        </div>

        <div className="card-body p-0">
          {employeeQueries.filter(q => (filter === "All" ? true : q.status === filter)).length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-chat-left-text display-4 text-muted mb-3"></i>
              <h5 className="text-muted">No queries found</h5>
              <p className="text-muted mb-4">
                {employeeQueries.length === 0
                  ? "No employee queries have been submitted yet."
                  : "No queries match your current filter."}
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="fw-semibold text-dark">Employee</th>
                    <th className="fw-semibold text-dark">Query</th>
                    <th className="fw-semibold text-dark">Policy</th>
                    <th className="fw-semibold text-dark">Type</th>
                    <th className="fw-semibold text-dark">Date</th>
                    <th className="fw-semibold text-dark">Status</th>
                    <th className="fw-semibold text-dark">Response</th>
                    <th className="fw-semibold text-dark">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employeeQueries
                    .filter(q => (filter === "All" ? true : q.status === filter))
                    .map(query => (
                      <tr key={query.id}>
                        <td>
                          <div className="d-flex align-items-center">
                            <div className="bg-primary rounded-circle text-white d-flex align-items-center justify-content-center me-2" 
                                 style={{width: '32px', height: '32px', fontSize: '0.8rem'}}>
                              {query.employee ? query.employee.charAt(0).toUpperCase() : 'E'}
                            </div>
                            <div>
                              <div className="fw-semibold text-dark">{query.employee || `Employee ${query.employeeId}`}</div>
                              <small className="text-muted">ID: {query.employeeId}</small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="text-truncate text-dark" style={{maxWidth: '200px'}} title={query.query}>
                            {query.query}
                          </div>
                        </td>
                        <td className="text-dark">{query.policyName || "-"}</td>
                        <td className="text-dark">{query.claimType || "-"}</td>
                        <td>
                          <small className="text-muted">
                            {query.createdAt ? new Date(query.createdAt).toLocaleDateString() : "Invalid Date"}
                          </small>
                        </td>
                        <td>
                          <span className={`badge ${
                            query.status === "Pending" ? "bg-warning" : 
                            query.status === "Resolved" ? "bg-success" : "bg-info"
                          }`}>
                            {query.status}
                          </span>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              placeholder="Type response..."
                              value={query.response || ""}
                              onChange={e => handleResponseChange(query.id, e.target.value)}
                              disabled={query.status === "Resolved" && !query.isEditing}
                            />
                            {quickResponse && (
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => handleResponseChange(query.id, quickResponse)}
                                title="Use quick response"
                              >
                                <i className="bi bi-lightning"></i>
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex gap-2">
                            {query.status === "Pending" && (
                              <>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    if (!query.response || query.response.trim() === "") {
                                      alert("Please type a response before submitting");
                                      return;
                                    }
                                    respondToQuery(query.id, query.response);
                                  }}
                                >
                                  <i className="bi bi-send me-1"></i>Send
                                </button>
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={async () => {
                                    try {
                                      await axios.put(
                                        `http://localhost:8077/agent/queries/respond/${query.id}`,
                                        { response: query.response || "Resolved" },
                                        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
                                      );
                                      setEmployeeQueries(prev =>
                                        prev.map(q =>
                                          q.id === query.id
                                            ? { ...q, status: "Resolved", isEditing: false }
                                            : q
                                        )
                                      );
                                    } catch (err) {
                                      console.error("Failed to resolve query:", err);
                                    }
                                  }}
                                >
                                  <i className="bi bi-check me-1"></i>Resolve
                                </button>
                              </>
                            )}

                            {query.status === "Resolved" && (
                              <button
                                className={`btn btn-sm ${query.isEditing ? "btn-success" : "btn-outline-primary"}`}
                                onClick={() => {
                                  if (query.isEditing) {
                                    respondToQuery(query.id, query.response, true);
                                    setEmployeeQueries(prev =>
                                      prev.map(q =>
                                        q.id === query.id ? { ...q, isEditing: false } : q
                                      )
                                    );
                                  } else {
                                    setEmployeeQueries(prev =>
                                      prev.map(q =>
                                        q.id === query.id ? { ...q, isEditing: true } : q
                                      )
                                    );
                                  }
                                }}
                              >
                                <i className={`bi ${query.isEditing ? "bi-check-lg" : "bi-pencil"} me-1`}></i>
                                {query.isEditing ? "Update" : "Edit"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Global Styles for Theme Consistency */}
      <style>{`
        .text-gradient {
          background: linear-gradient(135deg, #0f0f1a 0%, #206c95ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .dashboard-card {
          transition: all 0.3s ease;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
        }

        .dashboard-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.1) !important;
        }

        .metric-icon {
          width: 50px;
          height: 50px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .btn-primary {
          background: linear-gradient(135deg, #0f0f1a 0%, #206c95ff 100%);
          border: none;
          border-radius: 8px;
          font-weight: 500;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #0a0a14 0%, #1a5a7a 100%);
          transform: translateY(-1px);
          box-shadow: 0 4px 15px rgba(32, 108, 149, 0.3);
        }

        .btn-outline-primary {
          border: 2px solid #206c95ff;
          color: #206c95ff;
          border-radius: 8px;
          font-weight: 500;
        }

        .btn-outline-primary:hover {
          background: linear-gradient(135deg, #0f0f1a 0%, #206c95ff 100%);
          border-color: #206c95ff;
          transform: translateY(-1px);
        }

        .badge.bg-primary {
          background: linear-gradient(135deg, #0f0f1a 0%, #206c95ff 100%) !important;
        }

        .table th {
          font-weight: 600;
          font-size: 0.875rem;
          text-transform: none;
          letter-spacing: normal;
        }

        .table td {
          vertical-align: middle;
          font-size: 0.875rem;
        }

        .card {
          border-radius: 12px;
          overflow: hidden;
        }

        .card-header {
          font-weight: 600;
          font-size: 0.95rem;
        }

        .progress {
          border-radius: 6px;
          overflow: hidden;
        }

        .progress-bar {
          border-radius: 6px;
        }

        .form-control {
          border-radius: 8px;
          border: 1px solid #d1d5db;
          font-size: 0.875rem;
        }

        .form-control:focus {
          border-color: #206c95ff;
          box-shadow: 0 0 0 0.2rem rgba(32, 108, 149, 0.1);
        }

        /* Font consistency */
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
          font-weight: 600;
          line-height: 1.3;
        }

        .fw-bold {
          font-weight: 600 !important;
        }

        .fw-semibold {
          font-weight: 500 !important;
        }
      `}</style>
    </div>
  );
}