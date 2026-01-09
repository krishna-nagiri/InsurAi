import React, { useState, useMemo } from "react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const AdminAllClaims = ({ claims = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [hrFilter, setHrFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [claimsPerPage, setClaimsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: 'claimDate', direction: 'desc' });
  const [selectedClaims, setSelectedClaims] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [viewClaim, setViewClaim] = useState(null);
  const [showStats, setShowStats] = useState(true);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalClaims = claims.length;
    const approvedClaims = claims.filter(c => c.status === "Approved").length;
    const pendingClaims = claims.filter(c => c.status === "Pending").length;
    const rejectedClaims = claims.filter(c => c.status === "Rejected").length;
    
    const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

    // Monthly trend data
    const monthlyData = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const month = date.toLocaleString('default', { month: 'short' });
      const year = date.getFullYear();
      const key = `${month} ${year}`;
      
      const monthClaims = claims.filter(claim => {
        const claimDate = new Date(claim.claimDate);
        return claimDate.getMonth() === date.getMonth() && 
               claimDate.getFullYear() === date.getFullYear();
      });

      return {
        month: key,
        claims: monthClaims.length,
        approved: monthClaims.filter(c => c.status === "Approved").length,
        pending: monthClaims.filter(c => c.status === "Pending").length,
      };
    }).reverse();

    return {
      totalClaims,
      approvedClaims,
      pendingClaims,
      rejectedClaims,
      approvalRate,
      monthlyData
    };
  }, [claims]);

  // Status distribution for pie chart
  const statusData = [
    { name: 'Approved', value: stats.approvedClaims, color: '#198754' },
    { name: 'Pending', value: stats.pendingClaims, color: '#ffc107' },
    { name: 'Rejected', value: stats.rejectedClaims, color: '#dc3545' },
  ];

  // Filter and sort claims
  const filteredClaims = useMemo(() => {
    let filtered = claims.filter(claim => {
      const matchesSearch = 
        claim.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.employeeIdDisplay?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        claim.id?.toString().includes(searchTerm);
      
      const matchesStatus = statusFilter === "All" || claim.status === statusFilter;
      const matchesHR = hrFilter === "All" || claim.assignedHrName === hrFilter;

      // Date filtering
      let matchesDate = true;
      if (dateFilter !== "All") {
        const claimDate = new Date(claim.claimDate);
        const today = new Date();
        switch (dateFilter) {
          case "Today":
            matchesDate = claimDate.toDateString() === today.toDateString();
            break;
          case "This Week":
            const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
            matchesDate = claimDate >= startOfWeek;
            break;
          case "This Month":
            matchesDate = claimDate.getMonth() === today.getMonth() && 
                         claimDate.getFullYear() === today.getFullYear();
            break;
          default:
            matchesDate = true;
        }
      }

      return matchesSearch && matchesStatus && matchesHR && matchesDate;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        // Handle date sorting
        if (sortConfig.key === 'claimDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [claims, searchTerm, statusFilter, dateFilter, hrFilter, sortConfig]);

  // Pagination
  const indexOfLastClaim = currentPage * claimsPerPage;
  const indexOfFirstClaim = indexOfLastClaim - claimsPerPage;
  const currentClaims = filteredClaims.slice(indexOfFirstClaim, indexOfLastClaim);
  const totalPages = Math.ceil(filteredClaims.length / claimsPerPage);

  // Get unique HRs for filter
  const uniqueHRs = useMemo(() => {
    const hrs = claims.map(claim => claim.assignedHrName).filter(Boolean);
    return [...new Set(hrs)];
  }, [claims]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return "↕️";
    return sortConfig.direction === 'asc' ? "↑" : "↓";
  };

  // Selection management
  const toggleClaimSelection = (id) => {
    setSelectedClaims(prev =>
      prev.includes(id) ? prev.filter(claimId => claimId !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedClaims.length === currentClaims.length) {
      setSelectedClaims([]);
    } else {
      setSelectedClaims(currentClaims.map(claim => claim.id));
    }
  };

  // Export data functionality
  const handleExportData = () => {
    const dataToExport = filteredClaims.map(claim => ({
      'Claim ID': claim.id,
      'Employee Name': claim.employeeName,
      'Employee ID': claim.employeeIdDisplay,
      'Policy Name': claim.policyName,
      'Assigned HR': claim.assignedHrName,
      'Status': claim.status,
      'Submitted Date': claim.claimDate ? new Date(claim.claimDate).toLocaleDateString() : 'N/A',
      'Remarks': claim.remarks || '-'
    }));

    // Convert to CSV
    const headers = Object.keys(dataToExport[0] || {});
    const csvContent = [
      headers.join(','),
      ...dataToExport.map(row => 
        headers.map(header => `"${row[header] || ''}"`).join(',')
      )
    ].join('\n');

    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `claims_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Bulk actions
  const handleBulkAction = async (action) => {
    if (!action || selectedClaims.length === 0) return;
    
    // Implement bulk actions here
    console.log(`Performing ${action} on claims:`, selectedClaims);
    
    // Reset selection
    setSelectedClaims([]);
    setBulkAction("");
  };

  // Quick actions
  const quickActions = [
    {
      icon: "bi-download",
      label: "Export Data",
      action: handleExportData,
      color: "success",
      description: "Export claims to CSV"
    },
    {
      icon: "bi-filter",
      label: "Toggle Stats",
      action: () => setShowStats(!showStats),
      color: "info",
      description: "Show/hide statistics"
    },
    {
      icon: "bi-arrow-clockwise",
      label: "Refresh",
      action: () => window.location.reload(),
      color: "warning",
      description: "Refresh data"
    }
  ];

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setStatusFilter("All");
    setDateFilter("All");
    setHrFilter("All");
    setCurrentPage(1);
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Approved": return "bg-success";
      case "Rejected": return "bg-danger";
      case "Pending": return "bg-warning";
      default: return "bg-secondary";
    }
  };

  return (
    <div className="admin-all-claims">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: '#2b0938ff' }} className="fw-bold mb-1">
  <i className="bi bi-clipboard-data me-2"></i>
  Claims Management
</h3>

          <p className="text-gray-600 mb-0">
            Comprehensive claims administration and analytics
          </p>
        </div>
        <div className="d-flex align-items-center gap-3">
          <div className="badge bg-primary fs-6">
            <i className="bi bi-file-text me-1"></i>
            {stats.totalClaims} Total Claims
          </div>
          <button 
            className="btn btn-outline-primary"
            onClick={() => setShowStats(!showStats)}
          >
            <i className={`bi bi-${showStats ? 'chevron-up' : 'chevron-down'} me-2`}></i>
            {showStats ? 'Hide Stats' : 'Show Stats'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        {quickActions.map((action, index) => (
          <div key={index} className="col-xl-4 col-md-4 mb-3">
            <div 
              className={`card border-left-${action.color} shadow-sm h-100 cursor-pointer hover-lift`}
              onClick={action.action}
            >
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className={`bg-${action.color} rounded p-3 me-3`}>
                    <i className={`bi ${action.icon} text-white fs-4`}></i>
                  </div>
                  <div className="flex-grow-1">
                    <h6 className="mb-1 text-gray-800">{action.label}</h6>
                    <small className="text-gray-600">{action.description}</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Statistics Dashboard */}
      {showStats && (
        <div className="row mb-4">
          {/* Key Metrics */}
          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-left-primary shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                      Total Claims
                    </div>
                    <div className="h2 mb-0 font-weight-bold text-gray-800">{stats.totalClaims}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      All time claims
                    </div>
                  </div>
                  <i className="bi bi-file-earmark-text fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-left-success shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Approved
                    </div>
                    <div className="h2 mb-0 font-weight-bold text-gray-800">{stats.approvedClaims}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {stats.approvalRate.toFixed(1)}% approval rate
                    </div>
                  </div>
                  <i className="bi bi-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-left-warning shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                      Pending
                    </div>
                    <div className="h2 mb-0 font-weight-bold text-gray-800">{stats.pendingClaims}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Awaiting review
                    </div>
                  </div>
                  <i className="bi bi-clock fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          <div className="col-xl-3 col-md-6 mb-4">
            <div className="card border-left-danger shadow-sm h-100">
              <div className="card-body">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="text-xs font-weight-bold text-danger text-uppercase mb-1">
                      Rejected
                    </div>
                    <div className="h2 mb-0 font-weight-bold text-gray-800">{stats.rejectedClaims}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      Not approved
                    </div>
                  </div>
                  <i className="bi bi-x-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white py-3">
                <h6 className="m-0 font-weight-bold text-gray-800">Status Distribution</h6>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6 mb-4">
            <div className="card shadow-sm border-0 h-100">
              <div className="card-header bg-white py-3">
                <h6 className="m-0 font-weight-bold text-gray-800">Monthly Trend</h6>
              </div>
              <div className="card-body">
                <div style={{ height: '300px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={stats.monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="claims" 
                        stroke="#0d6efd" 
                        strokeWidth={2} 
                        name="Total Claims"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="approved" 
                        stroke="#198754" 
                        strokeWidth={2} 
                        name="Approved"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters Section */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-end">
            <div className="col-lg-4 col-md-6">
              <label className="form-label fw-semibold text-gray-700">Search Claims</label>
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-gray-500"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name, ID, policy..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>
            
            <div className="col-lg-2 col-md-6">
              <label className="form-label fw-semibold text-gray-700">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label fw-semibold text-gray-700">Date Range</label>
              <select
                className="form-select"
                value={dateFilter}
                onChange={(e) => {
                  setDateFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All Time</option>
                <option value="Today">Today</option>
                <option value="This Week">This Week</option>
                <option value="This Month">This Month</option>
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <label className="form-label fw-semibold text-gray-700">Assigned HR</label>
              <select
                className="form-select"
                value={hrFilter}
                onChange={(e) => {
                  setHrFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="All">All HR</option>
                {uniqueHRs.map(hr => (
                  <option key={hr} value={hr}>{hr}</option>
                ))}
              </select>
            </div>

            <div className="col-lg-2 col-md-6">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
                title="Reset all filters"
              >
                <i className="bi bi-arrow-clockwise me-2"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedClaims.length > 0 && (
        <div className="card bg-light border-0 mb-3">
          <div className="card-body py-2">
            <div className="d-flex justify-content-between align-items-center">
              <span className="fw-semibold text-gray-700">
                {selectedClaims.length} claim{selectedClaims.length !== 1 ? 's' : ''} selected
              </span>
              <div className="d-flex gap-2">
                <select
                  className="form-select form-select-sm w-auto"
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                >
                  <option value="">Bulk Actions</option>
                  <option value="approve">Approve Selected</option>
                  <option value="reject">Reject Selected</option>
                  <option value="assign">Assign to HR</option>
                  <option value="export">Export Selected</option>
                </select>
                {bulkAction && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handleBulkAction(bulkAction)}
                  >
                    Apply
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Claims Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="m-0 font-weight-bold text-gray-800">
            <i className="bi bi-list-ul me-2"></i>
            Claims List
            <span className="badge bg-primary ms-2">{filteredClaims.length}</span>
          </h5>
          
          <div className="d-flex align-items-center gap-3">
            <span className="text-gray-600 small">
              Showing {indexOfFirstClaim + 1}-{Math.min(indexOfLastClaim, filteredClaims.length)} of {filteredClaims.length}
            </span>
            <select
              className="form-select form-select-sm w-auto"
              value={claimsPerPage}
              onChange={(e) => {
                setClaimsPerPage(parseInt(e.target.value));
                setCurrentPage(1);
              }}
            >
              <option value="5">5 per page</option>
              <option value="10">10 per page</option>
              <option value="20">20 per page</option>
              <option value="50">50 per page</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {currentClaims.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-clipboard-x display-1 text-gray-300 d-block mb-3"></i>
              <h5 className="text-gray-500">No claims found</h5>
              <p className="text-gray-500 mb-0">
                {claims.length === 0 
                  ? "No claims submitted yet."
                  : "Try adjusting your search or filters"
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th style={{ width: '50px' }}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={selectedClaims.length === currentClaims.length && currentClaims.length > 0}
                          onChange={toggleSelectAll}
                        />
                      </div>
                    </th>
                    <th 
                      className="border-0 text-gray-700 font-weight-bold cursor-pointer"
                      onClick={() => handleSort('id')}
                    >
                      Claim ID {getSortIndicator('id')}
                    </th>
                    <th 
                      className="border-0 text-gray-700 font-weight-bold cursor-pointer"
                      onClick={() => handleSort('employeeName')}
                    >
                      Employee {getSortIndicator('employeeName')}
                    </th>
                    <th className="border-0 text-gray-700 font-weight-bold">Policy</th>
                    <th className="border-0 text-gray-700 font-weight-bold">Assigned HR</th>
                    <th 
                      className="border-0 text-gray-700 font-weight-bold cursor-pointer"
                      onClick={() => handleSort('status')}
                    >
                      Status {getSortIndicator('status')}
                    </th>
                    <th className="border-0 text-gray-700 font-weight-bold">Documents</th>
                    <th 
                      className="border-0 text-gray-700 font-weight-bold cursor-pointer"
                      onClick={() => handleSort('claimDate')}
                    >
                      Submitted {getSortIndicator('claimDate')}
                    </th>
                    <th className="border-0 text-gray-700 font-weight-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentClaims.map((claim) => (
                    <tr key={claim.id} className={selectedClaims.includes(claim.id) ? 'table-active' : ''}>
                      <td>
                        <div className="form-check">
                          <input
                            className="form-check-input"
                            type="checkbox"
                            checked={selectedClaims.includes(claim.id)}
                            onChange={() => toggleClaimSelection(claim.id)}
                          />
                        </div>
                      </td>
                      <td>
                        <div className="fw-semibold text-gray-800">#{claim.id}</div>
                        <small className="text-gray-600">{claim.employeeIdDisplay || 'N/A'}</small>
                      </td>
                      <td>
                        <div className="fw-semibold text-gray-800">{claim.employeeName || "Unknown"}</div>
                        <small className="text-gray-600">Employee</small>
                      </td>
                      <td>
                        <div className="text-gray-800">{claim.policyName || "N/A"}</div>
                        <small className="text-gray-600">Policy</small>
                      </td>
                      <td>
                        <div className={claim.assignedHrName ? "text-gray-800" : "text-muted"}>
                          {claim.assignedHrName || "Not Assigned"}
                        </div>
                        {claim.assignedHrName && (
                          <small className="text-gray-600">HR Manager</small>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${getStatusBadgeClass(claim.status)}`}>
                          {claim.status}
                        </span>
                      </td>
                      <td>
                        {claim.documents?.length > 0 ? (
                          <div className="dropdown">
                            <button 
                              className="btn btn-sm btn-outline-primary dropdown-toggle"
                              type="button"
                              data-bs-toggle="dropdown"
                            >
                              <i className="bi bi-paperclip me-1"></i>
                              {claim.documents.length}
                            </button>
                            <ul className="dropdown-menu">
                              {claim.documents.map((doc, idx) => (
                                <li key={idx}>
                                  <a
                                    className="dropdown-item"
                                    href={`http://localhost:8077${doc}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <i className="bi bi-download me-2"></i>
                                    Document {idx + 1}
                                  </a>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ) : (
                          <span className="text-muted small">No docs</span>
                        )}
                      </td>
                      <td>
                        <div className="text-gray-800">
                          {claim.claimDate ? new Date(claim.claimDate).toLocaleDateString() : "N/A"}
                        </div>
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => setViewClaim(claim)}
                          title="View Details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="card-footer bg-white">
            <div className="d-flex justify-content-between align-items-center">
              <div className="text-gray-600 small">
                Showing {indexOfFirstClaim + 1} to {Math.min(indexOfLastClaim, filteredClaims.length)} of {filteredClaims.length} entries
              </div>
              <nav>
                <ul className="pagination mb-0">
                  <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                    <button
                      className="page-link rounded-start"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <i className="bi bi-chevron-left"></i>
                    </button>
                  </li>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <li
                        key={pageNum}
                        className={`page-item ${currentPage === pageNum ? "active" : ""}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(pageNum)}
                        >
                          {pageNum}
                        </button>
                      </li>
                    );
                  })}

                  <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                    <button
                      className="page-link rounded-end"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      <i className="bi bi-chevron-right"></i>
                    </button>
                  </li>
                </ul>
              </nav>
            </div>
          </div>
        )}
      </div>

      {/* View Claim Modal */}
      {viewClaim && (
        <div 
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          onClick={() => setViewClaim(null)}
        >
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-primary text-white border-0">
                <h5 className="modal-title">
                  <i className="bi bi-clipboard-check me-2"></i>
                  Claim Details - #{viewClaim.id}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewClaim(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <h6 className="text-gray-700 mb-3">Claim Information</h6>
                    <p><strong>Employee:</strong> {viewClaim.employeeName}</p>
                    <p><strong>Employee ID:</strong> {viewClaim.employeeIdDisplay}</p>
                    <p><strong>Policy:</strong> {viewClaim.policyName}</p>
                    <p><strong>Submitted:</strong> {new Date(viewClaim.claimDate).toLocaleDateString()}</p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-gray-700 mb-3">Status & Assignment</h6>
                    <p>
                      <strong>Status:</strong>{' '}
                      <span className={`badge ${getStatusBadgeClass(viewClaim.status)}`}>
                        {viewClaim.status}
                      </span>
                    </p>
                    <p><strong>Assigned HR:</strong> {viewClaim.assignedHrName || 'Not assigned'}</p>
                    <p><strong>Remarks:</strong> {viewClaim.remarks || 'No remarks'}</p>
                  </div>
                </div>
                
                {viewClaim.documents?.length > 0 && (
                  <div className="mt-4">
                    <h6 className="text-gray-700 mb-3">Documents</h6>
                    <div className="row">
                      {viewClaim.documents.map((doc, idx) => (
                        <div key={idx} className="col-md-6 mb-2">
                          <a
                            href={`http://localhost:8077${doc}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary w-100 text-start"
                          >
                            <i className="bi bi-download me-2"></i>
                            Document {idx + 1}
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setViewClaim(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .hover-lift {
          transition: all 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.12) !important;
        }
        .cursor-pointer {
          cursor: pointer;
        }
      `}</style>
    </div>
  );
};

export default AdminAllClaims;