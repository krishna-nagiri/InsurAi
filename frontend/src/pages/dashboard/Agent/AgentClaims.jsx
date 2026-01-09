import React, { useState, useMemo } from "react";

export default function AgentClaims({ assistedClaims = [] }) {
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [activeChart, setActiveChart] = useState("status");

  // Modern color theme
  const theme = {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    success: "#10B981",
    info: "#06B6D4",
    warning: "#F59E0B",
    danger: "#EF4444",
    light: "#F8FAFC",
    dark: "#1E293B",
    gray: {
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A"
    }
  };

  // Statistics with enhanced data for charts
  const claimsStats = useMemo(() => {
    const total = assistedClaims.length;
    const approved = assistedClaims.filter(claim => claim.status === "Approved").length;
    const pending = assistedClaims.filter(claim => claim.status === "Pending").length;
    const rejected = assistedClaims.filter(claim => claim.status === "Rejected").length;
    const successRate = total > 0 ? Math.round((approved / total) * 100) : 0;
    
    // Enhanced data for charts
    const claimTypes = {};
    const monthlyData = {};
    
    assistedClaims.forEach(claim => {
      // Count by type
      const type = claim.type || "Other";
      claimTypes[type] = (claimTypes[type] || 0) + 1;
      
      // Count by month for timeline
      if (claim.date) {
        const date = new Date(claim.date);
        const monthYear = `${date.getMonth()+1}/${date.getFullYear()}`;
        monthlyData[monthYear] = (monthlyData[monthYear] || 0) + 1;
      }
    });
    
    return { 
      total, 
      approved, 
      pending, 
      rejected, 
      successRate,
      claimTypes,
      monthlyData
    };
  }, [assistedClaims]);

  // Helper: safely parse date
  const parseDate = (dateString) => {
    if (!dateString) return null;
    const timestamp = Date.parse(dateString);
    return isNaN(timestamp) ? null : new Date(timestamp);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = parseDate(dateString);
    if (!date) return dateString;
    
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "success";
      case "pending": return "warning";
      case "rejected": return "danger";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "approved": return "bi-check-circle-fill";
      case "pending": return "bi-clock-fill";
      case "rejected": return "bi-x-circle-fill";
      default: return "bi-question-circle";
    }
  };

  // Filtered and sorted claims
  const filteredAndSortedClaims = useMemo(() => {
    let filtered = assistedClaims.filter(claim => {
      const matchesSearch =
        claim.employee?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.policyName?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus =
        statusFilter === "all" || claim.status?.toLowerCase() === statusFilter.toLowerCase();
      
      return matchesSearch && matchesStatus;
    });

    const getTime = (claim) => {
      const date = parseDate(claim.date || claim.createdAt);
      return date ? date.getTime() : 0;
    };

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return getTime(b) - getTime(a);
        case "oldest":
          return getTime(a) - getTime(b);
        case "employee":
          return (a.employee || "").localeCompare(b.employee || "");
        default:
          return 0;
      }
    });

    return filtered;
  }, [assistedClaims, searchTerm, statusFilter, sortBy]);

  // Enhanced Statistics Cards
  const renderStatsCards = () => (
    <div className="row mb-4">
      {[
        { 
          title: "Total Assisted", 
          value: claimsStats.total, 
          icon: "bi-wallet2", 
          color: "primary",
          trend: "+12%",
          trendUp: true
        },
        { 
          title: "Approved", 
          value: claimsStats.approved, 
          icon: "bi-check-circle", 
          color: "success",
          trend: "+5%",
          trendUp: true
        },
        { 
          title: "Pending", 
          value: claimsStats.pending, 
          icon: "bi-clock-history", 
          color: "warning",
          trend: "-3%",
          trendUp: false
        },
        { 
          title: "Success Rate", 
          value: `${claimsStats.successRate}%`, 
          icon: "bi-graph-up", 
          color: "info",
          trend: "+2%",
          trendUp: true
        },
      ].map((stat, idx) => (
        <div key={idx} className="col-xl-3 col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100" style={{ 
            borderLeft: `4px solid ${theme[stat.color]}`,
            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease'
          }}>
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: theme[stat.color] }}>
                    {stat.title}
                  </div>
                  <div className="h4 mb-0 font-weight-bold" style={{ color: theme.dark }}>{stat.value}</div>
                  <div className="mt-2">
                    <span className={`badge ${stat.trendUp ? 'bg-success' : 'bg-danger'} me-1`}>
                      <i className={`bi ${stat.trendUp ? 'bi-arrow-up' : 'bi-arrow-down'} me-1`}></i>
                      {stat.trend}
                    </span>
                    <small className="text-muted">from last month</small>
                  </div>
                </div>
                <div className="col-auto">
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                    style={{ 
                      width: '50px', 
                      height: '50px', 
                      backgroundColor: `${theme[stat.color]}15`,
                      border: `2px solid ${theme[stat.color]}20`
                    }}
                  >
                    <i 
                      className={`bi ${stat.icon}`} 
                      style={{ color: theme[stat.color], fontSize: '1.5rem' }}
                    ></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Enhanced Charts Section
  const renderCharts = () => (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="font-weight-bold mb-0" style={{ color: theme.dark }}>Claims Analytics</h6>
          <div className="btn-group btn-group-sm">
            <button 
              className={`btn ${activeChart === "status" ? "btn-primary" : "btn-outline-primary"} rounded-pill px-3`}
              onClick={() => setActiveChart("status")}
            >
              Status
            </button>
            <button 
              className={`btn ${activeChart === "type" ? "btn-primary" : "btn-outline-primary"} rounded-pill px-3`}
              onClick={() => setActiveChart("type")}
            >
              Type
            </button>
            <button 
              className={`btn ${activeChart === "timeline" ? "btn-primary" : "btn-outline-primary"} rounded-pill px-3`}
              onClick={() => setActiveChart("timeline")}
            >
              Timeline
            </button>
          </div>
        </div>
      </div>
      <div className="card-body">
        {activeChart === "status" && (
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex justify-content-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative shadow-sm"
                  style={{ 
                    width: '200px', 
                    height: '200px', 
                    background: `conic-gradient(
                      ${theme.success} 0% ${(claimsStats.approved / claimsStats.total) * 100}%,
                      ${theme.warning} 0% ${((claimsStats.approved + claimsStats.pending) / claimsStats.total) * 100}%,
                      ${theme.danger} 0% 100%
                    )`
                  }}
                >
                  <div 
                    className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow"
                    style={{ width: '150px', height: '150px' }}
                  >
                    <div className="text-center">
                      <div className="h4 mb-0 font-weight-bold" style={{ color: theme.dark }}>
                        {claimsStats.total}
                      </div>
                      <small className="text-muted">Total Claims</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <div className="d-flex align-items-center mb-3 p-2 rounded" style={{ backgroundColor: theme.gray[50] }}>
                  <div 
                    className="rounded me-3 shadow-sm"
                    style={{ width: '16px', height: '16px', backgroundColor: theme.success }}
                  ></div>
                  <span className="flex-grow-1 fw-semibold" style={{ color: theme.dark }}>Approved</span>
                  <span className="fw-bold" style={{ color: theme.dark }}>{claimsStats.approved}</span>
                  <span className="text-muted ms-2">
                    ({claimsStats.total > 0 ? Math.round((claimsStats.approved / claimsStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="d-flex align-items-center mb-3 p-2 rounded" style={{ backgroundColor: theme.gray[50] }}>
                  <div 
                    className="rounded me-3 shadow-sm"
                    style={{ width: '16px', height: '16px', backgroundColor: theme.warning }}
                  ></div>
                  <span className="flex-grow-1 fw-semibold" style={{ color: theme.dark }}>Pending</span>
                  <span className="fw-bold" style={{ color: theme.dark }}>{claimsStats.pending}</span>
                  <span className="text-muted ms-2">
                    ({claimsStats.total > 0 ? Math.round((claimsStats.pending / claimsStats.total) * 100) : 0}%)
                  </span>
                </div>
                <div className="d-flex align-items-center p-2 rounded" style={{ backgroundColor: theme.gray[50] }}>
                  <div 
                    className="rounded me-3 shadow-sm"
                    style={{ width: '16px', height: '16px', backgroundColor: theme.danger }}
                  ></div>
                  <span className="flex-grow-1 fw-semibold" style={{ color: theme.dark }}>Rejected</span>
                  <span className="fw-bold" style={{ color: theme.dark }}>{claimsStats.rejected}</span>
                  <span className="text-muted ms-2">
                    ({claimsStats.total > 0 ? Math.round((claimsStats.rejected / claimsStats.total) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeChart === "type" && (
          <div>
            <div className="row">
              {Object.entries(claimsStats.claimTypes).map(([type, count], index) => {
                const percentage = (count / claimsStats.total) * 100;
                const colors = [theme.primary, theme.info, theme.success, theme.warning, theme.secondary];
                const color = colors[index % colors.length];
                
                return (
                  <div key={type} className="col-md-6 mb-3">
                    <div className="d-flex align-items-center p-3 rounded" style={{ backgroundColor: theme.gray[50] }}>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold" style={{ color: theme.dark }}>{type}</span>
                          <span className="fw-bold" style={{ color: theme.dark }}>{count}</span>
                        </div>
                        <div className="progress" style={{ height: '8px', backgroundColor: theme.gray[200] }}>
                          <div 
                            className="progress-bar rounded" 
                            role="progressbar" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                            aria-valuenow={percentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <div className="text-end mt-1">
                          <small className="text-muted">{percentage.toFixed(1)}%</small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {Object.keys(claimsStats.claimTypes).length === 0 && (
              <div className="text-center py-4">
                <i className="bi bi-pie-chart display-4" style={{ color: theme.gray[300] }}></i>
                <p className="mt-2 text-muted">No claim type data available</p>
              </div>
            )}
          </div>
        )}
        
        {activeChart === "timeline" && (
          <div>
            <div className="text-center mb-4">
              <h6 style={{ color: theme.dark }}>Claims Over Time</h6>
            </div>
            <div className="d-flex align-items-end justify-content-between" style={{ height: '200px', padding: '0 20px' }}>
              {Object.entries(claimsStats.monthlyData).map(([month, count], index) => {
                const maxCount = Math.max(...Object.values(claimsStats.monthlyData));
                const height = maxCount > 0 ? (count / maxCount) * 150 : 0;
                
                return (
                  <div key={month} className="flex-fill text-center mx-2">
                    <div 
                      className="rounded-top mx-auto transition-all"
                      style={{ 
                        height: `${height}px`, 
                        width: '35px',
                        backgroundColor: theme.primary,
                        opacity: 0.8,
                        transition: 'height 0.3s ease'
                      }}
                    ></div>
                    <div className="small text-muted mt-2 fw-semibold">{month}</div>
                    <div className="small fw-bold" style={{ color: theme.dark }}>{count}</div>
                  </div>
                );
              })}
            </div>
            {Object.keys(claimsStats.monthlyData).length === 0 && (
              <div className="text-center py-4">
                <i className="bi bi-bar-chart display-4" style={{ color: theme.gray[300] }}></i>
                <p className="mt-2 text-muted">No timeline data available</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced Filters
  const renderFilters = () => (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-0">
        <h6 className="font-weight-bold mb-0" style={{ color: theme.dark }}>Filters & Search</h6>
      </div>
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
            <div className="input-group shadow-sm">
              <span 
                className="input-group-text border-end-0 bg-white"
                style={{ borderColor: theme.gray[300] }}
              >
                <i className="bi bi-search" style={{ color: theme.gray[600] }}></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search by employee, type, or policy..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ 
                  backgroundColor: 'white',
                  borderColor: theme.gray[300]
                }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <select
              className="form-select shadow-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ 
                backgroundColor: 'white',
                borderColor: theme.gray[300]
              }}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              className="form-select shadow-sm"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ 
                backgroundColor: 'white',
                borderColor: theme.gray[300]
              }}
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="employee">Employee Name</option>
            </select>
          </div>
        </div>
        <div className="row mt-3">
          <div className="col-12">
            <button
              className="btn btn-outline-secondary btn-sm rounded-pill px-3 shadow-sm"
              onClick={() => {
                setSearchTerm("");
                setStatusFilter("all");
                setSortBy("newest");
              }}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> Reset Filters
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Enhanced Table
  const renderTable = () => (
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-3 border-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="font-weight-bold mb-0" style={{ color: theme.dark }}>
            Assisted Claims
            <span 
              className="badge ms-2 shadow-sm"
              style={{ 
                backgroundColor: theme.primary,
                fontSize: '0.7rem'
              }}
            >{filteredAndSortedClaims.length}</span>
          </h6>
          <div className="text-muted small">
            Showing {filteredAndSortedClaims.length} of {assistedClaims.length} claims
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        {filteredAndSortedClaims.length === 0 ? (
          <div className="text-center py-5">
            <i 
              className="bi bi-wallet2 display-4 mb-3" 
              style={{ color: theme.gray[300] }}
            ></i>
            <h5 style={{ color: theme.gray[500] }}>No claims found</h5>
            <p style={{ color: theme.gray[600] }} className="mb-4">
              {assistedClaims.length === 0
                ? "You haven't assisted with any claims yet."
                : "No claims match your current filters."}
            </p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead style={{ 
                backgroundColor: theme.gray[100],
                borderBottom: `2px solid ${theme.gray[200]}`
              }}>
                <tr>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Claim ID</th>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Employee</th>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Type</th>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Policy</th>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Date</th>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Status</th>
                  <th style={{ color: theme.gray[700], fontWeight: '600', padding: '1rem' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedClaims.map((claim) => (
                  <tr key={claim.id} style={{ 
                    borderBottom: `1px solid ${theme.gray[200]}`,
                    transition: 'background-color 0.2s ease'
                  }}>
                    <td style={{ padding: '1rem' }}>
                      <strong style={{ color: theme.primary }}>#{claim.id}</strong>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div className="d-flex align-items-center">
                        <div 
                          className="rounded-circle d-flex align-items-center justify-content-center me-3 text-white fw-bold shadow-sm"
                          style={{ 
                            width: '36px', 
                            height: '36px', 
                            backgroundColor: theme.info,
                            fontSize: '0.8rem'
                          }}
                        >
                          {claim.employee ? claim.employee.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <span style={{ color: theme.dark, fontWeight: '500' }}>{claim.employee || "-"}</span>
                      </div>
                    </td>
                    <td style={{ padding: '1rem', color: theme.dark }}>{claim.type || "-"}</td>
                    <td style={{ padding: '1rem', color: theme.dark }}>{claim.policyName || "-"}</td>
                    <td style={{ padding: '1rem' }}>
                      <small style={{ color: theme.gray[600], fontWeight: '500' }}>{formatDate(claim.date)}</small>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <span 
                        className={`badge d-inline-flex align-items-center shadow-sm`}
                        style={{ 
                          backgroundColor: `${theme[getStatusColor(claim.status)]}15`,
                          color: theme[getStatusColor(claim.status)],
                          border: `1px solid ${theme[getStatusColor(claim.status)]}30`,
                          padding: '0.5rem 0.75rem',
                          fontSize: '0.75rem',
                          fontWeight: '600'
                        }}
                      >
                        <i className={`bi ${getStatusIcon(claim.status)} me-1`}></i>
                        {claim.status || "-"}
                      </span>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        className="btn btn-sm rounded-pill px-3 shadow-sm"
                        onClick={() => setSelectedClaim(claim)}
                        style={{ 
                          backgroundColor: `${theme.primary}15`,
                          color: theme.primary,
                          border: `1px solid ${theme.primary}30`,
                          fontWeight: '500',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = theme.primary;
                          e.target.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = `${theme.primary}15`;
                          e.target.style.color = theme.primary;
                        }}
                      >
                        <i className="bi bi-eye me-1"></i> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // Enhanced Modal
  const renderClaimModal = () => (
    <div 
      className="modal show d-block" 
      tabIndex="-1" 
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content border-0 shadow-lg" style={{ borderRadius: '12px' }}>
          <div 
            className="modal-header text-white border-0"
            style={{ 
              background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              borderRadius: '12px 12px 0 0'
            }}
          >
            <h5 className="modal-title fw-bold">
              <i className="bi bi-wallet2 me-2"></i>
              Claim Details #{selectedClaim.id}
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setSelectedClaim(null)}
            ></button>
          </div>
          <div className="modal-body py-4">
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="fw-semibold small mb-2" style={{ color: theme.gray[600] }}>Employee</label>
                  <p style={{ color: theme.dark, fontWeight: '500' }}>{selectedClaim.employee}</p>
                </div>
                <div className="mb-3">
                  <label className="fw-semibold small mb-2" style={{ color: theme.gray[600] }}>Claim Type</label>
                  <p style={{ color: theme.dark, fontWeight: '500' }}>{selectedClaim.type}</p>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="fw-semibold small mb-2" style={{ color: theme.gray[600] }}>Policy</label>
                  <p style={{ color: theme.dark, fontWeight: '500' }}>{selectedClaim.policyName}</p>
                </div>
                <div className="mb-3">
                  <label className="fw-semibold small mb-2" style={{ color: theme.gray[600] }}>Status</label>
                  <div>
                    <span 
                      className="badge d-inline-flex align-items-center shadow-sm"
                      style={{ 
                        backgroundColor: `${theme[getStatusColor(selectedClaim.status)]}15`,
                        color: theme[getStatusColor(selectedClaim.status)],
                        border: `1px solid ${theme[getStatusColor(selectedClaim.status)]}30`,
                        padding: '0.5rem 1rem',
                        fontSize: '0.8rem',
                        fontWeight: '600'
                      }}
                    >
                      <i className={`bi ${getStatusIcon(selectedClaim.status)} me-1`}></i>
                      {selectedClaim.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="mb-3">
              <label className="fw-semibold small mb-2" style={{ color: theme.gray[600] }}>Submission Date</label>
              <p style={{ color: theme.dark, fontWeight: '500' }}>{formatDate(selectedClaim.date)}</p>
            </div>
            {selectedClaim.description && (
              <div className="mb-3">
                <label className="fw-semibold small mb-2" style={{ color: theme.gray[600] }}>Description</label>
                <div 
                  className="border rounded p-3"
                  style={{ 
                    backgroundColor: theme.gray[50],
                    borderColor: theme.gray[300]
                  }}
                >
                  <p style={{ color: theme.dark, margin: 0 }}>{selectedClaim.description}</p>
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer border-0">
            <button 
              className="btn rounded-pill px-4 shadow-sm"
              onClick={() => setSelectedClaim(null)}
              style={{ 
                backgroundColor: theme.gray[200],
                color: theme.gray[700],
                border: 'none',
                fontWeight: '500'
              }}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4" >
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
        <h3 className="fw-bold mb-1" style={{ background: 'linear-gradient(to right, #010f0c, #087f5b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Assisted Claims</h3>
          <p style={{ color: theme.gray[600] }} className="mb-0">
            Track and manage claims you've assisted employees with
          </p>
        </div>
      </div>
      
      {renderStatsCards()}
      {renderCharts()}
      {renderFilters()}
      {renderTable()}
      
      {selectedClaim && renderClaimModal()}
    </div>
  );
}