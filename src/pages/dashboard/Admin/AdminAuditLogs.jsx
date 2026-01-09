import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CSVLink } from "react-csv";

const AdminAuditLogs = ({ themeColors }) => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [filterRole, setFilterRole] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [dateRange, setDateRange] = useState("30");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  // Fetch logs from backend
  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8077/admin/audit/logs", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setLogs(data);
        setFilteredLogs(data);
      })
      .catch((err) => console.error("Error fetching audit logs:", err))
      .finally(() => setLoading(false));
  }, [token]);

  // Apply filters
  const applyFilters = () => {
    let filtered = logs;

    if (filterRole) filtered = filtered.filter((log) => log.role === filterRole);
    if (filterAction)
      filtered = filtered.filter((log) =>
        log.action.toLowerCase().includes(filterAction.toLowerCase())
      );

    if (searchTerm)
      filtered = filtered.filter(
        (log) =>
          log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase())
      );

    if (dateRange && dateRange !== "custom") {
      const days = parseInt(dateRange);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      filtered = filtered.filter(
        (log) => new Date(log.timestamp) >= cutoff
      );
    }

    setFilteredLogs(filtered);
  };

  // Export CSV headers
  const csvHeaders = [
    { label: "Timestamp", key: "timestamp" },
    { label: "User", key: "userName" },
    { label: "Role", key: "role" },
    { label: "Action", key: "action" },
    { label: "Details", key: "details" },
  ];

  return (
    <motion.div
      className="w-100"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h4 className="mb-4 fw-bold" style={{ color: themeColors.primary }}>
        Audit Logs & System Activity
      </h4>

      {/* 🔍 Filter Section */}
      <div
        className="card mb-4 border-0 shadow-sm"
        style={{
          background: "rgba(255, 255, 255, 0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          className="card-header text-white"
          style={{ backgroundColor: themeColors.primary }}
        >
          <h5 className="mb-0">Filter Logs</h5>
        </div>
        <div className="card-body">
          <div className="row">
            {/* Role Filter */}
            <div className="col-md-3 mb-3">
              <label className="form-label">User Role</label>
              <select
                className="form-select"
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="">All Roles</option>
                <option value="HR">HR</option>
                <option value="AGENT">Agent</option>
                <option value="EMPLOYEE">Employee</option>
              </select>
            </div>

            {/* Action Filter */}
            <div className="col-md-3 mb-3">
              <label className="form-label">Action Type</label>
              <input
                type="text"
                className="form-control"
                placeholder="e.g. LOGIN, CLAIM"
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
              />
            </div>

            {/* Date Range */}
            <div className="col-md-3 mb-3">
              <label className="form-label">Date Range</label>
              <select
                className="form-select"
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
              >
                <option value="7">Last 7 Days</option>
                <option value="30">Last 30 Days</option>
                <option value="90">Last 90 Days</option>
              </select>
            </div>

            {/* Search Box */}
            <div className="col-md-3 mb-3">
              <label className="form-label">Search</label>
              <input
                type="text"
                className="form-control"
                placeholder="Search by user or details"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn px-4 mt-2"
            style={{
              backgroundColor: themeColors.secondary,
              color: "white",
              borderRadius: "8px",
            }}
            onClick={applyFilters}
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* 🧾 Logs Table */}
      <div
        className="card border-0 shadow-sm"
        style={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          className="card-header text-white d-flex justify-content-between align-items-center"
          style={{ backgroundColor: themeColors.primary }}
        >
          <h5 className="mb-0">System Activity Log</h5>
          <CSVLink
            data={filteredLogs}
            headers={csvHeaders}
            filename="audit_logs.csv"
            className="btn btn-sm btn-outline-light"
          >
            <i className="bi bi-download me-1"></i> Export CSV
          </CSVLink>
        </div>

        <div className="card-body">
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border text-primary" role="status"></div>
              <p className="mt-2 text-muted">Loading logs...</p>
            </div>
          ) : filteredLogs.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Role</th>
                    <th>Action</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <motion.tr
                      key={log.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td>{new Date(log.timestamp).toLocaleString()}</td>
                      <td>{log.userName}</td>
                      <td>
                        <span
                          className="badge"
                          style={{
                            backgroundColor:
                              log.role === "HR"
                                ? themeColors.accent
                                : log.role === "AGENT"
                                ? "#20c997"
                                : "#6c757d",
                            color: "white",
                          }}
                        >
                          {log.role}
                        </span>
                      </td>
                      <td>{log.action}</td>
                      <td>{log.details}</td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-muted">
              <i className="bi bi-inbox fs-3"></i>
              <p className="mt-2">No logs found for selected filters.</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default AdminAuditLogs;
