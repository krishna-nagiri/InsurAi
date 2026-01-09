// src/components/admin/AdminFraudClaims.jsx
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from "chart.js";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

// Gradient function
const getPrimaryGradient = () => 
  `linear-gradient(135deg,#1e3a5f 100%)`;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

export default function AdminFraudClaims() {
  const [fraudClaims, setFraudClaims] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });
  const [viewingClaim, setViewingClaim] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [loading, setLoading] = useState(true);

  // Fetch fraud claims
  useEffect(() => {
    const fetchFraudClaims = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return console.error("❌ No admin token found!");

        const response = await axios.get("http://localhost:8077/admin/claims/fraud", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setFraudClaims(response.data);
      } catch (error) {
        console.error("Error fetching fraud claims:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFraudClaims();
  }, []);

  // Filter + search
  const filteredClaims = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return fraudClaims.filter((claim) => {
      const matchesSearch =
        claim.employeeName?.toLowerCase().includes(query) ||
        claim.policyName?.toLowerCase().includes(query) ||
        claim.fraudReason?.toLowerCase().includes(query) ||
        claim.assignedHrName?.toLowerCase().includes(query) ||
        claim.title?.toLowerCase().includes(query);
      const matchesStatus =
        statusFilter === "All"
          ? true
          : statusFilter === "Pending"
          ? claim.status === "Pending"
          : claim.status !== "Pending";
      return matchesSearch && matchesStatus;
    });
  }, [fraudClaims, searchTerm, statusFilter]);

  // Sorting
  const sortedClaims = useMemo(() => {
    if (!sortConfig.key) return filteredClaims;
    return [...filteredClaims].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];
      if (sortConfig.key === "amount") {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (sortConfig.key === "claimDate") {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      } else {
        aValue = aValue?.toString().toLowerCase();
        bValue = bValue?.toString().toLowerCase();
      }
      if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
      return 0;
    });
  }, [filteredClaims, sortConfig]);

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);

  // Statistics
  const stats = useMemo(() => {
    const total = fraudClaims.length;
    const pending = fraudClaims.filter((c) => c.status === "Pending").length;
    const resolved = total - pending;
    const totalAmount = fraudClaims.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const pendingAmount = fraudClaims
      .filter((c) => c.status === "Pending")
      .reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
    const resolvedAmount = totalAmount - pendingAmount;
    return { total, pending, resolved, totalAmount, pendingAmount, resolvedAmount };
  }, [fraudClaims]);

  // Charts
  const monthlyData = useMemo(() => {
    const monthMap = {};
    fraudClaims.forEach((c) => {
      const month = new Date(c.claimDate).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthMap[month]) monthMap[month] = 0;
      monthMap[month] += parseFloat(c.amount) || 0;
    });
    return {
      labels: Object.keys(monthMap),
      datasets: [
        { 
          label: "Total Fraud Amount", 
          data: Object.values(monthMap), 
          backgroundColor: COLORS.ACCENT_2,
          borderColor: COLORS.ACCENT_2,
          borderWidth: 2
        },
      ],
    };
  }, [fraudClaims]);

  const statusPieData = useMemo(
    () => ({
      labels: ["Pending", "Resolved"],
      datasets: [{ 
        data: [stats.pending, stats.resolved], 
        backgroundColor: [COLORS.WARNING, "#198754"],
        borderColor: [COLORS.WARNING, "#198754"],
        borderWidth: 2
      }],
    }),
    [stats]
  );

  const lineData = useMemo(() => {
    const monthMap = {};
    fraudClaims.forEach((c) => {
      const month = new Date(c.claimDate).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthMap[month]) monthMap[month] = 0;
      if (c.status !== "Pending") monthMap[month] += parseFloat(c.amount) || 0;
    });
    return {
      labels: Object.keys(monthMap),
      datasets: [
        {
          label: "Amount Saved",
          data: Object.values(monthMap),
          borderColor: "#198754",
          backgroundColor: "#19875433",
          fill: true,
        },
      ],
    };
  }, [fraudClaims]);

  // PDF export
  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["ID", "Type", "Employee", "HR", "Claim Date", "Amount", "Status", "Fraud Reason"];
    const tableRows = sortedClaims.map((c) => [
      c.id,
      c.title,
      c.employeeName || `#${c.employeeId}`,
      c.assignedHrName || `HR #${c.assignedHrId}`,
      c.claimDate?.split("T")[0],
      formatCurrency(c.amount),
      c.status,
      c.fraudReason,
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save("admin_fraud_claims.pdf");
  };

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '400px', backgroundColor: COLORS.BACKGROUND }}>
      <div className="spinner-border" style={{ color: COLORS.PRIMARY }} role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );

  return (
    <div className="container-fluid" style={{ backgroundColor: COLORS.BACKGROUND, minHeight: '100vh' }}>
      <h3 style={{ color: COLORS.DARK }} className="fw-bold mb-2">Admin Fraud Dashboard</h3>

      {/* Statistics Cards */}
      <div className="row mb-4">
        {[
          { label: "Total Alerts", value: stats.total, color: COLORS.PRIMARY },
          { label: "Pending", value: stats.pending, color: COLORS.WARNING },
          { label: "Resolved", value: stats.resolved, color: "#198754" },
          { label: "Total Amount", value: stats.totalAmount, color: COLORS.CONTRAST },
          { label: "Pending Amount", value: stats.pendingAmount, color: COLORS.TEXT_MUTED },
          { label: "Amount Saved", value: stats.resolvedAmount, color: "#198754" },
        ].map((s, i) => (
          <div key={i} className="col-md-2 col-6 mb-2">
            <div className="card border-0 shadow-sm text-center" style={{ 
              backgroundColor: `${s.color}15`,
              borderLeft: `4px solid ${s.color}`
            }}>
              <div className="card-body">
                <h5 style={{ color: s.color }}>
                  {s.label.includes("Amount") ? formatCurrency(s.value) : s.value}
                </h5>
                <small style={{ color: COLORS.TEXT_MUTED }}>{s.label}</small>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ background: getPrimaryGradient() }}>
              Monthly Fraud Amount
            </div>
            <div className="card-body">
              <Bar data={monthlyData} />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header text-dark" style={{ backgroundColor: COLORS.WARNING }}>
              Status Distribution
            </div>
            <div className="card-body">
              <Pie data={statusPieData} />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header text-white" style={{ backgroundColor: "#198754" }}>
              Amount Saved Over Time
            </div>
            <div className="card-body">
              <Line data={lineData} />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Search by employee, policy, or reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="col-md-2 mb-2">
          <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Resolved">Resolved</option>
          </select>
        </div>
        <div className="col-md-6 d-flex gap-2 mb-2">
          <CSVLink 
            data={sortedClaims} 
            filename="admin_fraud_claims.csv" 
            className="btn btn-sm"
            style={{ 
              background: getPrimaryGradient(),
              color: 'white',
              border: 'none'
            }}
          >
            Export CSV
          </CSVLink>
          <button 
            className="btn btn-sm"
            style={{ 
              background: getPrimaryGradient(),
              color: 'white',
              border: 'none'
            }}
            onClick={exportPDF}
          >
            Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header text-white" style={{ background: getPrimaryGradient() }}>
          Fraud Claims
        </div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0 align-middle">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("id")} className="cursor-pointer" style={{ color: COLORS.DARK }}>ID</th>
                  <th onClick={() => handleSort("title")} className="cursor-pointer" style={{ color: COLORS.DARK }}>Type</th>
                  <th onClick={() => handleSort("employeeName")} className="cursor-pointer" style={{ color: COLORS.DARK }}>Employee</th>
                  <th onClick={() => handleSort("assignedHrName")} className="cursor-pointer" style={{ color: COLORS.DARK }}>Assigned HR</th>
                  <th onClick={() => handleSort("claimDate")} className="cursor-pointer" style={{ color: COLORS.DARK }}>Claim Date</th>
                  <th onClick={() => handleSort("amount")} className="cursor-pointer text-end" style={{ color: COLORS.DARK }}>Amount</th>
                  <th style={{ color: COLORS.DARK }}>Status</th>
                  <th style={{ color: COLORS.DARK }}>Fraud Reason</th>
                </tr>
              </thead>
              <tbody>
                {sortedClaims.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4" style={{ color: COLORS.TEXT_MUTED }}>
                      No fraud claims found
                    </td>
                  </tr>
                ) : (
                  sortedClaims.map((c) => (
                    <tr key={c.id} onClick={() => setViewingClaim(c)} className="cursor-pointer">
                      <td style={{ color: COLORS.DARK }}>{c.id}</td>
                      <td style={{ color: COLORS.DARK }}>{c.title}</td>
                      <td style={{ color: COLORS.DARK }}>{c.employeeName || `#${c.employeeId}`}</td>
                      <td style={{ color: COLORS.DARK }}>{c.assignedHrName || `HR #${c.assignedHrId}`}</td>
                      <td style={{ color: COLORS.DARK }}>{c.claimDate?.split("T")[0]}</td>
                      <td className="text-end" style={{ color: COLORS.DARK }}>{formatCurrency(c.amount)}</td>
                      <td>
                        <span className={`badge ${
                          c.status === "Pending" ? "bg-warning" : c.status === "Approved" ? "bg-success" : "bg-danger"
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="fw-semibold" style={{ color: COLORS.ACCENT_2 }}>{c.fraudReason}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {viewingClaim && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.6)" }}>
          <div className="modal-dialog modal-xl modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header text-white" style={{ background: getPrimaryGradient() }}>
                <h5 className="modal-title">Fraud Claim #{viewingClaim.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingClaim(null)}></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p style={{ color: COLORS.DARK }}><strong>Employee:</strong> {viewingClaim.employeeName || `#${viewingClaim.employeeId}`}</p>
                    <p style={{ color: COLORS.DARK }}><strong>Assigned HR:</strong> {viewingClaim.assignedHrName || `HR #${viewingClaim.assignedHrId}`}</p>
                    <p style={{ color: COLORS.DARK }}><strong>Type:</strong> {viewingClaim.title}</p>
                    <p style={{ color: COLORS.DARK }}><strong>Policy:</strong> {viewingClaim.policyName}</p>
                  </div>
                  <div className="col-md-6">
                    <p style={{ color: COLORS.DARK }}><strong>Claim Date:</strong> {viewingClaim.claimDate?.split("T")[0]}</p>
                    <p style={{ color: COLORS.DARK }}><strong>Amount:</strong> {formatCurrency(viewingClaim.amount)}</p>
                    <p style={{ color: COLORS.DARK }}><strong>Status:</strong> 
                      <span className={`badge ms-2 ${
                        viewingClaim.status === "Pending" ? "bg-warning" :
                        viewingClaim.status === "Approved" ? "bg-success" : "bg-danger"
                      }`}>{viewingClaim.status}</span>
                    </p>
                    <p style={{ color: COLORS.DARK }}><strong>Fraud Flag:</strong> 
                      {viewingClaim.fraudFlag ? <span className="badge bg-danger ms-2">Yes</span> : <span className="badge bg-success ms-2">No</span>}
                    </p>
                  </div>
                </div>
                <div className="mb-3">
                  <p style={{ color: COLORS.DARK }}><strong>Fraud Reasons:</strong></p>
                  <ul>
                    {viewingClaim.fraudReason?.split(";").map((r, i) => r.trim() && <li key={i} style={{ color: COLORS.DARK }}>{r.trim()}</li>)}
                  </ul>
                </div>
                {viewingClaim.documents?.length > 0 && (
                  <div>
                    <p style={{ color: COLORS.DARK }}><strong>Attached Documents:</strong></p>
                    <ul>
                      {viewingClaim.documents.map((doc, i) => (
                        <li key={i}>
                          <a 
                            href={`http://localhost:8080${doc}`} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            style={{ color: COLORS.PRIMARY }}
                          >
                            Document {i + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn"
                  style={{ 
                    background: getPrimaryGradient(),
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={() => setViewingClaim(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .table-hover tbody tr:hover { background-color: ${COLORS.BACKGROUND}; }
      `}</style>
    </div>
  );
}