// src/pages/dashboard/Hr/HRFraud.jsx
import React, { useEffect, useState, useMemo } from "react";
import { Bar, Pie, Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from "chart.js";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import "jspdf-autotable";

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

const HRFraud = () => {
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState({ key: "id", direction: "asc" });
  const [viewingAlert, setViewingAlert] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchFraudAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8077/hr/claims/fraud", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);
      const data = await response.json();
      setFraudAlerts(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching fraud alerts:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFraudAlerts();
  }, []);

  const [employees, setEmployees] = useState([]);

const fetchEmployees = async () => {
  try {
    const token = localStorage.getItem("token");
    const res = await fetch("http://localhost:8077/employees", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();
    setEmployees(data);
  } catch (error) {
    console.error("Error fetching employees:", error);
  }
};

useEffect(() => {
  fetchFraudAlerts();
  fetchEmployees();
}, []);

const employeeMap = useMemo(() => {
  const map = {};
  employees.forEach(emp => {
    map[emp.id] = emp.employeeId; // numeric id → string EMP_xxx
  });
  return map;
}, [employees]);


  // Filtered and sorted alerts
  const enhancedAlerts = useMemo(() => {
    let filtered = fraudAlerts.filter((alert) => {
      const matchesSearch =
        alert.employeeId.toString().includes(searchTerm) ||
        alert.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        alert.policyName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        statusFilter === "All" ? true : statusFilter === "Pending" ? alert.status === "Pending" : alert.status === "Resolved";
      return matchesSearch && matchesStatus;
    });

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === "amount") {
          aVal = parseFloat(aVal);
          bVal = parseFloat(bVal);
        } else if (sortConfig.key === "claimDate") {
          aVal = new Date(aVal);
          bVal = new Date(bVal);
        }

        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }, [fraudAlerts, searchTerm, sortConfig, statusFilter]);

  const handleSort = (key) => {
    setSortConfig((current) => ({
      key,
      direction: current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 0 }).format(amount);
  };

  // Statistics
  const stats = useMemo(() => {
    const total = fraudAlerts.length;
    const pending = fraudAlerts.filter((a) => a.status === "Pending").length;
    const resolved = fraudAlerts.filter((a) => a.status === "Resolved").length;
    const totalAmount = fraudAlerts.reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const pendingAmount = fraudAlerts.filter((a) => a.status === "Pending").reduce((sum, a) => sum + (parseFloat(a.amount) || 0), 0);
    const resolvedAmount = totalAmount - pendingAmount;
    return { total, pending, resolved, totalAmount, pendingAmount, resolvedAmount };
  }, [fraudAlerts]);

  // Chart Data
  const monthlyData = useMemo(() => {
    const monthMap = {};
    fraudAlerts.forEach((a) => {
      const month = new Date(a.claimDate).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthMap[month]) monthMap[month] = 0;
      monthMap[month] += a.amount;
    });
    return {
      labels: Object.keys(monthMap),
      datasets: [
        {
          label: "Total Amount Flagged",
          data: Object.values(monthMap),
          backgroundColor: "#0d6efd",
        },
      ],
    };
  }, [fraudAlerts]);

  const statusPieData = useMemo(() => {
    const pending = stats.pending;
    const resolved = stats.resolved;
    return {
      labels: ["Pending", "Resolved"],
      datasets: [
        {
          data: [pending, resolved],
          backgroundColor: ["#ffc107", "#198754"],
        },
      ],
    };
  }, [stats]);

  const lineData = useMemo(() => {
    const monthMap = {};
    fraudAlerts.forEach((a) => {
      const month = new Date(a.claimDate).toLocaleString("default", { month: "short", year: "numeric" });
      if (!monthMap[month]) monthMap[month] = 0;
      if (a.status === "Resolved") monthMap[month] += a.amount;
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
  }, [fraudAlerts]);

  const exportPDF = () => {
    const doc = new jsPDF();
    const tableColumn = ["Claim ID", "Employee ID", "Title", "Policy", "Amount", "Status", "Fraud Reason"];
    const tableRows = enhancedAlerts.map((a) => [
      a.id,
      a.employeeId,
      a.title,
      a.policyName,
      formatCurrency(a.amount),
      a.status,
      a.fraudReason?.split(";").map((r) => r.trim()).join("\n") || "-",
    ]);
    doc.autoTable({ head: [tableColumn], body: tableRows });
    doc.save("fraud_alerts.pdf");
  };

  if (loading) return <div>Loading fraud alerts...</div>;

  return (
    <div className="container-fluid">
      <h2 className="fw-bold text-dark mb-2">Fraud Detection Management</h2>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-2 col-6 mb-2">
          <div className="card bg-primary bg-opacity-10 border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="text-primary">{stats.total}</h5>
              <small>Total Alerts</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-2">
          <div className="card bg-warning bg-opacity-10 border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="text-warning">{stats.pending}</h5>
              <small>Pending</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-2">
          <div className="card bg-success bg-opacity-10 border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="text-success">{stats.resolved}</h5>
              <small>Resolved</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-2">
          <div className="card bg-info bg-opacity-10 border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="text-info">{formatCurrency(stats.totalAmount)}</h5>
              <small>Total Amount Flagged</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-2">
          <div className="card bg-secondary bg-opacity-10 border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="text-secondary">{formatCurrency(stats.pendingAmount)}</h5>
              <small>Pending Amount</small>
            </div>
          </div>
        </div>
        <div className="col-md-2 col-6 mb-2">
          <div className="card bg-success bg-opacity-10 border-0 shadow-sm text-center">
            <div className="card-body">
              <h5 className="text-success">{formatCurrency(stats.resolvedAmount)}</h5>
              <small>Total Amount Saved</small>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="row mb-4">
        <div className="col-md-6 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-gradient-primary text-white">
              Monthly Fraud Amounts
            </div>
            <div className="card-body">
              <Bar data={monthlyData} />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-gradient-warning text-dark">Status Distribution</div>
            <div className="card-body">
              <Pie data={statusPieData} />
            </div>
          </div>
        </div>
        <div className="col-md-3 mb-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-gradient-success text-white">Amount Saved Over Time</div>
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
            placeholder="Search by Employee, Policy, Type..."
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
          <CSVLink data={enhancedAlerts} filename="fraud_alerts.csv" className="btn btn-success btn-sm">
            Export CSV
          </CSVLink>
          <button className="btn btn-danger btn-sm" onClick={exportPDF}>
            Export PDF
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card shadow-sm border-0">
        <div className="card-header bg-gradient-primary text-white">Fraud Alerts</div>
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th onClick={() => handleSort("id")} className="cursor-pointer">Claim ID</th>
                  <th onClick={() => handleSort("employeeId")} className="cursor-pointer">Employee ID</th>
                  <th>Type</th>
                  <th>Policy</th>
                  <th onClick={() => handleSort("amount")} className="cursor-pointer text-end">Amount</th>
                  <th onClick={() => handleSort("claimDate")} className="cursor-pointer">Claim Date</th>
                  <th>Status</th>
                  <th>Fraud Flag</th>
                  <th>Fraud Reasons</th>
                  <th>Documents</th>
                </tr>
              </thead>
              <tbody>
                {enhancedAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="text-center py-5">No fraud alerts found</td>
                  </tr>
                ) : (
                  enhancedAlerts.map((a) => (
                    <tr key={a.id} onClick={() => setViewingAlert(a)} className="cursor-pointer">
                      <td>{a.id}</td>
                      <td>{employeeMap[a.employeeId] || `EMP_${a.employeeId}`}</td>
                      <td>{a.title}</td>
                      <td>{a.policyName}</td>
                      <td className="text-end">{formatCurrency(a.amount)}</td>
                      <td>{a.claimDate?.split("T")[0]}</td>
                      <td>
                        <span className={`badge ${a.status === "Pending" ? "bg-warning" : "bg-success"}`}>
                          {a.status}
                        </span>
                      </td>
                      <td>{a.fraudFlag ? <span className="badge bg-danger">Yes</span> : <span className="badge bg-success">No</span>}</td>
                      <td>
                        {a.fraudReason?.split(";").map((r, i) => r.trim() && <div key={i}>• {r.trim()}</div>)}
                      </td>
                      <td>
                        {a.documents?.map((doc, i) => (
                          <a key={i} href={`http://localhost:8077${doc}`} target="_blank" className="d-block">
                            Doc {i + 1}
                          </a>
                        ))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {viewingAlert && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div className="modal-dialog modal-lg modal-dialog-centered">
            <div className="modal-content shadow-lg border-0">
              <div className="modal-header bg-gradient-primary text-white">
                <h5 className="modal-title">Fraud Alert #{viewingAlert.id}</h5>
                <button type="button" className="btn-close btn-close-white" onClick={() => setViewingAlert(null)}></button>
              </div>
              <div className="modal-body">
                <p><strong>Employee ID:</strong> {viewingAlert.employeeId}</p>
                <p><strong>Type:</strong> {viewingAlert.title}</p>
                <p><strong>Policy:</strong> {viewingAlert.policyName}</p>
                <p><strong>Amount:</strong> {formatCurrency(viewingAlert.amount)}</p>
                <p><strong>Claim Date:</strong> {viewingAlert.claimDate?.split("T")[0]}</p>
                <p><strong>Status:</strong> {viewingAlert.status}</p>
                <p><strong>Fraud Reasons:</strong></p>
                <ul>
                  {viewingAlert.fraudReason?.split(";").map((r, i) => r.trim() && <li key={i}>{r.trim()}</li>)}
                </ul>
                <p><strong>Documents:</strong></p>
                <ul>
                  {viewingAlert.documents?.map((doc, i) => (
                    <li key={i}><a href={`http://localhost:8077${doc}`} target="_blank">Document {i + 1}</a></li>
                  ))}
                </ul>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setViewingAlert(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .cursor-pointer { cursor: pointer; }
        .table-hover tbody tr:hover { background-color: rgba(0, 123, 255, 0.05); }
      `}</style>
    </div>
  );
};

export default HRFraud;
