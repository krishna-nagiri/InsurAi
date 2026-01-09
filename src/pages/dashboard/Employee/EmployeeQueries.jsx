import React, { useState, useMemo } from "react";

export default function EmployeeQueries({
  activeTab,
  setActiveTab,
  queries = [],
  newQuery,
  setNewQuery,
  agentsAvailability = [],
  selectedAgentId,
  setSelectedAgentId,
  policies = [],
  loading,
  handleQuerySubmit,
  handleQueryInputChange,
}) {
  const [selectedQuery, setSelectedQuery] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");

  const [claimTypes] = useState([
    { id: 1, name: "Health" },
    { id: 2, name: "Accident" },
    { id: 3, name: "Travel" },
    { id: 4, name: "Dental" },
    { id: 5, name: "Vision" },
    { id: 6, name: "Life" },
  ]);

  // Query statistics
  const queryStats = useMemo(() => {
    const total = queries.length;
    const answered = queries.filter(q => q.response && q.response.trim() !== "").length;
    const pending = total - answered;
    const recent = queries.filter(q => (new Date() - new Date(q.createdAt)) / (1000 * 60 * 60 * 24) <= 7).length;
    const avgResponseTime =
      answered > 0
        ? queries.reduce((sum, q) => {
            if (q.response && q.createdAt && q.updatedAt) {
              return sum + (new Date(q.updatedAt) - new Date(q.createdAt)) / (1000 * 60 * 60);
            }
            return sum;
          }, 0) / answered
        : 0;
    return { total, answered, pending, recent, avgResponseTime };
  }, [queries]);

  // Filtered & sorted queries
  const filteredAndSortedQueries = useMemo(() => {
    let filtered = queries.filter(query => {
      const matchesSearch =
        query.queryText?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.response?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        query.id?.toString().includes(searchTerm);
      const isAnswered = query.response && query.response.trim() !== "";
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "answered" && isAnswered) ||
        (statusFilter === "pending" && !isAnswered);
      return matchesSearch && matchesStatus;
    });

    filtered.sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.createdAt) - new Date(a.createdAt);
        case "oldest":
          return new Date(a.createdAt) - new Date(b.createdAt);
        case "recently-updated":
          return new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt);
        case "status":
          const aAnswered = a.response && a.response.trim() !== "";
          const bAnswered = b.response && b.response.trim() !== "";
          return aAnswered === bAnswered ? 0 : aAnswered ? 1 : -1;
        default:
          return 0;
      }
    });

    return filtered;
  }, [queries, searchTerm, statusFilter, sortBy]);

  const getStatusColor = query => (query.response && query.response.trim() !== "" ? "success" : "warning");
  const getStatusIcon = query => (query.response && query.response.trim() !== "" ? "bi-check-circle-fill" : "bi-clock-fill");

  // Render "Ask Query" form
  const renderAskQuery = () => (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h3 className="fw-bold text-gradient mb-2">Ask a Question</h3>
          <p className="text-gray-600 mb-0">Get assistance from our support agents</p>
        </div>
        <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setActiveTab("myQueries")}>
          <i className="bi bi-arrow-left me-2"></i> Back to Queries
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0 mb-4">
            <div className="card-header bg-white py-3">
              <h5 className="card-title mb-0 text-gray-800">
                <i className="bi bi-question-circle me-2"></i> Submit New Query
              </h5>
            </div>
            <div className="card-body">
              <form onSubmit={handleQuerySubmit}>
                {/* Policy Selection */}
                <div className="mb-4">
                  <label htmlFor="policySelect" className="form-label fw-semibold text-gray-700">
                    Select Policy <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="policySelect"
                    value={newQuery.policyId ? String(newQuery.policyId) : ""}
                    onChange={e => handleQueryInputChange("policyId", e.target.value)}
                    required
                  >
                    <option value="">Choose a policy...</option>
                    {policies.map(policy => (
                      <option key={policy.id} value={String(policy.id)}>
                        {policy.name} - ₹{policy.coverage_amount?.toLocaleString("en-IN")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Claim Type */}
                <div className="mb-4">
                  <label htmlFor="claimTypeSelect" className="form-label fw-semibold text-gray-700">
                    Claim Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="claimTypeSelect"
                    value={newQuery.claimType || ""}
                    onChange={e => handleQueryInputChange("claimType", e.target.value)}
                    required
                  >
                    <option value="">Select claim type...</option>
                    {claimTypes.map(type => (
                      <option key={type.id} value={type.name}>
                        {type.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Query Text */}
                <div className="mb-4">
                  <label htmlFor="queryText" className="form-label fw-semibold text-gray-700">
                    Your Question <span className="text-danger">*</span>
                  </label>
                  <textarea
                    className="form-control"
                    id="queryText"
                    rows="6"
                    value={newQuery.queryText}
                    onChange={e => handleQueryInputChange("queryText", e.target.value)}
                    placeholder="Provide detailed info for better assistance..."
                    required
                    style={{ resize: "vertical" }}
                  ></textarea>
                  <div className="form-text text-gray-600">
                    <i className="bi bi-info-circle me-1"></i> Include policy numbers, claim IDs, or dates if applicable.
                  </div>
                </div>

                {/* Agent Selection */}
                <div className="mb-4">
                  <label htmlFor="assignedAgent" className="form-label fw-semibold text-gray-700">
                    Assign to Agent <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    id="assignedAgent"
                    value={selectedAgentId}
                    onChange={e => setSelectedAgentId(e.target.value)}
                    required
                  >
                    <option value="">Choose an agent...</option>
                    {agentsAvailability.length > 0 ? (
                      agentsAvailability.map(a => (
                        <option
                          key={a.id}
                          value={a.agent.id}
                          disabled={!a.available}
                          className={a.available ? "text-success" : "text-muted"}
                        >
                          {a.agent.name} • {a.available ? "🟢 Online" : "🔴 Offline"}
                          {a.specialization && ` • ${a.specialization}`}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>
                        No agents available at the moment
                      </option>
                    )}
                  </select>
                  <div className="form-text text-gray-600">
                    <i className="bi bi-lightbulb me-1"></i> Online agents typically respond within 2-4 hours
                  </div>
                </div>

                {/* Submit */}
                <div className="d-grid">
                  <button type="submit" className="btn btn-primary btn-lg shadow-sm" disabled={loading}>
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status"></span> Submitting...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-send-fill me-2"></i> Submit Question
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>


      


        {/* Enhanced Agent Availability Panel */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            {/* Online Agents Count */}
            <div className="card border-left-success shadow-sm h-100 py-2 mb-4">
              <div className="card-body">
                <div className="d-flex align-items-center">
                  <div className="flex-grow-1">
                    <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                      Agents Online
                    </div>
                    <div className="h5 mb-0 font-weight-bold text-gray-800">
                      {agentsAvailability.filter(a => a.available).length}
                    </div>
                    <div className="text-xs text-gray-600">
                      Ready to assist you
                    </div>
                  </div>
                  <div className="col-auto">
                    <i className="bi bi-person-check fa-2x text-gray-300"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Agents List */}
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white py-3">
                <h6 className="card-title mb-0 text-gray-800">
                  <i className="bi bi-people me-2"></i>
                  Available Agents
                </h6>
              </div>
              <div className="card-body">
                {agentsAvailability.length > 0 ? (
                  agentsAvailability.map((agentAvailability) => (
                    <div
                      key={agentAvailability.id}
                      className={`card mb-3 border-0 shadow-sm ${!agentAvailability.available ? 'opacity-75' : ''}`}
                    >
                      <div className={`card-body p-3 ${agentAvailability.available ? 'bg-light-success' : 'bg-light-secondary'}`}>
                        {/* Agent Header */}
                        <div className="d-flex align-items-center mb-2">
                          <div className={`rounded-circle me-3 ${agentAvailability.available ? 'bg-success' : 'bg-secondary'}`}
                               style={{ width: "12px", height: "12px" }}></div>
                          <div className="flex-grow-1">
                            <h6 className="mb-0 fw-semibold text-gray-800">{agentAvailability.agent.name}</h6>
                            <small className={`badge ${agentAvailability.available ? 'bg-success' : 'bg-secondary'}`}>
                              {agentAvailability.available ? "Online" : "Offline"}
                            </small>
                          </div>
                        </div>

                        {/* Agent Details */}
                        <div className="small text-gray-600">
                          {agentAvailability.agent.email && (
                            <div className="mb-1">
                              <i className="bi bi-envelope me-1"></i>
                              {agentAvailability.agent.email}
                            </div>
                          )}
                          
                          {agentAvailability.agent.specialization && (
                            <div className="mb-1">
                              <i className="bi bi-tags me-1"></i>
                              {agentAvailability.agent.specialization}
                            </div>
                          )}

                          {agentAvailability.startTime && agentAvailability.endTime && (
                            <div className="mb-1">
                              <i className="bi bi-clock me-1"></i>
                              Available until {new Date(agentAvailability.endTime).toLocaleTimeString()}
                            </div>
                          )}
                        </div>

                        {!agentAvailability.available && (
                          <div className="alert alert-warning p-2 mt-2 mb-0 small">
                            <i className="bi bi-info-circle me-1"></i>
                            Check back later for availability
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-person-x display-4 text-gray-300"></i>
                    <p className="text-gray-600 mt-2">No agents available</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Tips */}
            <div className="card shadow-sm border-0 mt-4">
              <div className="card-header bg-white py-3">
                <h6 className="card-title mb-0 text-gray-800">
                  <i className="bi bi-lightbulb me-2"></i>
                  Quick Tips
                </h6>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-check-circle text-success me-2 mt-1"></i>
                  <small className="text-gray-600">Be specific about your issue for faster resolution</small>
                </div>
                <div className="d-flex align-items-start mb-3">
                  <i className="bi bi-check-circle text-success me-2 mt-1"></i>
                  <small className="text-gray-600">Include relevant policy or claim numbers</small>
                </div>
                <div className="d-flex align-items-start">
                  <i className="bi bi-check-circle text-success me-2 mt-1"></i>
                  <small className="text-gray-600">Check existing queries before submitting new ones</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

 // Enhanced My Queries List
const renderMyQueries = () => (
  <div className="container-fluid">
    {/* Header with Stats */}
    <div className="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 className="fw-bold text-gradient mb-2">My Support Queries</h3>
        <p className="text-gray-600 mb-0">Track and manage your support requests</p>
      </div>
      <button
        className="btn btn-primary shadow-sm"
        onClick={() => setActiveTab("askQuery")}
      >
        <i className="bi bi-plus-circle me-2"></i> Ask New Question
      </button>
    </div>

    {/* Enhanced Statistics Cards */}
    <div className="row mb-4">
      {/* Total Queries */}
      <div className="col-xl-2 col-md-4 mb-3">
        <div className="card border-left-primary shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                  Total Queries
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">{queryStats.total}</div>
              </div>
              <div className="col-auto">
                <i className="bi bi-chat-left-text fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Answered */}
      <div className="col-xl-2 col-md-4 mb-3">
        <div className="card border-left-success shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                  Answered
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">{queryStats.answered}</div>
              </div>
              <div className="col-auto">
                <i className="bi bi-check-circle fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Pending */}
      <div className="col-xl-2 col-md-4 mb-3">
        <div className="card border-left-warning shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                  Pending
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">{queryStats.pending}</div>
              </div>
              <div className="col-auto">
                <i className="bi bi-clock-history fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Recent */}
      <div className="col-xl-3 col-md-6 mb-3">
        <div className="card border-left-info shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                  Recent (7 days)
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">{queryStats.recent}</div>
              </div>
              <div className="col-auto">
                <i className="bi bi-star fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Avg Response */}
      <div className="col-xl-3 col-md-6 mb-3">
        <div className="card border-left-secondary shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-secondary text-uppercase mb-1">
                  Avg. Response Time
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">
                  {queryStats.avgResponseTime > 0 ? `${queryStats.avgResponseTime.toFixed(1)}h` : 'N/A'}
                </div>
              </div>
              <div className="col-auto">
                <i className="bi bi-speedometer2 fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Filters */}
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
                placeholder="Search queries..."
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
              <option value="answered">Answered</option>
              <option value="pending">Pending</option>
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
              <option value="recently-updated">Recently Updated</option>
              <option value="status">Status</option>
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

    {/* Queries Table */}
    <div className="card shadow-sm border-0">
      <div className="card-header bg-white py-3">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="font-weight-bold text-gray-800 mb-0">
            Query History
            <span className="badge bg-primary ms-2">{filteredAndSortedQueries.length}</span>
          </h6>
          <div className="text-gray-600 small">
            Showing {filteredAndSortedQueries.length} of {queries.length} queries
          </div>
        </div>
      </div>
      <div className="card-body p-0">
        {filteredAndSortedQueries.length === 0 ? (
          <div className="text-center py-5">
            <i className="bi bi-question-circle display-4 text-gray-300 mb-3"></i>
            <h5 className="text-gray-500">No queries found</h5>
            <p className="text-gray-600 mb-4">
              {queries.length === 0 ? "You haven't submitted any queries yet." : "No queries match your current filters."}
            </p>
            {queries.length === 0 && (
              <button
                className="btn btn-primary"
                onClick={() => setActiveTab("askQuery")}
              >
                <i className="bi bi-plus-circle me-2"></i> Ask Your First Question
              </button>
            )}
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="text-gray-700 font-weight-bold">Query ID</th>
                  <th className="text-gray-700 font-weight-bold">Question</th>
                  <th className="text-gray-700 font-weight-bold">Policy Name</th>
                  <th className="text-gray-700 font-weight-bold">Claim Type</th>
                  <th className="text-gray-700 font-weight-bold">Response</th>
                  <th className="text-gray-700 font-weight-bold">Created</th>
                  <th className="text-gray-700 font-weight-bold">Status</th>
                  <th className="text-gray-700 font-weight-bold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedQueries.map((query) => {
                  const isAnswered = query.response && query.response.trim() !== "";
                  return (
                    <tr key={query.id} className="border-bottom">
                      <td><strong className="text-primary">#{query.id}</strong></td>
                      <td>
                        <div className="text-truncate" style={{ maxWidth: '200px' }} title={query.queryText}>
                          {query.queryText}
                        </div>
                      </td>
                      <td>{query.policyName || "-"}</td>
                      <td>{query.claimType || "-"}</td>
                      <td>
                        {isAnswered ? (
                          <div className="text-truncate text-success" style={{ maxWidth: '200px' }} title={query.response}>
                            <i className="bi bi-check-circle me-1"></i>{query.response}
                          </div>
                        ) : (
                          <span className="text-gray-600"><i className="bi bi-clock me-1"></i> Awaiting response</span>
                        )}
                      </td>
                      <td><small>{query.createdAt ? new Date(query.createdAt).toLocaleDateString('en-IN') : "-"}</small></td>
                      <td>
                        <span className={`badge bg-${getStatusColor(query)} d-flex align-items-center`} style={{ width: 'fit-content' }}>
                          <i className={`bi ${getStatusIcon(query)} me-1`}></i>
                          {isAnswered ? "Answered" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-sm btn-outline-primary rounded-pill px-3"
                          onClick={() => { setSelectedQuery(query); setActiveTab("queryDetails"); }}
                          title="View full details"
                        >
                          <i className="bi bi-eye"></i>
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  </div>
);


 // Enhanced Query Details View
const renderQueryDetails = () => {
  if (!selectedQuery) {
    return (
      <div className="p-4 text-center">
        <i className="bi bi-exclamation-triangle display-4 text-gray-300"></i>
        <h5 className="text-gray-500 mt-3">No query selected</h5>
        <button
          className="btn btn-secondary mt-3"
          onClick={() => {
            setActiveTab("myQueries");
            setSelectedQuery(null);
          }}
        >
          <i className="bi bi-arrow-left me-1"></i> Back to My Queries
        </button>
      </div>
    );
  }

  const isAnswered = selectedQuery.response && selectedQuery.response.trim() !== "";

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-gray-800 mb-1">Query Details</h4>
          <p className="text-gray-600 mb-0">Complete information about your support request</p>
        </div>
        <button
          className="btn btn-outline-secondary rounded-pill px-4"
          onClick={() => setActiveTab("myQueries")}
        >
          <i className="bi bi-arrow-left me-2"></i> Back to Queries
        </button>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
              <h5 className="card-title mb-0 text-gray-800">
                <i className="bi bi-chat-left-text me-2"></i>
                Query #{selectedQuery.id}
              </h5>
              <span className={`badge bg-${getStatusColor(selectedQuery)}`}>
                <i className={`bi ${getStatusIcon(selectedQuery)} me-1`}></i>
                {isAnswered ? "Answered" : "Pending"}
              </span>
            </div>
            <div className="card-body">
              {/* Query Section */}
              <div className="mb-4">
                <label className="fw-semibold text-gray-600 small mb-2">Your Question</label>
                <div className="border rounded p-3 bg-light">
                  <p className="mb-0 text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>
                    {selectedQuery.queryText}
                  </p>
                </div>
              </div>

              {/* Policy & Claim Info */}
              <div className="mb-4 row">
                <div className="col-md-6 mb-3">
                  <label className="fw-semibold text-gray-600 small mb-1">Policy Name</label>
                  <div className="border rounded p-2 bg-light text-gray-800">
                    {selectedQuery.policyName || "-"}
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="fw-semibold text-gray-600 small mb-1">Claim Type</label>
                  <div className="border rounded p-2 bg-light text-gray-800">
                    {selectedQuery.claimType || "-"}
                  </div>
                </div>
              </div>

              {/* Response Section */}
              <div className="mb-4">
                <label className="fw-semibold text-gray-600 small mb-2">
                  Agent Response
                  {isAnswered && <i className="bi bi-check-circle text-success ms-2"></i>}
                </label>
                <div className={`border rounded p-3 ${isAnswered ? 'bg-light-success' : 'bg-light-warning'}`}>
                  {isAnswered ? (
                    <p className="mb-0 text-gray-800" style={{ whiteSpace: 'pre-wrap' }}>{selectedQuery.response}</p>
                  ) : (
                    <div className="text-center py-3">
                      <i className="bi bi-clock text-warning fs-1"></i>
                      <p className="text-gray-600 mt-2 mb-0">Awaiting response from agent</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="fw-semibold text-gray-600 small">Created</label>
                    <p className="mb-0 text-gray-800">
                      {selectedQuery.createdAt ? new Date(selectedQuery.createdAt).toLocaleString('en-IN') : "-"}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="fw-semibold text-gray-600 small">Last Updated</label>
                    <p className="mb-0 text-gray-800">
                      {selectedQuery.updatedAt ? new Date(selectedQuery.updatedAt).toLocaleString('en-IN') : "-"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Agent Information */}
              {selectedQuery.agent && (
                <div className="border-top pt-3">
                  <label className="fw-semibold text-gray-600 small mb-2">Assigned Agent</label>
                  <div className="d-flex align-items-center p-3 bg-light rounded">
                    <i className="bi bi-person-circle text-primary fs-4 me-3"></i>
                    <div>
                      <h6 className="mb-1 text-gray-800">{selectedQuery.agent.name}</h6>
                      <p className="text-gray-600 mb-0 small">{selectedQuery.agent.email}</p>
                      {selectedQuery.agent.specialization && (
                        <span className="badge bg-info small mt-1">{selectedQuery.agent.specialization}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Enhanced Sidebar with Quick Actions */}
        <div className="col-lg-4">
          <div className="sticky-top" style={{ top: '20px' }}>
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white py-3">
                <h6 className="card-title mb-0 text-gray-800">Quick Actions</h6>
              </div>
              <div className="card-body">
                <button
                  className="btn btn-outline-primary w-100 mb-3"
                  onClick={() => {
                    setSelectedQuery(null);
                    setActiveTab("askQuery");
                  }}
                >
                  <i className="bi bi-plus-circle me-2"></i> Ask New Question
                </button>

                <button
                  className="btn btn-outline-secondary w-100 mb-3"
                  onClick={() => window.print()}
                >
                  <i className="bi bi-printer me-2"></i> Print Details
                </button>

                {!isAnswered && (
                  <button
                    className="btn btn-outline-warning w-100"
                    onClick={() => {
                      const updatedQuery = queries.find(q => q.id === selectedQuery.id);
                      if (updatedQuery) {
                        setSelectedQuery(updatedQuery);
                        if (updatedQuery.response && updatedQuery.response.trim() !== "") {
                          showNotificationAlert("Your query has been answered!", "success");
                        } else {
                          showNotificationAlert("Your query is still pending. Please check back later.", "info");
                        }
                      }
                    }}
                  >
                    <i className="bi bi-arrow-clockwise me-2"></i> Check Status
                  </button>
                )}
              </div>
            </div>

            {/* Response Time Info */}
            {isAnswered && selectedQuery.createdAt && selectedQuery.updatedAt && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white py-3">
                  <h6 className="card-title mb-0 text-gray-800">Response Info</h6>
                </div>
                <div className="card-body">
                  <div className="text-center">
                    <i className="bi bi-speedometer2 text-primary fs-1 mb-3"></i>
                    <h5 className="text-gray-800">
                      {((new Date(selectedQuery.updatedAt) - new Date(selectedQuery.createdAt)) / (1000 * 60 * 60)).toFixed(1)} hours
                    </h5>
                    <p className="text-gray-600 small mb-0">Response Time</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};


  return (
    <>
      {activeTab === "askQuery" && renderAskQuery()}
      {activeTab === "myQueries" && renderMyQueries()}
      {activeTab === "queryDetails" && renderQueryDetails()}
    </>
  );
}