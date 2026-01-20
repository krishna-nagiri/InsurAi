// File: src/pages/dashboard/Admin/AdminUserManagement.jsx
import React, { useState, useMemo } from "react";
import { Pie, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

// Color constants
const COLORS = {
  PRIMARY: '#0d47a1',        // Deep Blue
  ACCENT_2: '#1976d2',       // Medium Blue
  ACCENT_3: '#42a5f5',       // Light Sky Blue
  CONTRAST: '#5ce1e6',       // Cyan Aqua (kept for contrast)
  WARNING: '#f5c518',        // Gold (unchanged for alerts)
  BACKGROUND: '#f0f8ff',     // Alice Blue (soft background)
  TEXT_MUTED: '#607d8b',     // Muted Grayish Blue
  DARK: '#082567'            // Navy/Dark Blue
};


export default function AdminUserManagement({ 
  users = [], 
  setActiveTab,
  onEditUser,
  onDeleteUser,
  onStatusChange 
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage, setUsersPerPage] = useState(10);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Calculate user statistics (excluding terminated from totalUsers)
  const userStats = useMemo(() => {
    const nonTerminatedUsers = users.filter(user => user.status !== "Terminated");
    const totalUsers = nonTerminatedUsers.length;
    const totalEmployees = nonTerminatedUsers.filter(user => user.role === "Employee").length;
    const totalAgents = nonTerminatedUsers.filter(user => user.role === "Agent").length;
    const totalHR = nonTerminatedUsers.filter(user => user.role === "HR").length;
    const activeUsers = users.filter(user => user.status === "Active").length;
    const inactiveUsers = users.filter(user => user.status === "Inactive").length;
    const terminatedUsers = users.filter(user => user.status === "Terminated").length;

    return { totalUsers, totalEmployees, totalAgents, totalHR, activeUsers, inactiveUsers, terminatedUsers };
  }, [users]);

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch =
        (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());

      const matchesRole = roleFilter === "All" || user.role === roleFilter;

      let matchesStatus;
      if (statusFilter === "All") {
        matchesStatus = user.status !== "Terminated";     // default: hide terminated
      } else {
        matchesStatus = user.status === statusFilter;     // exact match
      }
      // When "All" is selected → show everyone (including Terminated)
      // When specific status → exact match only

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, roleFilter, statusFilter]);

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = filteredUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(filteredUsers.length / usersPerPage);

  // Handle user actions
  const handleEdit = (user) => {
    if (onEditUser) {
      onEditUser(user);
    }
  };

  const handleStatusChange = (user, newStatus) => {
    if (!onStatusChange) return;

    const action = newStatus === "Terminated" ? "Terminate" : "Change status to";
    const confirmMsg = `${action} user "${user.name}" (${user.email}) to ${newStatus}?`;

    if (window.confirm(confirmMsg)) {
      onStatusChange(user.id, newStatus, user.role);
    }
  };

  const handleDeleteClick = (user) => {
    setDeleteConfirm(user);
  };

  const confirmDelete = () => {
    if (onDeleteUser && deleteConfirm) {
      onDeleteUser(deleteConfirm.id);
      setDeleteConfirm(null);
    }
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  // Get role badge class
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "HR": return "bg-primary";
      case "Agent": return "bg-info";
      case "Employee": return "bg-success";
      default: return "bg-secondary";
    }
  };

  // Get status badge class
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "Active": return "bg-success";
      case "Inactive": return "bg-warning";
      case "Terminated": return "bg-danger text-white";
      default: return "bg-secondary";
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearchTerm("");
    setRoleFilter("All");
    setStatusFilter("All");
    setCurrentPage(1);
  };

  // Chart data for user distribution - updated colors
  const roleDistributionData = {
    labels: ['Employees', 'Agents', 'HR'],
    datasets: [{
      data: [userStats.totalEmployees, userStats.totalAgents, userStats.totalHR],
      backgroundColor: [COLORS.PRIMARY, COLORS.ACCENT_2, COLORS.ACCENT_3],
      hoverBackgroundColor: [COLORS.DARK, COLORS.PRIMARY, COLORS.ACCENT_2],
    }],
  };

  const statusDistributionData = {
    labels: ['Active', 'Inactive', 'Terminated'],
    datasets: [{
      data: [userStats.activeUsers, userStats.inactiveUsers, userStats.terminatedUsers],
      backgroundColor: ['#28a745', '#ffc107', '#dc3545'],
    }],
  };

  return (
    <div className="container-fluid">
      {/* Stats Cards */}
      <div className="row g-3 mb-4">
        <div className="col-md-3">
          <div className="metric-card shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-2">
              <div className="metric-icon bg-primary-subtle me-3">
                <i className="bi bi-people fs-4 text-primary"></i>
              </div>
              <h6 className="mb-0 text-muted">Total Users</h6>
            </div>
            <h3 className="mb-0">{userStats.totalUsers}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-2">
              <div className="metric-icon bg-success-subtle me-3">
                <i className="bi bi-person-check fs-4 text-success"></i>
              </div>
              <h6 className="mb-0 text-muted">Active Users</h6>
            </div>
            <h3 className="mb-0">{userStats.activeUsers}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-2">
              <div className="metric-icon bg-warning-subtle me-3">
                <i className="bi bi-person-x fs-4 text-warning"></i>
              </div>
              <h6 className="mb-0 text-muted">Inactive Users</h6>
            </div>
            <h3 className="mb-0">{userStats.inactiveUsers}</h3>
          </div>
        </div>
        <div className="col-md-3">
          <div className="metric-card shadow-sm rounded-3 p-3">
            <div className="d-flex align-items-center mb-2">
              <div className="metric-icon bg-danger-subtle me-3">
                <i className="bi bi-person-dash fs-4 text-danger"></i>
              </div>
              <h6 className="mb-0 text-muted">Terminated Users</h6>
            </div>
            <h3 className="mb-0">{userStats.terminatedUsers}</h3>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row g-3 mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <h5 className="card-title mb-4" style={{ color: COLORS.DARK }}>Role Distribution</h5>
              <div style={{ height: '250px' }}>
                <Doughnut 
                  data={roleDistributionData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
        <div className="col-md-6">
          <div className="card shadow-sm rounded-3">
            <div className="card-body">
              <h5 className="card-title mb-4" style={{ color: COLORS.DARK }}>Status Distribution</h5>
              <div style={{ height: '250px' }}>
                <Pie 
                  data={statusDistributionData} 
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'bottom' } }
                  }} 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card shadow-sm rounded-3 mb-4">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-white">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <option value="All">All Roles</option>
                <option value="Employee">Employee</option>
                <option value="Agent">Agent</option>
                <option value="HR">HR</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
            <div className="col-md-2">
              <button 
                className="btn btn-outline-secondary w-100"
                onClick={resetFilters}
              >
                <i className="bi bi-arrow-counterclockwise me-1"></i>
                Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Table */}
      {currentUsers.length > 0 ? (
        <div className="card shadow-sm rounded-3 overflow-hidden">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="bg-light">
                <tr>
                  <th className="ps-4">User</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th className="text-end pe-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentUsers.map((user) => (
                  <tr key={`${user.role}-${user.id}`}>
                    <td className="align-middle ps-4">{user.name}</td>
                    <td className="align-middle text-muted">{user.email}</td>
                    <td className="align-middle">
                      <span className={`badge ${getRoleBadgeClass(user.role)} rounded-pill px-3 py-2`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="align-middle">
                      <span className={`badge ${getStatusBadgeClass(user.status)} rounded-pill px-3 py-2`}>
                        <i className={`bi ${user.status === "Active" ? "bi-check-circle" : user.status === "Inactive" ? "bi-exclamation-circle" : "bi-dash-circle"} me-1`}></i>
                        {user.status}
                      </span>
                    </td>
                    <td className="align-middle text-end pe-4">
                      <div className="d-flex gap-2 justify-content-end align-items-center">

                        {/* Status change dropdown – only show if not already Terminated */}
                        {user.status !== "Terminated" && (
                          <div className="dropdown">
                            <button
                              className="btn btn-sm btn-outline-primary rounded-circle p-2 lh-1"
                              type="button"
                              id={`statusDropdown-${user.id}`}
                              data-bs-toggle="dropdown"
                              aria-expanded="false"
                              title="Change status"
                              //onClick={() => console.log("Arrow clicked!")}
                            >
                              <i className="bi bi-arrow-repeat"></i>
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end" aria-labelledby={`statusDropdown-${user.id}`}>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleStatusChange(user, "Active");
                                  }}
                                >
                                  Set Active
                                </button>
                              </li>
                              <li>
                                <button
                                  className="dropdown-item"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleStatusChange(user, "Inactive");
                                  }}
                                >
                                  Set Inactive
                                </button>
                              </li>
                              <li><hr className="dropdown-divider" /></li>
                              <li>
                                <button
                                  className="dropdown-item text-danger"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    if (window.confirm(`Terminate user "${user.name}"? This cannot be undone.`)) {
                                      handleStatusChange(user, "Terminated");
                                    }
                                  }}
                                >
                                  Terminate
                                </button>
                              </li>
                            </ul>
                          </div>
                        )}

                        {/* Edit button – commented out / disabled as per your request */}
                        {/* 
                        <button
                          className="btn btn-sm btn-outline-secondary rounded-circle p-2 lh-1 opacity-50"
                          disabled
                          title="Edit coming soon"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        */}

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="card-footer bg-white d-flex justify-content-between align-items-center">
            <div className="small" style={{ color: COLORS.TEXT_MUTED }}>
              Showing {indexOfFirstUser + 1} to {Math.min(indexOfLastUser, filteredUsers.length)} of {filteredUsers.length} entries
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
      ) : (
        <div className="text-center py-5 bg-white rounded-3 shadow-sm">
          <i className="bi bi-search fs-1 text-muted mb-3 d-block"></i>
          <h5 style={{ color: COLORS.DARK }}>No users found</h5>
          <p className="text-muted">Try adjusting your search or filters</p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div 
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ backgroundColor: COLORS.ACCENT_2, color: 'white' }}>
                <h5 className="modal-title">
                  <i className="bi bi-exclamation-triangle me-2"></i>
                  Confirm Delete
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={cancelDelete}
                ></button>
              </div>
              <div className="modal-body py-4">
                <p style={{ color: COLORS.DARK }}>
                  Are you sure you want to delete user <strong>"{deleteConfirm.name}"</strong>?
                </p>
                <p style={{ color: COLORS.TEXT_MUTED }} className="mb-0">
                  This action cannot be undone. All user data will be permanently removed.
                </p>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill px-4"
                  onClick={cancelDelete}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn rounded-pill px-4"
                  style={{ backgroundColor: COLORS.ACCENT_2, color: 'white', borderColor: COLORS.ACCENT_2 }}
                  onClick={confirmDelete}
                >
                  <i className="bi bi-trash me-2"></i>
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}