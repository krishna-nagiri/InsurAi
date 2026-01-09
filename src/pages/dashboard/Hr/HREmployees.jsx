import React, { useState, useMemo } from "react";

export default function HREmployees({
  employees,
  searchName,
  setSearchName,
  policyFilter,
  setPolicyFilter,
  filteredEmployees,
  handleView,
  showModal,
  selectedEmployee,
  handleCloseModal
}) {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Enhanced statistics - Only employee relevant data
  const employeeStats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(emp => emp.active).length;
    const inactive = total - active;

    return { total, active, inactive };
  }, [employees]);

  // Sort employees
  const sortedEmployees = useMemo(() => {
    let sorted = [...filteredEmployees];
    
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'name' || sortConfig.key === 'email') {
          aValue = aValue?.toLowerCase();
          bValue = bValue?.toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return sorted;
  }, [filteredEmployees, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort indicator
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
    return sortConfig.direction === 'asc' ? 
      <i className="bi bi-arrow-up text-primary ms-1"></i> : 
      <i className="bi bi-arrow-down text-primary ms-1"></i>;
  };

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold text-dark mb-2">Employee Management</h2>
              <p className="text-muted mb-0">View and manage employee information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard - Simplified */}
      <div className="row mb-4">
        <div className="col-xl-4 col-md-4 col-12 mb-3">
          <div className="card bg-primary bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-people-fill text-primary fs-4 mb-2"></i>
              <h5 className="text-primary mb-1">{employeeStats.total}</h5>
              <small className="text-muted">Total Employees</small>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-4 col-12 mb-3">
          <div className="card bg-success bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-check-circle text-success fs-4 mb-2"></i>
              <h5 className="text-success mb-1">{employeeStats.active}</h5>
              <small className="text-muted">Active Employees</small>
            </div>
          </div>
        </div>
        <div className="col-xl-4 col-md-4 col-12 mb-3">
          <div className="card bg-warning bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-person-x text-warning fs-4 mb-2"></i>
              <h5 className="text-warning mb-1">{employeeStats.inactive}</h5>
              <small className="text-muted">Inactive Employees</small>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar - Simplified */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search employees by name or email..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-md-4">
              <select
                className="form-select"
                value={policyFilter}
                onChange={(e) => setPolicyFilter(e.target.value)}
              >
                <option value="">All Status</option>
                <option value="EMPLOYEE">Active Employees</option>
                <option value="INACTIVE">Inactive Employees</option>
              </select>
            </div>

            {/* Clear Filters */}
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchName("");
                  setPolicyFilter("");
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Employees Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-gradient-primary text-white border-0">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="card-title mb-0">
              <i className="bi bi-people me-2"></i>
              Employees List
            </h5>
            <span className="badge bg-light text-dark">
              {sortedEmployees.length} employees found
            </span>
          </div>
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort('employeeId')} className="cursor-pointer">
                    Employee ID <SortIndicator columnKey="employeeId" />
                  </th>
                  <th onClick={() => handleSort('name')} className="cursor-pointer">
                    Name <SortIndicator columnKey="name" />
                  </th>
                  <th onClick={() => handleSort('email')} className="cursor-pointer">
                    Email <SortIndicator columnKey="email" />
                  </th>
                  <th>Status</th>
                  <th style={{ width: '100px' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedEmployees.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-5">
                      <i className="bi bi-people display-4 text-muted"></i>
                      <p className="text-muted mt-3">
                        {employees.length === 0 ? "No employees found" : "No employees match your search criteria"}
                      </p>
                    </td>
                  </tr>
                ) : (
                  sortedEmployees.map((employee) => (
                    <tr key={employee.id}>
                      <td>
                        <strong className="text-primary">{employee.employeeId}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                            <i className="bi bi-person text-primary"></i>
                          </div>
                          <div>
                            <div className="fw-semibold">{employee.name}</div>
                            <small className="text-muted">Employee</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="text-truncate d-inline-block" style={{maxWidth: '250px'}} 
                              title={employee.email}>
                          {employee.email}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${employee.active ? 'bg-success' : 'bg-secondary'}`}>
                          <i className={`bi ${employee.active ? 'bi-check-circle' : 'bi-x-circle'} me-1`}></i>
                          {employee.active ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleView(employee)}
                          title="View employee details"
                        >
                          <i className="bi bi-eye"></i> View
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Enhanced Employee Modal - Simplified */}
      {showModal && selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-lg">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-gradient-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-person-circle me-2"></i>
                  Employee Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={handleCloseModal}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card bg-light border-0 mb-3">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">Employee Information</h6>
                        <div className="row">
                          <div className="col-12 mb-3">
                            <label className="text-muted small">Employee ID</label>
                            <div className="fw-semibold">{selectedEmployee.employeeId}</div>
                          </div>
                          <div className="col-12 mb-3">
                            <label className="text-muted small">Full Name</label>
                            <div className="fw-semibold">{selectedEmployee.name}</div>
                          </div>
                          <div className="col-12 mb-3">
                            <label className="text-muted small">Email Address</label>
                            <div className="fw-semibold">{selectedEmployee.email}</div>
                          </div>
                          <div className="col-12">
                            <label className="text-muted small">Account Status</label>
                            <div>
                              <span className={`badge ${selectedEmployee.active ? 'bg-success' : 'bg-secondary'}`}>
                                {selectedEmployee.active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">Employment Details</h6>
                        <div className="row">
                          <div className="col-12 mb-3">
                            <label className="text-muted small">Employee Role</label>
                            <div className="fw-semibold">Employee</div>
                          </div>
                          <div className="col-12 mb-3">
                            <label className="text-muted small">Member Since</label>
                            <div className="fw-semibold">
                              {selectedEmployee.joinDate ? 
                                new Date(selectedEmployee.joinDate).toLocaleDateString('en-IN') : 
                                "Information not available"
                              }
                            </div>
                          </div>
                          <div className="col-12">
                            <label className="text-muted small">Last Activity</label>
                            <div className="fw-semibold">
                              {selectedEmployee.lastActive || "Recently active"}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Insurance Information Section */}
                <div className="row mt-3">
                  <div className="col-12">
                    <div className="card bg-light border-0">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">Insurance Coverage</h6>
                        <div className="alert alert-info">
                          <i className="bi bi-info-circle me-2"></i>
                          Employee insurance policy details can be viewed in the Policies section.
                        </div>
                        <div className="text-center">
                          <button className="btn btn-outline-primary">
                            <i className="bi bi-shield-check me-2"></i>
                            View Policy Details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={handleCloseModal}>
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cursor-pointer {
          cursor: pointer;
        }
        .hover-shadow-lg:hover {
          box-shadow: 0 1rem 3rem rgba(0,0,0,.175) !important;
          transform: translateY(-2px);
        }
        .transition-all {
          transition: all 0.3s ease;
        }
        .table-active {
          background-color: rgba(0, 123, 255, 0.1) !important;
        }
      `}</style>
    </div>
  );
}