import React, { useState, useEffect, useMemo } from "react";

export default function EmployeeClaims({
  activeTab,
  setActiveTab,
  showNotificationAlert,
  policies = []
}) {
  const [newClaim, setNewClaim] = useState({
    type: "",
    amount: "",
    date: "",
    description: "",
    documents: [],
    existingDocuments: [],
  });
  const [claims, setClaims] = useState([]);
  const [selectedPolicyId, setSelectedPolicyId] = useState(
    policies.length > 0 ? String(policies[0].id) : ""
  );
  const [viewingClaim, setViewingClaim] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [fileUploadProgress, setFileUploadProgress] = useState({});



  useEffect(() => {
  if (policies.length > 0 && !selectedPolicyId) {
    setSelectedPolicyId(String(policies[0].id));
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [policies]);


// ------------------ Fetch employee claims ------------------
const fetchClaims = async () => {
  const token = localStorage.getItem("token");
  if (!token) return console.warn("Missing token, cannot fetch claims");

  setLoading(true);
  try {
    const res = await fetch("http://localhost:8077/employee/claims", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Failed to fetch claims");
    const data = await res.json();

    const mapped = data.map(claim => ({
      ...claim,
  policyId: Number(claim.policy_id || claim.policyId || 0), // ✅ handles both cases
      remarks: claim.remarks || "No remarks yet",
      formattedAmount: `₹${claim.amount?.toLocaleString('en-IN') || '0'}`,
      statusColor: getStatusColor(claim.status),
      statusIcon: getStatusIcon(claim.status),
      typeIcon: getTypeIcon(claim.title)
    }));

    setClaims(mapped);

 

  } catch (error) {
    console.error(error);
    showNotificationAlert("Error fetching claims", "error");
  } finally {
    setLoading(false);
  }
};


  // Helper functions for status and type icons
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'success';
      case 'pending': return 'warning';
      case 'rejected': return 'danger';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case 'approved': return 'bi-check-circle-fill';
      case 'pending': return 'bi-clock-fill';
      case 'rejected': return 'bi-x-circle-fill';
      default: return 'bi-question-circle';
    }
  };

  const getTypeIcon = (type) => {
    const lowerType = type?.toLowerCase();
    if (lowerType?.includes('health')) return 'bi-heart-pulse';
    if (lowerType?.includes('dental')) return 'bi-tooth';
    if (lowerType?.includes('vision')) return 'bi-eye';
    if (lowerType?.includes('accident')) return 'bi-bandaid';
    if (lowerType?.includes('life')) return 'bi-heart';
    return 'bi-wallet2';
  };

 useEffect(() => {
  fetchClaims();
}, []); 


  // ------------------ Enhanced filtering and sorting ------------------
  const filteredAndSortedClaims = useMemo(() => {
    let filtered = claims.filter(claim => {
      const matchesSearch = claim.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.id?.toString().includes(searchTerm);
      const matchesStatus = statusFilter === "all" || claim.status?.toLowerCase() === statusFilter.toLowerCase();
      return matchesSearch && matchesStatus;
    });

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest':
          return new Date(a.createdAt) - new Date(b.createdAt);
        case 'amount-high':
          return (b.amount || 0) - (a.amount || 0);
        case 'amount-low':
          return (a.amount || 0) - (b.amount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [claims, searchTerm, statusFilter, sortBy]);

  // ------------------ Enhanced Stats calculation ------------------
  const claimsStats = useMemo(() => {
    const total = claims.length;
    const approved = claims.filter(c => c.status === 'Approved').length;
    const pending = claims.filter(c => c.status === 'Pending').length;
    const rejected = claims.filter(c => c.status === 'Rejected').length;
    const totalAmount = claims.reduce((sum, claim) => sum + (parseFloat(claim.amount) || 0), 0);
    const avgAmount = total > 0 ? totalAmount / total : 0;

    return { total, approved, pending, rejected, totalAmount, avgAmount };
  }, [claims]);

  // ------------------ Enhanced document upload with progress ------------------
  const handleDocumentUpload = (e) => {
    const files = Array.from(e.target.files);
    
    // File validation
    const validFiles = files.filter(file => {
      const maxSize = 10 * 1024 * 1024; // 10MB
      const validTypes = ['image/jpeg', 'image/png', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      
      if (file.size > maxSize) {
        showNotificationAlert(`File ${file.name} exceeds 10MB limit`, "warning");
        return false;
      }
      
      if (!validTypes.includes(file.type)) {
        showNotificationAlert(`File ${file.name} has unsupported format`, "warning");
        return false;
      }
      
      return true;
    });

    // Simulate upload progress
    validFiles.forEach((file, index) => {
      setFileUploadProgress(prev => ({ ...prev, [file.name]: 0 }));
      
      const interval = setInterval(() => {
        setFileUploadProgress(prev => {
          const currentProgress = prev[file.name] || 0;
          if (currentProgress >= 100) {
            clearInterval(interval);
            return prev;
          }
          return { ...prev, [file.name]: currentProgress + 10 };
        });
      }, 100);

      setTimeout(() => {
        clearInterval(interval);
        setFileUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
        
        // Add to documents after "upload"
        setTimeout(() => {
          setNewClaim(prev => ({
            ...prev,
            documents: [...prev.documents, file],
          }));
          setFileUploadProgress(prev => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 300);
      }, 1000);
    });
  };

  // ------------------ Enhanced claim submission ------------------
  const handleClaimSubmit = async (e) => {
    e.preventDefault();

    const token = localStorage.getItem("token");
    if (!token) return showNotificationAlert("Cannot submit claim: missing token.", "error");

    if (!newClaim.type || !newClaim.amount || !newClaim.date || !newClaim.description || !selectedPolicyId) {
      return showNotificationAlert("Please fill all required fields.", "warning");
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("policyId", selectedPolicyId);
      formData.append("title", newClaim.type);
      formData.append("description", newClaim.description);
      formData.append("amount", parseFloat(newClaim.amount));
      formData.append("date", newClaim.date);

      newClaim.documents.forEach(file => formData.append("documents", file));

      let url = "http://localhost:8077/employee/claims";
      if (newClaim.id) {
        url = "http://localhost:8077/employee/claims/update";
        formData.append("claimId", newClaim.id);
      }

      const res = await fetch(url, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to submit claim");
      }

      const data = await res.json();

      setClaims(prev => {
        if (newClaim.id) {
          return prev.map(c => (c.id === data.id ? data : c));
        } else {
          return [data, ...prev];
        }
      });

      showNotificationAlert(
        newClaim.id ? "Claim updated successfully!" : "Claim submitted successfully!", 
        "success"
      );

      // Reset form
      setNewClaim({ type: "", amount: "", date: "", description: "", documents: [], existingDocuments: [] });
      if (policies.length > 0) setSelectedPolicyId(String(policies[0].id));

      await fetchClaims();
      setActiveTab("claims");

    } catch (error) {
      console.error(error);
      showNotificationAlert(error.message || "Error submitting claim", "error");
    } finally {
      setLoading(false);
    }
  };

    const totalApprovedAmount = claims
  .filter(c => c.status === "Approved")
  .reduce((sum, c) => sum + (c.amount || 0), 0);

  // ------------------ Enhanced document removal ------------------
  const handleRemoveExistingDocument = (index) => {
    setNewClaim(prev => {
      const updatedExisting = [...prev.existingDocuments];
      updatedExisting.splice(index, 1);
      return { ...prev, existingDocuments: updatedExisting };
    });
  };

  const handleRemoveNewDocument = (index) => {
    setNewClaim(prev => {
      const updatedNew = [...prev.documents];
      updatedNew.splice(index, 1);
      return { ...prev, documents: updatedNew };
    });
  };

  // ------------------ Enhanced Claims List ------------------
  const renderClaimsList = () => (
    <div className="container-fluid">
      {/* Header with Stats */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h3 className="fw-bold text-gradient mb-2">My Insurance Claims</h3>
              <p className="text-gray-600 mb-0">Manage and track your insurance claims</p>
            </div>
            <button 
              className="btn btn-primary btn-lg shadow-sm" 
              onClick={() => setActiveTab("newClaim")}
            >
              <i className="bi bi-plus-circle me-2"></i> Submit New Claim
            </button>
          </div>
        </div>
      </div>

      {/* Enhanced Stats Cards */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 mb-3">
          <div className="card border-left-primary shadow-sm h-100 py-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                    Total Claims
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{claimsStats.total}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-wallet2 fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 mb-3">
          <div className="card border-left-success shadow-sm h-100 py-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                    Approved
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{claimsStats.approved}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-2 col-md-4 mb-3">
          <div className="card border-left-warning shadow-sm h-100 py-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                    Pending
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">{claimsStats.pending}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-clock-history fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-left-info shadow-sm h-100 py-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                    Total Amount
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ₹{claimsStats.totalAmount.toLocaleString('en-IN')}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-currency-rupee fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="col-xl-3 col-md-6 mb-3">
          <div className="card border-left-secondary shadow-sm h-100 py-2">
            <div className="card-body">
              <div className="d-flex align-items-center">
                <div className="flex-grow-1">
                  <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                    Average Claim
                  </div>
                  <div className="h5 mb-0 font-weight-bold text-gray-800">
                    ₹{claimsStats.avgAmount.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-graph-up fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3">
          <h6 className="font-weight-bold text-gray-800 mb-0">Filters & Search</h6>
        </div>
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-gray-600"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Search claims by ID, type, or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div className="col-md-3">
              <select
                className="form-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="newest">Newest First</option>
                <option value="oldest">Oldest First</option>
                <option value="amount-high">Amount: High to Low</option>
                <option value="amount-low">Amount: Low to High</option>
              </select>
            </div>
            <div className="col-md-2">
              <button
                className="btn btn-outline-secondary w-100"
                onClick={() => {
                  setSearchTerm("");
                  setStatusFilter("all");
                  setSortBy("newest");
                }}
              >
                <i className="bi bi-arrow-clockwise me-1"></i> Reset
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Claims Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <div className="d-flex justify-content-between align-items-center">
            <h6 className="font-weight-bold text-gray-800 mb-0">
              Claims History
              <span className="badge bg-primary ms-2">{filteredAndSortedClaims.length}</span>
            </h6>
            <div className="text-muted small">
              Showing {filteredAndSortedClaims.length} of {claims.length} claims
            </div>
          </div>
        </div>
        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="text-gray-600 mt-3">Loading claims...</p>
            </div>
          ) : filteredAndSortedClaims.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-wallet2 display-1 text-gray-300 mb-3"></i>
              <h5 className="text-gray-500">No claims found</h5>
              <p className="text-gray-600 mb-4">
                {claims.length === 0 ? "You haven't submitted any claims yet." : "No claims match your current filters."}
              </p>
              {claims.length === 0 && (
                <button className="btn btn-primary" onClick={() => setActiveTab("newClaim")}>
                  <i className="bi bi-plus-circle me-2"></i> Submit Your First Claim
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th className="text-gray-700 font-weight-bold">Claim ID</th>
                    <th className="text-gray-700 font-weight-bold">Type</th>
                    <th className="text-gray-700 font-weight-bold">Description</th>
                    <th className="text-gray-700 font-weight-bold">Amount</th>
                    <th className="text-gray-700 font-weight-bold">Submitted</th>
                    <th className="text-gray-700 font-weight-bold">Status</th>
                    <th className="text-gray-700 font-weight-bold">Remarks</th>
                    <th className="text-gray-700 font-weight-bold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedClaims.map((claim) => (
                    <tr key={claim.id} className="border-bottom">
                      <td>
                        <strong className="text-primary">#{claim.id}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <i className={`bi ${claim.typeIcon} text-primary me-2`}></i>
                          <span className="text-gray-800">{claim.title}</span>
                        </div>
                      </td>
                      <td>
                        <span 
                          className="text-truncate d-inline-block text-gray-700" 
                          style={{maxWidth: '200px'}} 
                          title={claim.description}
                        >
                          {claim.description}
                        </span>
                      </td>
                      <td>
                        <strong className="text-success">{claim.formattedAmount}</strong>
                      </td>
                      <td>
                        <small className="text-gray-600">
                          {new Date(claim.createdAt).toLocaleDateString('en-IN')}
                        </small>
                      </td>
                      <td>
                        <span className={`badge bg-${claim.statusColor} d-flex align-items-center`} style={{width: 'fit-content'}}>
                          <i className={`bi ${claim.statusIcon} me-1`}></i>
                          {claim.status}
                        </span>
                      </td>
                      <td>
                        <span className="text-gray-600 small" title={claim.remarks}>
                          {claim.remarks.length > 30 ? `${claim.remarks.substring(0, 30)}...` : claim.remarks}
                        </span>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <button 
                            className="btn btn-outline-primary rounded-pill px-3" 
                            onClick={() => setViewingClaim(claim)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          {claim.status === 'Pending' && (
                            <button
                              className="btn btn-outline-secondary rounded-pill px-3"
                              onClick={() => {
                                setNewClaim({
                                  id: claim.id,
                                  type: claim.title,
                                  amount: claim.amount,
                                  date: claim.claimDate?.split("T")[0] || "",
                                  description: claim.description,
                                  documents: [],
                                  existingDocuments: claim.documents || [],
                                });
                                setSelectedPolicyId(String(claim.policyId));
                                setActiveTab("newClaim");
                              }}
                              title="Edit Claim"
                            >
                              <i className="bi bi-pencil"></i>
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

      {/* Enhanced View Claim Modal */}
      {viewingClaim && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header bg-gradient-primary text-white border-0">
                <h5 className="modal-title">
                  <i className="bi bi-wallet2 me-2"></i>
                  Claim Details #{viewingClaim.id}
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingClaim(null)}></button>
              </div>
              <div className="modal-body py-4">
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="fw-semibold text-gray-600 small">Claim Type</label>
                      <p className="mb-0 text-gray-800">{viewingClaim.title}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold text-gray-600 small">Amount</label>
                      <p className="mb-0 text-success fw-bold">{viewingClaim.formattedAmount}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold text-gray-600 small">Submitted On</label>
                      <p className="mb-0 text-gray-700">
                        {new Date(viewingClaim.createdAt).toLocaleDateString('en-IN', { 
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="fw-semibold text-gray-600 small">Status</label>
                      <p className="mb-0">
                        <span className={`badge bg-${viewingClaim.statusColor}`}>
                          <i className={`bi ${viewingClaim.statusIcon} me-1`}></i>
                          {viewingClaim.status}
                        </span>
                      </p>
                    </div>
                    <div className="mb-3">
  <label className="fw-semibold text-gray-600 small">Policy</label>
  <p className="mb-0 text-gray-700">
    {viewingClaim.policyId
      ? `#${viewingClaim.policyId}`
      : "Not linked to any policy"}
  </p>
</div>

                    <div className="mb-3">
                      <label className="fw-semibold text-gray-600 small">Last Updated</label>
                      <p className="mb-0 text-gray-700">
                        {new Date(viewingClaim.updatedAt || viewingClaim.createdAt).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <label className="fw-semibold text-gray-600 small">Description</label>
                  <p className="mb-0 text-gray-700" style={{ whiteSpace: 'pre-wrap' }}>{viewingClaim.description}</p>
                </div>

                <div className="mb-3">
                  <label className="fw-semibold text-gray-600 small">HR Remarks</label>
                  <div className="border rounded p-3 bg-light">
                    <p className="mb-0 text-gray-700">{viewingClaim.remarks || "No remarks provided yet."}</p>
                  </div>
                </div>

                <div>
                  <label className="fw-semibold text-gray-600 small">Supporting Documents</label>
                  {viewingClaim.documents && viewingClaim.documents.length > 0 ? (
                    <div className="list-group">
                      {viewingClaim.documents.map((doc, index) => (
                        <a 
                          key={index}
                          href={`http://localhost:8077${doc}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                        >
                          <span>
                            <i className="bi bi-file-earmark me-2"></i>
                            {doc.split("/").pop()}
                          </span>
                          <i className="bi bi-download text-primary"></i>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 mb-0">No documents uploaded</p>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button type="button" className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setViewingClaim(null)}>
                  <i className="bi bi-x-circle me-1"></i> Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

// ------------------ Enhanced New Claim Form ------------------
const renderNewClaimForm = () => {
  const isEditMode = !!newClaim.id;

  // Calculate remaining coverage for the selected policy
  let remainingCoverage = 0;
  if (selectedPolicyId) {
    const policy = policies.find(p => Number(p.id) === Number(selectedPolicyId));
    if (policy) {
      const approvedClaims = claims.filter(
        claim => Number(claim.policyId) === policy.id && claim.status === "Approved"
      );
      const totalClaimed = approvedClaims.reduce(
        (sum, claim) => sum + (Number(claim.amount) || 0),
        0
      );
      remainingCoverage = (policy.coverageAmount || 0) - totalClaimed;
    }
  }

  // Check if submit should be disabled
  const isSubmitDisabled = newClaim.amount > remainingCoverage || loading;

  return (
    <div className="container-fluid">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-gradient mb-2">
            {isEditMode ? "Edit Claim" : "Submit New Claim"}
          </h3>
          <p className="text-gray-600 mb-0">
            {isEditMode ? "Update your claim details" : "Fill in the details to submit a new claim"}
          </p>
        </div>
        <button className="btn btn-outline-secondary" onClick={() => setActiveTab("claims")}>
          <i className="bi bi-arrow-left me-1"></i> Back to Claims
        </button>
      </div>

      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3">
          <h5 className="card-title mb-0 text-gray-800">
            <i className="bi bi-wallet2 me-2"></i>
            Claim Information
          </h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleClaimSubmit}>
            <div className="row">
              {/* Policy Select */}
              <div className="col-md-6 mb-3">
                <label htmlFor="policySelect" className="form-label fw-semibold text-gray-700">
                  Select Policy <span className="text-danger">*</span>
                </label>
                <select
                  id="policySelect"
                  className="form-select"
                  value={selectedPolicyId}
                  onChange={(e) => {
                    const policyId = e.target.value;
                    setSelectedPolicyId(policyId);
                    setNewClaim(prev => ({ ...prev, policyId: policyId }));
                  }}
                  required
                >
                  <option value="">Choose a policy...</option>
                  {policies.map((policy) => {
                    const approvedClaims = claims.filter(
                      claim => Number(claim.policyId) === Number(policy.id) && claim.status === "Approved"
                    );
                    const totalClaimed = approvedClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount) || 0), 0);
                    const remainingAmount = (policy.coverageAmount || 0) - totalClaimed;

                    return (
                      <option key={policy.id} value={String(policy.id)}>
                        {policy.name} - ₹{remainingAmount.toLocaleString("en-IN")}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Claim Type */}
              <div className="col-md-6 mb-3">
                <label htmlFor="claimType" className="form-label fw-semibold text-gray-700">
                  Claim Type <span className="text-danger">*</span>
                </label>
                <select
                  className="form-select"
                  id="claimType"
                  value={newClaim.type}
                  onChange={(e) => setNewClaim(prev => ({ ...prev, type: e.target.value }))}
                  required
                >
                  <option value="">Select claim type...</option>
                  <option value="Health">Health Insurance</option>
                  <option value="Dental">Dental Insurance</option>
                  <option value="Vision">Vision Insurance</option>
                  <option value="Accident">Accident Insurance</option>
                  <option value="Life">Life Insurance</option>
                </select>
              </div>

              {/* Claim Amount */}
              <div className="col-md-6 mb-3">
                <label htmlFor="claimAmount" className="form-label fw-semibold text-gray-700">
                  Claim Amount <span className="text-danger">*</span>
                </label>
                <div className="input-group">
                  <span className="input-group-text bg-light">₹</span>
                  <input
                    type="number"
                    className="form-control"
                    id="claimAmount"
                    value={newClaim.amount || ""}
                    onChange={(e) => {
                      const value = Number(e.target.value);
                      setNewClaim(prev => ({ ...prev, amount: value }));
                    }}
                    min="0"
                    step="1"
                    placeholder="Enter amount"
                    required
                  />
                </div>

                {/* Warning Message */}
                {newClaim.amount > remainingCoverage && (
                  <small className="text-danger mt-1 d-block">
                    Entered amount exceeds remaining coverage (₹{remainingCoverage.toLocaleString("en-IN")})!
                  </small>
                )}
              </div>

              {/* Incident Date */}
              <div className="col-md-6 mb-3">
                <label htmlFor="claimDate" className="form-label fw-semibold text-gray-700">
                  Incident/Service Date <span className="text-danger">*</span>
                </label>
                <input
                  type="date"
                  className="form-control"
                  id="claimDate"
                  value={newClaim.date}
                  onChange={(e) => setNewClaim(prev => ({ ...prev, date: e.target.value }))}
                  max={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>
            </div>

            {/* Description */}
            <div className="mb-4">
              <label htmlFor="claimDescription" className="form-label fw-semibold text-gray-700">
                Description <span className="text-danger">*</span>
              </label>
              <textarea
                className="form-control"
                id="claimDescription"
                rows="4"
                value={newClaim.description}
                onChange={(e) => setNewClaim(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Provide detailed description of the claim..."
                required
              />
              <div className="form-text text-gray-600">
                Please include details about the incident, services received, and any other relevant information.
              </div>
            </div>

              {/* Enhanced Documents Section */}
              <div className="mb-4">
                <label className="form-label fw-semibold text-gray-700">Supporting Documents</label>
                
                {/* Upload Progress */}
                {Object.keys(fileUploadProgress).length > 0 && (
                  <div className="mb-3">
                    <label className="form-label text-gray-600 small">Uploading...</label>
                    {Object.entries(fileUploadProgress).map(([filename, progress]) => (
                      <div key={filename} className="mb-2">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <small className="text-gray-700">{filename}</small>
                          <small className="text-gray-600">{progress}%</small>
                        </div>
                        <div className="progress" style={{height: '4px'}}>
                          <div 
                            className="progress-bar progress-bar-striped progress-bar-animated" 
                            style={{width: `${progress}%`}}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Existing Documents */}
                {newClaim.existingDocuments?.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label text-gray-600 small">Current Documents</label>
                    <div className="row g-2">
                      {newClaim.existingDocuments.map((doc, index) => (
                        <div key={index} className="col-md-6">
                          <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-light">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-file-earmark text-primary me-2"></i>
                              <small className="text-truncate text-gray-700" style={{maxWidth: '200px'}}>
                                {doc.split("/").pop()}
                              </small>
                            </div>
                            <div>
                              <a href={`http://localhost:8077${doc}`} target="_blank" rel="noopener noreferrer"
                                 className="btn btn-sm btn-outline-primary me-1" title="View">
                                <i className="bi bi-eye"></i>
                              </a>
                              <button type="button" className="btn btn-sm btn-outline-danger" 
                                      onClick={() => handleRemoveExistingDocument(index)} title="Remove">
                                <i className="bi bi-trash"></i>
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* New Documents */}
                {newClaim.documents?.length > 0 && (
                  <div className="mb-3">
                    <label className="form-label text-gray-600 small">New Documents to Upload</label>
                    <div className="row g-2">
                      {newClaim.documents.map((file, index) => (
                        <div key={index} className="col-md-6">
                          <div className="d-flex justify-content-between align-items-center p-2 border rounded bg-light">
                            <div className="d-flex align-items-center">
                              <i className="bi bi-file-earmark-plus text-success me-2"></i>
                              <small className="text-truncate text-gray-700" style={{maxWidth: '200px'}}>
                                {file.name}
                              </small>
                            </div>
                            <button type="button" className="btn btn-sm btn-outline-danger" 
                                    onClick={() => handleRemoveNewDocument(index)} title="Remove">
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File Upload */}
                <div className="border rounded p-3 bg-light">
                  <div className="input-group">
                    <input
                      type="file"
                      className="form-control"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleDocumentUpload}
                    />
                    <span className="input-group-text bg-white">
                      <i className="bi bi-cloud-upload text-gray-600"></i>
                    </span>
                  </div>
                  <small className="text-gray-600">
                    Supported formats: PDF, JPG, PNG, DOC (Max 10MB each)
                  </small>
                </div>
              </div>

              {/* Form Actions */}
            <div className="d-flex justify-content-end gap-3 pt-3 border-top">
              <button 
                type="button" 
                className="btn btn-outline-secondary rounded-pill px-4" 
                onClick={() => setActiveTab("claims")}
              >
                <i className="bi bi-x-circle me-1"></i> Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-success rounded-pill px-4" 
                disabled={isSubmitDisabled} // ✅ Disabled if exceeds coverage or loading
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    {isEditMode ? "Updating..." : "Submitting..."}
                  </>
                ) : (
                  <>
                    <i className={`bi ${isEditMode ? 'bi-check-circle' : 'bi-send'} me-1`}></i>
                    {isEditMode ? "Update Claim" : "Submit Claim"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

  return activeTab === "newClaim" ? renderNewClaimForm() : renderClaimsList();
}