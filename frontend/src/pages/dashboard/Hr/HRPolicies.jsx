// src/components/hr/HRPolicies.jsx
import React, { useState, useMemo } from "react";

export default function HRPolicies({ policies }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [viewMode, setViewMode] = useState('table'); // 'table' or 'grid'

  // Enhanced statistics
  const policyStats = useMemo(() => {
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(p => p.policyStatus === "Active").length;
    const totalCoverage = policies.reduce((sum, policy) => sum + (policy.coverageAmount || 0), 0);
    const totalPremium = policies.reduce((sum, policy) => sum + (policy.monthlyPremium || 0), 0);
    
    // Policy types distribution
    const policyTypes = policies.reduce((acc, policy) => {
      const type = policy.policyType || 'General';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    // Expiring soon (within 30 days)
    const expiringSoon = policies.filter(policy => {
      if (!policy.renewalDate) return false;
      try {
        const renewalDate = new Date(policy.renewalDate);
        const daysUntilRenewal = Math.ceil((renewalDate - new Date()) / (1000 * 60 * 60 * 24));
        return daysUntilRenewal <= 30 && daysUntilRenewal > 0;
      } catch {
        return false;
      }
    }).length;

    return { 
      totalPolicies, 
      activePolicies, 
      totalCoverage, 
      totalPremium, 
      policyTypes, 
      expiringSoon 
    };
  }, [policies]);

  // Filtered and sorted policies
  const filteredPolicies = useMemo(() => {
    let filtered = policies.filter(policy => {
      // Search filter
      const matchesSearch = 
        policy.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.providerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        policy.policyDescription?.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Status filter
      const matchesStatus = statusFilter === "all" || policy.policyStatus === statusFilter;
      
      // Type filter
      const matchesType = typeFilter === "all" || policy.policyType === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });

    // Sorting
    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'coverageAmount' || sortConfig.key === 'monthlyPremium') {
          aValue = aValue || 0;
          bValue = bValue || 0;
        } else if (sortConfig.key === 'renewalDate') {
          aValue = new Date(aValue);
          bValue = new Date(bValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [policies, searchTerm, statusFilter, typeFilter, sortConfig]);

  // Handle sort
  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Sort indicator component
  const SortIndicator = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <i className="bi bi-arrow-down-up text-muted ms-1"></i>;
    return sortConfig.direction === 'asc' ? 
      <i className="bi bi-arrow-up text-primary ms-1"></i> : 
      <i className="bi bi-arrow-down text-primary ms-1"></i>;
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Get unique policy types for filter
  const policyTypes = useMemo(() => {
    const types = [...new Set(policies.map(p => p.policyType).filter(Boolean))];
    return types.sort();
  }, [policies]);

  // Policy Card Component for Grid View
  const PolicyCard = ({ policy }) => {
    const daysUntilRenewal = policy.renewalDate ? 
      Math.ceil((new Date(policy.renewalDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

    return (
      <div className="card h-100 shadow-sm border-0 hover-shadow-lg transition-all">
        <div className="card-header bg-gradient-light border-0">
          <div className="d-flex justify-content-between align-items-start mb-2">
            <h6 className="mb-0 text-truncate flex-grow-1 pe-2" title={policy.policyName}>
              {policy.policyName}
            </h6>
            <span className={`badge ${policy.policyStatus === "Active" ? "bg-success" : "bg-secondary"}`}>
              {policy.policyStatus}
            </span>
          </div>
          
          {/* Renewal Alert */}
          {daysUntilRenewal !== null && daysUntilRenewal <= 30 && (
            <div className={`alert alert-sm mb-0 ${daysUntilRenewal <= 7 ? 'alert-warning' : 'alert-info'}`}>
              <i className="bi bi-clock me-1"></i>
              Renews in {daysUntilRenewal} day{daysUntilRenewal !== 1 ? 's' : ''}
            </div>
          )}
        </div>

        <div className="card-body">
          {/* Quick Stats */}
          <div className="row text-center mb-3">
            <div className="col-6 border-end">
              <div className="text-muted small">Coverage</div>
              <div className="fw-bold text-primary">{formatCurrency(policy.coverageAmount)}</div>
            </div>
            <div className="col-6">
              <div className="text-muted small">Premium</div>
              <div className="fw-bold text-success">{formatCurrency(policy.monthlyPremium)}/mo</div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="mb-3">
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-building text-muted me-2"></i>
              <span className="small">{policy.providerName}</span>
            </div>
            <div className="d-flex align-items-center mb-2">
              <i className="bi bi-tag text-muted me-2"></i>
              <span className="small">{policy.policyType}</span>
            </div>
            <div className="d-flex align-items-center">
              <i className="bi bi-calendar-event text-muted me-2"></i>
              <span className="small">{new Date(policy.renewalDate).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Description Preview */}
          <div className="mb-3">
            <h6 className="small fw-semibold">Description</h6>
            <p className="small text-muted mb-0 line-clamp-3">
              {policy.policyDescription?.substring(0, 100)}...
            </p>
          </div>

          {/* Action Buttons */}
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary btn-sm flex-fill"
              onClick={() => setSelectedPolicy(policy)}
            >
              <i className="bi bi-eye me-1"></i> View
            </button>
            <div className="dropdown">
              <ul className="dropdown-menu">
                {policy.contractUrl && (
                  <li>
                    <a className="dropdown-item" href={policy.contractUrl} target="_blank">
                      <i className="bi bi-file-text me-2"></i> Contract
                    </a>
                  </li>
                )}
                {policy.termsUrl && (
                  <li>
                    <a className="dropdown-item" href={policy.termsUrl} target="_blank">
                      <i className="bi bi-file-earmark-text me-2"></i> Terms
                    </a>
                  </li>
                )}
                {policy.claimFormUrl && (
                  <li>
                    <a className="dropdown-item" href={policy.claimFormUrl} target="_blank">
                      <i className="bi bi-clipboard-check me-2"></i> Claim Form
                    </a>
                  </li>
                )}
                {policy.annexureUrl && (
                  <li>
                    <a className="dropdown-item" href={policy.annexureUrl} target="_blank">
                      <i className="bi bi-file-plus me-2"></i> Annexure
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container-fluid">
      {/* Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h2 className="fw-bold text-dark mb-2">Company Policy Management</h2>
              <p className="text-muted mb-0">Manage and review all company insurance policies</p>
            </div>
            <div className="d-flex gap-2">
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Dashboard */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card bg-primary bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-shield-check text-primary fs-4 mb-2"></i>
              <h5 className="text-primary mb-1">{policyStats.totalPolicies}</h5>
              <small className="text-muted">Total Policies</small>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card bg-success bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-check-circle text-success fs-4 mb-2"></i>
              <h5 className="text-success mb-1">{policyStats.activePolicies}</h5>
              <small className="text-muted">Active</small>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card bg-info bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-currency-rupee text-info fs-4 mb-2"></i>
              <h5 className="text-info mb-1">{formatCurrency(policyStats.totalCoverage)}</h5>
              <small className="text-muted">Total Coverage</small>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card bg-warning bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-graph-up text-warning fs-4 mb-2"></i>
              <h5 className="text-warning mb-1">{formatCurrency(policyStats.totalPremium)}</h5>
              <small className="text-muted">Monthly Premium</small>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card bg-danger bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-exclamation-triangle text-danger fs-4 mb-2"></i>
              <h5 className="text-danger mb-1">{policyStats.expiringSoon}</h5>
              <small className="text-muted">Renewing Soon</small>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 col-6 mb-3">
          <div className="card bg-dark bg-opacity-10 border-0 shadow-sm">
            <div className="card-body text-center">
              <i className="bi bi-tags text-dark fs-4 mb-2"></i>
              <h5 className="text-dark mb-1">{Object.keys(policyStats.policyTypes).length}</h5>
              <small className="text-muted">Policy Types</small>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Bar */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-body">
          <div className="row g-3 align-items-center">
            {/* Search */}
            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search policies..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Status Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Active">Active</option>
                <option value="Expired">Expired</option>
                <option value="Draft">Draft</option>
              </select>
            </div>

            {/* Type Filter */}
            <div className="col-md-2">
              <select
                className="form-select"
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                <option value="all">All Types</option>
                {policyTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="col-md-2">
              <div className="btn-group w-100">
                <button
                  className={`btn btn-outline-primary ${viewMode === 'table' ? 'active' : ''}`}
                  onClick={() => setViewMode('table')}
                >
                  <i className="bi bi-list"></i> Table
                </button>
                <button
                  className={`btn btn-outline-primary ${viewMode === 'grid' ? 'active' : ''}`}
                  onClick={() => setViewMode('grid')}
                >
                  <i className="bi bi-grid"></i> Grid
                </button>
              </div>
            </div>

            {/* Clear Filters */}
            <div className="col-md-3">
              <div className="d-flex gap-2">
                <button
                  className="btn btn-outline-secondary flex-fill"
                  onClick={() => {
                    setSearchTerm("");
                    setStatusFilter("all");
                    setTypeFilter("all");
                  }}
                >
                  Clear Filters
                </button>
                <button className="btn btn-primary">
                  <i className="bi bi-filter"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policies Display */}
      {filteredPolicies.length === 0 ? (
        <div className="text-center py-5">
          <i className="bi bi-shield-x display-4 text-muted"></i>
          <p className="text-muted mt-3">
            {policies.length === 0 ? "No policies available" : "No policies match your search criteria"}
          </p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="row g-4">
          {filteredPolicies.map((policy) => (
            <div key={policy.id} className="col-xl-4 col-lg-6 col-md-6">
              <PolicyCard policy={policy} />
            </div>
          ))}
        </div>
      ) : (
        <div className="card shadow-sm border-0">
          <div className="card-header bg-gradient-primary text-white border-0">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="bi bi-shield-check me-2"></i>
                Policies Overview
              </h5>
              <span className="badge bg-light text-dark fs-6">
                {filteredPolicies.length} of {policies.length} policies
              </span>
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th onClick={() => handleSort('policyName')} className="cursor-pointer">
                      Policy Name <SortIndicator columnKey="policyName" />
                    </th>
                    <th onClick={() => handleSort('policyType')} className="cursor-pointer">
                      Type <SortIndicator columnKey="policyType" />
                    </th>
                    <th>Provider</th>
                    <th onClick={() => handleSort('coverageAmount')} className="cursor-pointer text-end">
                      Coverage <SortIndicator columnKey="coverageAmount" />
                    </th>
                    <th onClick={() => handleSort('monthlyPremium')} className="cursor-pointer text-end">
                      Premium <SortIndicator columnKey="monthlyPremium" />
                    </th>
                    <th onClick={() => handleSort('renewalDate')} className="cursor-pointer">
                      Renewal <SortIndicator columnKey="renewalDate" />
                    </th>
                    <th>Status</th>
                    <th style={{ width: '200px' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPolicies.map((policy) => (
                    <tr key={policy.id}>
                      <td>
                        <div className="fw-semibold">{policy.policyName}</div>
                        <small className="text-muted">{policy.policyDescription?.substring(0, 50)}...</small>
                      </td>
                      <td>
                        <span className="badge bg-light text-dark">{policy.policyType}</span>
                      </td>
                      <td>{policy.providerName}</td>
                      <td className="text-end fw-bold text-primary">
                        {formatCurrency(policy.coverageAmount)}
                      </td>
                      <td className="text-end fw-bold text-success">
                        {formatCurrency(policy.monthlyPremium)}/mo
                      </td>
                      <td>
                        <small className="text-muted">
                          {new Date(policy.renewalDate).toLocaleDateString()}
                        </small>
                      </td>
                      <td>
                        <span className={`badge ${policy.policyStatus === "Active" ? "bg-success" : "bg-secondary"}`}>
                          {policy.policyStatus}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-1">
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => setSelectedPolicy(policy)}
                          >
                            <i className="bi bi-eye"></i> View
                          </button>
                          <div className="dropdown">
                            
                            <ul className="dropdown-menu">
                              {policy.contractUrl && (
                                <li>
                                  <a className="dropdown-item" href={policy.contractUrl} target="_blank">
                                    <i className="bi bi-file-text me-2"></i> Contract
                                  </a>
                                </li>
                              )}
                              {policy.termsUrl && (
                                <li>
                                  <a className="dropdown-item" href={policy.termsUrl} target="_blank">
                                    <i className="bi bi-file-earmark-text me-2"></i> Terms
                                  </a>
                                </li>
                              )}
                              {policy.claimFormUrl && (
                                <li>
                                  <a className="dropdown-item" href={policy.claimFormUrl} target="_blank">
                                    <i className="bi bi-clipboard-check me-2"></i> Claim Form
                                  </a>
                                </li>
                              )}
                              {policy.annexureUrl && (
                                <li>
                                  <a className="dropdown-item" href={policy.annexureUrl} target="_blank">
                                    <i className="bi bi-file-plus me-2"></i> Annexure
                                  </a>
                                </li>
                              )}
                            </ul>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Policy Detail Modal */}
      {selectedPolicy && (
        <div className="modal show d-block" tabIndex="-1" style={{backgroundColor: 'rgba(0,0,0,0.5)'}}>
          <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-gradient-primary text-white">
                <h5 className="modal-title">
                  <i className="bi bi-shield-check me-2"></i>
                  {selectedPolicy.policyName}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setSelectedPolicy(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card bg-light border-0 mb-3">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">Policy Details</h6>
                        <div className="row small">
                          <div className="col-6 mb-2">
                            <span className="text-muted">Provider:</span>
                            <br/>
                            <strong>{selectedPolicy.providerName}</strong>
                          </div>
                          <div className="col-6 mb-2">
                            <span className="text-muted">Type:</span>
                            <br/>
                            <strong>{selectedPolicy.policyType}</strong>
                          </div>
                          <div className="col-6 mb-2">
                            <span className="text-muted">Coverage:</span>
                            <br/>
                            <strong className="text-primary">{formatCurrency(selectedPolicy.coverageAmount)}</strong>
                          </div>
                          <div className="col-6 mb-2">
                            <span className="text-muted">Premium:</span>
                            <br/>
                            <strong className="text-success">{formatCurrency(selectedPolicy.monthlyPremium)}/month</strong>
                          </div>
                          <div className="col-6 mb-2">
                            <span className="text-muted">Renewal Date:</span>
                            <br/>
                            <strong>{new Date(selectedPolicy.renewalDate).toLocaleDateString()}</strong>
                          </div>
                          <div className="col-6 mb-2">
                            <span className="text-muted">Status:</span>
                            <br/>
                            <span className={`badge ${selectedPolicy.policyStatus === "Active" ? "bg-success" : "bg-secondary"}`}>
                              {selectedPolicy.policyStatus}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card bg-light border-0 mb-3">
                      <div className="card-body">
                        <h6 className="fw-semibold mb-3">Policy Description</h6>
                        <div className="max-h-200 overflow-auto">
                          <p style={{whiteSpace: 'pre-wrap'}} className="small mb-0">
                            {selectedPolicy.policyDescription}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <h6 className="fw-semibold mt-4">Policy Documents</h6>
                <div className="row g-2">
                  {[
                    { label: 'Policy Contract', url: selectedPolicy.contractUrl, icon: 'file-text' },
                    { label: 'Terms & Conditions', url: selectedPolicy.termsUrl, icon: 'file-earmark-text' },
                    { label: 'Claim Form', url: selectedPolicy.claimFormUrl, icon: 'clipboard-check' },
                    { label: 'Annexure', url: selectedPolicy.annexureUrl, icon: 'file-plus' }
                  ].map((doc, index) => (
                    doc.url && (
                      <div key={index} className="col-md-3 col-6">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-outline-primary w-100"
                        >
                          <i className={`bi bi-${doc.icon} me-2`}></i> {doc.label}
                        </a>
                      </div>
                    )
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setSelectedPolicy(null)}>
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
        .max-h-200 {
          max-height: 200px;
        }
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}