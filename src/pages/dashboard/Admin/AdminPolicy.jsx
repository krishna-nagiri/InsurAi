import React, { useState, useEffect } from "react";
import api from "../../../api";
import "bootstrap/dist/css/bootstrap.min.css";

// Color constants
const COLORS = {
  PRIMARY: '#8b0086',        // Purple
  ACCENT_2: '#d16ba5',       // Bright Orchid
  ACCENT_3: '#b57edc',       // Lavender Mist
  CONTRAST: '#5ce1e6',       // Cyan Aqua
  WARNING: '#f5c518',        // Gold
  BACKGROUND: '#ffffffff',     // Light Lavender White
  TEXT_MUTED: '#6b5b6e',     // Grayish Violet
  DARK: '#2b0938ff'          // Dark text
};

export default function AdminPolicy() {
  const [policyData, setPolicyData] = useState({
    policyNumber: "",
    policyName: "",
    policyType: "",
    providerName: "",
    coverageAmount: "",
    monthlyPremium: "",
    startDate: "",
    renewalDate: "",
    policyStatus: "Active",
    policyDescription: "",
  });

  const [policies, setPolicies] = useState([]);
  const [message, setMessage] = useState("");
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [viewPolicy, setViewPolicy] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const [policiesPerPage] = useState(5);

  // -------------------- Documents --------------------
  const [documents, setDocuments] = useState({
    contract: null,
    terms: null,
    claimForm: null,
    annexure: null,
  });

  const handleDocumentChange = (e) => {
    const { name, files } = e.target;
    setDocuments({ ...documents, [name]: files[0] });
  };

  // -------------------- Input Changes --------------------
  const handleChange = (e) => {
    setPolicyData({ ...policyData, [e.target.name]: e.target.value });
  };

  // -------------------- Convert raw S3 URL to public Supabase URL --------------------
  const formatPublicUrl = (url) => {
    if (!url) return null;
    if (url.includes("/object/public/")) return url;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const bucketIndex = pathParts.indexOf("s3") + 1;
      const bucket = pathParts[bucketIndex];
      const filePath = pathParts.slice(bucketIndex + 1).join("/");
      const projectDomain = urlObj.hostname.replace(".storage.", ".");
      return `https://${projectDomain}/storage/v1/object/public/${bucket}/${filePath}`;
    } catch {
      return url;
    }
  };

  // -------------------- Fetch Policies --------------------
  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/policies", { withCredentials: true });
      const formattedPolicies = response.data.map((p) => ({
        ...p,
        contractUrl: formatPublicUrl(p.contractUrl),
        termsUrl: formatPublicUrl(p.termsUrl),
        claimFormUrl: formatPublicUrl(p.claimFormUrl),
        annexureUrl: formatPublicUrl(p.annexureUrl),
      }));
      setPolicies(formattedPolicies);
      setMessage("");
    } catch (error) {
      console.error("Error fetching policies:", error);
      setMessage(
        error.response?.status === 403
          ? "❌ Forbidden: You are not authorized"
          : "❌ Failed to fetch policies."
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------- Submit Policy --------------------
  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  try {
    const token = localStorage.getItem("token");
    const formData = new FormData();

    // Fix: Ensure the JSON part is explicitly typed
    formData.append(
      "policy",
      new Blob([JSON.stringify(policyData)], { type: "application/json" })
    );

    // Fix: Only append files if they exist
    Object.keys(documents).forEach((key) => {
      if (documents[key]) formData.append(key, documents[key]);
    });

    await api.post("/admin/policies", formData, {
      headers: {
        "Authorization": `Bearer ${token}`,
        // DO NOT add Content-Type here
      },
    });

    setMessage("✅ Policy saved successfully!");
    resetForm();
    fetchPolicies();
  } catch (error) {
    console.error("Submission error:", error.response?.data);
    setMessage(`❌ ${error.response?.data || "Failed to submit policy"}`);
  } finally {
    setLoading(false);
  }
};

  // -------------------- Reset Form --------------------
  const resetForm = () => {
    setPolicyData({
      policyNumber: "",
      policyName: "",
      policyType: "",
      providerName: "",
      coverageAmount: "",
      monthlyPremium: "",
      startDate: "",
      renewalDate: "",
      policyStatus: "Active",
      policyDescription: "",
    });
    setDocuments({ contract: null, terms: null, claimForm: null, annexure: null });
    setEditingPolicyId(null);
  };

  // -------------------- Edit Policy --------------------
  const handleEdit = (policy) => {
    setPolicyData(policy);
    setEditingPolicyId(policy.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // -------------------- Delete Policy --------------------
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this policy?")) return;
    setLoading(true);
    try {
      await api.delete(`/admin/policies/${id}`, { withCredentials: true });
      setMessage("✅ Policy deleted successfully!");
      fetchPolicies();
    } catch (error) {
      console.error("Error deleting policy:", error);
      setMessage(
        error.response?.status === 403
          ? "❌ Forbidden: You are not authorized"
          : "❌ Failed to delete policy. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  // -------------------- View Policy Modal --------------------
  const handleView = (policy) => setViewPolicy(policy);
  const closeModal = () => setViewPolicy(null);

  // -------------------- Filter and Search --------------------
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = policy.policyName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.policyNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         policy.providerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || policy.policyStatus === statusFilter;
    const matchesType = typeFilter === "All" || policy.policyType === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

  // -------------------- Pagination --------------------
  const indexOfLastPolicy = currentPage * policiesPerPage;
  const indexOfFirstPolicy = indexOfLastPolicy - policiesPerPage;
  const currentPolicies = filteredPolicies.slice(indexOfFirstPolicy, indexOfLastPolicy);
  const totalPages = Math.ceil(filteredPolicies.length / policiesPerPage);

  // -------------------- Statistics --------------------
  const stats = {
    total: policies.length,
    active: policies.filter(p => p.policyStatus === "Active").length,
    inactive: policies.filter(p => p.policyStatus === "Inactive").length,
    health: policies.filter(p => p.policyType === "Health").length,
    life: policies.filter(p => p.policyType === "Life").length,
  };

  // -------------------- Load Policies on Mount --------------------
  useEffect(() => {
    fetchPolicies();
  }, []);

  return (
    <div className="admin-policy-management" style={{ backgroundColor: COLORS.BACKGROUND, minHeight: '100vh' }}>
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 style={{ color: COLORS.DARK }} className="fw-bold mb-1">
            {editingPolicyId ? "Edit Policy" : "Policy Management"}
          </h3>
          <p style={{ color: COLORS.TEXT_MUTED }} className="mb-0">
            {editingPolicyId ? "Update existing policy details" : "Create and manage insurance policies"}
          </p>
        </div>
        <div className="text-end">
          <div className="badge" style={{ backgroundColor: COLORS.PRIMARY }}>
            <i className="bi bi-circle-fill me-1" style={{ fontSize: '6px' }}></i>
            {stats.total} Total Policies
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm h-100" style={{ borderLeft: `4px solid ${COLORS.PRIMARY}` }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: COLORS.PRIMARY }}>
                    Total Policies
                  </div>
                  <div className="h2 mb-0 font-weight-bold" style={{ color: COLORS.DARK }}>{stats.total}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-file-earmark-text fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm h-100" style={{ borderLeft: `4px solid ${COLORS.CONTRAST}` }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: COLORS.CONTRAST }}>
                    Active Policies
                  </div>
                  <div className="h2 mb-0 font-weight-bold" style={{ color: COLORS.DARK }}>{stats.active}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-check-circle fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm h-100" style={{ borderLeft: `4px solid ${COLORS.ACCENT_3}` }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: COLORS.ACCENT_3 }}>
                    Health Policies
                  </div>
                  <div className="h2 mb-0 font-weight-bold" style={{ color: COLORS.DARK }}>{stats.health}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-heart-pulse fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-3 col-md-6 mb-4">
          <div className="card shadow-sm h-100" style={{ borderLeft: `4px solid ${COLORS.ACCENT_2}` }}>
            <div className="card-body">
              <div className="row no-gutters align-items-center">
                <div className="col mr-2">
                  <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: COLORS.ACCENT_2 }}>
                    Life Policies
                  </div>
                  <div className="h2 mb-0 font-weight-bold" style={{ color: COLORS.DARK }}>{stats.life}</div>
                </div>
                <div className="col-auto">
                  <i className="bi bi-person-heart fa-2x text-gray-300"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policy Form Card */}
      <div className="card shadow-sm border-0 mb-4">
        <div className="card-header bg-white py-3">
          <h5 className="m-0 font-weight-bold" style={{ color: COLORS.DARK }}>
            <i className="bi bi-plus-circle me-2"></i>
            {editingPolicyId ? "Edit Policy" : "Create New Policy"}
          </h5>
        </div>
        <div className="card-body">
          {message && (
            <div className={`alert ${message.includes('✅') ? 'alert-success' : 'alert-danger'} alert-dismissible fade show`}>
              {message}
              <button type="button" className="btn-close" onClick={() => setMessage('')}></button>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Policy Number *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="policyNumber" 
                    value={policyData.policyNumber} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter unique policy number"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Policy Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="policyName" 
                    value={policyData.policyName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter policy name"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Policy Type *</label>
                  <select className="form-select" name="policyType" value={policyData.policyType} onChange={handleChange} required>
                    <option value="">Select Policy Type</option>
                    <option value="Health">Health Insurance</option>
                    <option value="Accident">Accident Insurance</option>
                    <option value="Life">Life Insurance</option>
                    <option value="Corporate Benefit">Corporate Benefit</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Provider Name *</label>
                  <input 
                    type="text" 
                    className="form-control" 
                    name="providerName" 
                    value={policyData.providerName} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter insurance provider"
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Coverage Amount (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="coverageAmount" 
                    value={policyData.coverageAmount} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter coverage amount"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Monthly Premium (₹) *</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    name="monthlyPremium" 
                    value={policyData.monthlyPremium} 
                    onChange={handleChange} 
                    required 
                    placeholder="Enter monthly premium"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Start Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="startDate" 
                    value={policyData.startDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Renewal Date *</label>
                  <input 
                    type="date" 
                    className="form-control" 
                    name="renewalDate" 
                    value={policyData.renewalDate} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Policy Status</label>
                  <select className="form-select" name="policyStatus" value={policyData.policyStatus} onChange={handleChange}>
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold" style={{ color: COLORS.DARK }}>Policy Description</label>
              <textarea 
                className="form-control" 
                rows="3" 
                name="policyDescription" 
                value={policyData.policyDescription} 
                onChange={handleChange}
                placeholder="Enter policy description and benefits..."
              />
            </div>

            {/* Document Uploads */}
            <div className="mb-4">
              <h6 style={{ color: COLORS.DARK }} className="mb-3">
                <i className="bi bi-paperclip me-2"></i>
                Policy Documents
              </h6>
              <div className="row">
                {["contract", "terms", "claimForm", "annexure"].map((doc) => (
                  <div key={doc} className="col-md-6 mb-3">
                    <label className="form-label" style={{ color: COLORS.TEXT_MUTED }}>
                      {doc.charAt(0).toUpperCase() + doc.slice(1)} Document
                      {documents[doc] && <span className="text-success ms-2">✓ Selected</span>}
                    </label>
                    <input 
                      type="file" 
                      className="form-control" 
                      name={doc} 
                      onChange={handleDocumentChange} 
                      accept=".pdf,.doc,.docx" 
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex gap-2">
              <button 
                type="submit" 
                className="btn px-4"
                style={{ backgroundColor: COLORS.PRIMARY, color: 'white', borderColor: COLORS.PRIMARY }}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    {editingPolicyId ? "Updating..." : "Creating..."}
                  </>
                ) : (
                  <>
                    <i className={`bi ${editingPolicyId ? 'bi-check' : 'bi-plus'} me-2`}></i>
                    {editingPolicyId ? "Update Policy" : "Create Policy"}
                  </>
                )}
              </button>
              
              {editingPolicyId && (
                <button 
                  type="button" 
                  className="btn btn-outline-secondary px-4"
                  onClick={resetForm}
                  disabled={loading}
                >
                  <i className="bi bi-x me-2"></i>
                  Cancel Edit
                </button>
              )}
            </div>
          </form>
        </div>
      </div>

      {/* Policies List Section */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
          <h5 className="m-0 font-weight-bold" style={{ color: COLORS.DARK }}>
            <i className="bi bi-list-ul me-2"></i>
            Policy List
            <span className="badge ms-2" style={{ backgroundColor: COLORS.PRIMARY }}>{filteredPolicies.length}</span>
          </h5>
          
          <div className="d-flex gap-2 align-items-center">
            {/* Search */}
            <div className="input-group input-group-sm" style={{ width: '250px' }}>
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search" style={{ color: COLORS.TEXT_MUTED }}></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0"
                placeholder="Search policies..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            {/* Filters */}
            <select
              className="form-select form-select-sm w-auto"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>

            <select
              className="form-select form-select-sm w-auto"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="All">All Types</option>
              <option value="Health">Health</option>
              <option value="Accident">Accident</option>
              <option value="Life">Life</option>
              <option value="Corporate Benefit">Corporate Benefit</option>
            </select>
          </div>
        </div>

        <div className="card-body p-0">
          {loading ? (
            <div className="text-center py-5">
              <div className="spinner-border" style={{ color: COLORS.PRIMARY }}></div>
              <p style={{ color: COLORS.TEXT_MUTED }}>Loading policies...</p>
            </div>
          ) : currentPolicies.length === 0 ? (
            <div className="text-center py-5">
              <i className="bi bi-file-earmark-x display-1 d-block mb-3" style={{ color: `${COLORS.ACCENT_3}30` }}></i>
              <h5 style={{ color: COLORS.TEXT_MUTED }}>No policies found</h5>
              <p style={{ color: COLORS.TEXT_MUTED }} className="mb-0">
                {policies.length === 0 
                  ? "No policies created yet. Create your first policy above."
                  : "Try adjusting your search or filters"
                }
              </p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="bg-light">
                  <tr>
                    <th className="border-0 font-weight-bold" style={{ color: COLORS.DARK }}>Policy Details</th>
                    <th className="border-0 font-weight-bold" style={{ color: COLORS.DARK }}>Coverage</th>
                    <th className="border-0 font-weight-bold" style={{ color: COLORS.DARK }}>Premium</th>
                    <th className="border-0 font-weight-bold" style={{ color: COLORS.DARK }}>Status</th>
                    <th className="border-0 font-weight-bold" style={{ color: COLORS.DARK }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentPolicies.map((policy) => (
                    <tr key={policy.id} className="border-bottom">
                      <td>
                        <div className="d-flex align-items-center">
                          <div 
                            className="avatar-sm rounded-circle d-flex align-items-center justify-content-center me-3 text-white fw-bold shadow-sm"
                            style={{
                              backgroundColor: policy.policyType === "Health" ? COLORS.ACCENT_3 : 
                                             policy.policyType === "Life" ? COLORS.CONTRAST : 
                                             policy.policyType === "Accident" ? COLORS.WARNING : COLORS.TEXT_MUTED,
                              width: "40px",
                              height: "40px"
                            }}
                          >
                            {policy.policyName?.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="fw-semibold" style={{ color: COLORS.DARK }}>{policy.policyName}</div>
                            <div className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>
                              #{policy.policyNumber} • {policy.policyType}
                            </div>
                            <div className="text-xs" style={{ color: COLORS.TEXT_MUTED }}>{policy.providerName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="align-middle">
                        <div className="fw-bold" style={{ color: COLORS.DARK }}>₹{policy.coverageAmount}</div>
                        <small style={{ color: COLORS.TEXT_MUTED }}>Coverage</small>
                      </td>
                      <td className="align-middle">
                        <div className="fw-bold" style={{ color: COLORS.DARK }}>₹{policy.monthlyPremium}</div>
                        <small style={{ color: COLORS.TEXT_MUTED }}>Monthly</small>
                      </td>
                      <td className="align-middle">
                        <span className={`badge ${policy.policyStatus === "Active" ? "bg-success" : "bg-warning"} shadow-sm`}>
                          <i className={`bi ${policy.policyStatus === "Active" ? "bi-check-circle" : "bi-pause-circle"} me-1`}></i>
                          {policy.policyStatus}
                        </span>
                      </td>
                      <td className="align-middle">
                        <div className="d-flex gap-1">
                          <button 
                            className="btn btn-sm btn-outline-primary rounded-pill px-3"
                            style={{ color: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }}
                            onClick={() => handleView(policy)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-info rounded-pill px-3"
                            onClick={() => handleEdit(policy)}
                            title="Edit Policy"
                          >
                            <i className="bi bi-pencil"></i>
                          </button>
                          <button 
                            className="btn btn-sm btn-outline-danger rounded-pill px-3"
                            style={{ color: COLORS.ACCENT_2, borderColor: COLORS.ACCENT_2 }}
                            onClick={() => handleDelete(policy.id)}
                            title="Delete Policy"
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>
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
              <div className="small" style={{ color: COLORS.TEXT_MUTED }}>
                Showing {indexOfFirstPolicy + 1} to {Math.min(indexOfLastPolicy, filteredPolicies.length)} of {filteredPolicies.length} entries
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

      {/* Enhanced View Modal */}
      {viewPolicy && (
        <div 
          className="modal fade show d-block"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          tabIndex="-1"
          onClick={closeModal}
        >
          <div className="modal-dialog modal-lg" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content border-0 shadow-lg">
              <div className="modal-header border-0" style={{ backgroundColor: COLORS.PRIMARY, color: 'white' }}>
                <h5 className="modal-title">
                  <i className="bi bi-file-earmark-text me-2"></i>
                  {viewPolicy.policyName} - Policy Details
                </h5>
                <button type="button" className="btn-close btn-close-white" onClick={closeModal}></button>
              </div>
              <div className="modal-body overflow-auto" style={{ maxHeight: '70vh' }}>
                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Policy Number</label>
                      <p style={{ color: COLORS.DARK }}>{viewPolicy.policyNumber}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Policy Type</label>
                      <p style={{ color: COLORS.DARK }}>{viewPolicy.policyType}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Provider Name</label>
                      <p style={{ color: COLORS.DARK }}>{viewPolicy.providerName}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Coverage Amount</label>
                      <p style={{ color: COLORS.DARK }}>₹{viewPolicy.coverageAmount}</p>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Monthly Premium</label>
                      <p style={{ color: COLORS.DARK }}>₹{viewPolicy.monthlyPremium}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Start Date</label>
                      <p style={{ color: COLORS.DARK }}>{viewPolicy.startDate}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Renewal Date</label>
                      <p style={{ color: COLORS.DARK }}>{viewPolicy.renewalDate}</p>
                    </div>
                    <div className="mb-3">
                      <label className="fw-semibold" style={{ color: COLORS.DARK }}>Status</label>
                      <p>
                        <span className={`badge ${viewPolicy.policyStatus === "Active" ? "bg-success" : "bg-warning"}`}>
                          {viewPolicy.policyStatus}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="fw-semibold" style={{ color: COLORS.DARK }}>Policy Description</label>
                  <p style={{ color: COLORS.DARK }}>{viewPolicy.policyDescription || "No description provided."}</p>
                </div>

                {/* Document Links */}
                <div className="mt-4">
                  <h6 style={{ color: COLORS.DARK }} className="mb-3">
                    <i className="bi bi-paperclip me-2"></i>
                    Policy Documents
                  </h6>
                  <div className="row">
                    {["contractUrl", "termsUrl", "claimFormUrl", "annexureUrl"].map((urlKey) =>
                      viewPolicy[urlKey] ? (
                        <div key={urlKey} className="col-md-6 mb-2">
                          <a
                            href={viewPolicy[urlKey]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline-primary btn-sm w-100 text-start"
                            style={{ color: COLORS.PRIMARY, borderColor: COLORS.PRIMARY }}
                          >
                            <i className="bi bi-download me-2"></i>
                            Download {urlKey.replace("Url", "").replace(/([A-Z])/g, ' $1').trim()}
                          </a>
                        </div>
                      ) : null
                    )}
                  </div>
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  type="button"
                  className="btn btn-secondary rounded-pill px-4"
                  onClick={closeModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}