import React, { useState, useEffect } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line } from 'recharts';
import { CSVLink } from "react-csv";

// Color constants
const COLORS = {
  ACCENT_1: '#00f0ff',       // Vibrant Cyan
  ACCENT_2: '#f5c518',       // Warm Gold
  ACCENT_3: '#b57edc',       // Soft Lavender
  BACKGROUND: '#ffffffff',     // Light off-white/lavender
  TEXT_MUTED: '#6b5b6e',     // Grayish violet
  SUCCESS: '#28a745',        // Success green
  WARNING: '#ffc107',        // Warning gold
  ERROR: '#dc3545',          // Error red
  INFO: '#0dcaf0'           // Info cyan
};

// Gradient functions
const getPrimaryGradient = () => 
  `linear-gradient(135deg, #16043fff 0%, #0d569eff 100%)`;

const getTextGradient = () => ({
  background: `linear-gradient(135deg, #16043fff 0%, #0d569eff 100%)`,
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text'
});

export default function ReportsAnalytics({ mappedClaims, policies }) {
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("all");
  const [displayedClaims, setDisplayedClaims] = useState([]);
  const [reportHistory, setReportHistory] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState("All");
  const [chartType, setChartType] = useState("pie");
  const [activeTab, setActiveTab] = useState("overview");

  const CHART_COLORS = [COLORS.ACCENT_1, COLORS.ACCENT_2, COLORS.ACCENT_3, "#96CEB4", "#FFEAA7", "#DDA0DD"];
  const STATUS_COLORS = { 
    "Pending": COLORS.WARNING, 
    "Approved": COLORS.SUCCESS, 
    "Rejected": COLORS.ERROR 
  };

  // Load report history
  useEffect(() => {
    const savedHistory = localStorage.getItem("reportHistory");
    if (savedHistory) setReportHistory(JSON.parse(savedHistory));
  }, []);

  // Filter claims based on status, date, and policy
  useEffect(() => {
    const now = new Date();
    const filtered = mappedClaims.filter(claim => {
      const statusMatch = statusFilter === "All" || claim.status === statusFilter;
      const policyMatch = selectedPolicy === "All" || claim.policyName === selectedPolicy;

      let dateMatch = true;
      if (dateFilter !== "all") {
        const claimDate = new Date(claim.claimDate);
        switch(dateFilter) {
          case "today":
            dateMatch = claimDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date();
            weekAgo.setDate(now.getDate() - 7);
            dateMatch = claimDate >= weekAgo;
            break;
          case "month":
            const monthAgo = new Date();
            monthAgo.setMonth(now.getMonth() - 1);
            dateMatch = claimDate >= monthAgo;
            break;
          case "year":
            const yearAgo = new Date();
            yearAgo.setFullYear(now.getFullYear() - 1);
            dateMatch = claimDate >= yearAgo;
            break;
        }
      }

      return statusMatch && policyMatch && dateMatch;
    });

    setDisplayedClaims(filtered);
  }, [mappedClaims, statusFilter, dateFilter, selectedPolicy]);

  // Chart Data
  const claimStatusData = [
    { name: "Pending", value: mappedClaims.filter(c => c.status === "Pending").length, color: STATUS_COLORS.Pending },
    { name: "Approved", value: mappedClaims.filter(c => c.status === "Approved").length, color: STATUS_COLORS.Approved },
    { name: "Rejected", value: mappedClaims.filter(c => c.status === "Rejected").length, color: STATUS_COLORS.Rejected }
  ];

  const policyUsageData = policies ? policies.map(policy => ({
    name: policy.policyName,
    claims: mappedClaims.filter(claim => claim.policyName === policy.policyName).length,
    amount: mappedClaims.filter(claim => claim.policyName === policy.policyName)
                        .reduce((sum, claim) => sum + (parseFloat(claim.amount) || 0), 0)
  })) : [];

  const monthlyClaimData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const monthClaims = mappedClaims.filter(claim => {
        const claimDate = new Date(claim.claimDate);
        return claimDate.getMonth() === index && claimDate.getFullYear() === currentYear;
      });
      return {
        month,
        claims: monthClaims.length,
        amount: monthClaims.reduce((sum, claim) => sum + (parseFloat(claim.amount) || 0), 0)
      };
    });
  };

  // Statistics
  const totalAmount = mappedClaims.reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);
  const averageClaimAmount = mappedClaims.length ? totalAmount / mappedClaims.length : 0;
  const approvedAmount = mappedClaims.filter(c => c.status === "Approved").reduce((sum, c) => sum + (parseFloat(c.amount) || 0), 0);

  // Format currency with Indian Rupee symbol
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toFixed(2)}`;
  };

  // Save report history
  const saveReportToHistory = (reportName, type) => {
    const newReport = {
      id: Date.now(),
      name: reportName,
      generatedOn: new Date().toISOString().split('T')[0],
      type,
      data: type === 'CSV' ? displayedClaims : null,
      filter: { status: statusFilter, date: dateFilter, policy: selectedPolicy }
    };
    const updatedHistory = [newReport, ...reportHistory.slice(0, 9)];
    setReportHistory(updatedHistory);
    localStorage.setItem("reportHistory", JSON.stringify(updatedHistory));
  };

  // PDF download
  const downloadClaimsPDF = () => {
    if (!displayedClaims.length) return alert("No claims to download");

    const doc = new jsPDF();
    const reportName = `Claims_Report_${new Date().toISOString().split('T')[0]}`;

    doc.setFontSize(18);
    doc.setTextColor(40, 40, 40);
    doc.text('CLAIMS ANALYTICS REPORT', 105, 15, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 22, { align: 'center' });
    doc.text(`Total Records: ${displayedClaims.length} | Filters: Status: ${statusFilter}, Date: ${dateFilter}, Policy: ${selectedPolicy}`, 105, 28, { align: 'center' });

    // Summary
    doc.setFontSize(12);
    doc.setTextColor(22, 4, 63); // New primary dark color
    doc.text('EXECUTIVE SUMMARY', 14, 40);

    doc.autoTable({
      startY: 45,
      head: [['Metric', 'Count', 'Amount']],
      body: [
        ['Total Claims', mappedClaims.length, formatCurrency(totalAmount)],
        ['Approved Claims', mappedClaims.filter(c => c.status === "Approved").length, formatCurrency(approvedAmount)],
        ['Pending Claims', mappedClaims.filter(c => c.status === "Pending").length, '-'],
        ['Rejected Claims', mappedClaims.filter(c => c.status === "Rejected").length, '-'],
        ['Average Claim', formatCurrency(averageClaimAmount), '-']
      ],
      theme: 'grid',
      headStyles: { fillColor: [22, 4, 63], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 3 },
      columnStyles: { 0: { cellWidth: 40, fontStyle: 'bold' }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 } }
    });

    doc.setFontSize(12);
    doc.setTextColor(22, 4, 63);
    doc.text('DETAILED CLAIMS DATA', 14, doc.lastAutoTable.finalY + 15);

    doc.autoTable({
      startY: doc.lastAutoTable.finalY + 20,
      head: [['Employee', 'ID', 'Type', 'Amount', 'Date', 'Status', 'Policy']],
      body: displayedClaims.map(c => [
        c.employeeName,
        c.employeeIdDisplay,
        c.title,
        formatCurrency(c.amount),
        c.claimDate?.split("T")[0],
        c.status,
        c.policyName
      ]),
      theme: 'striped',
      headStyles: { fillColor: [22, 4, 63], textColor: 255 },
      styles: { fontSize: 8, cellPadding: 2 },
      columnStyles: { 0: { cellWidth: 25 }, 1: { cellWidth: 15 }, 2: { cellWidth: 20 }, 3: { cellWidth: 15 }, 4: { cellWidth: 20 }, 5: { cellWidth: 15 }, 6: { cellWidth: 25 } }
    });

    // Footer
    const pageCount = doc.internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      doc.text(`Generated by Claims Management System`, 105, 295, { align: 'center' });
    }

    doc.save(`${reportName}.pdf`);
    saveReportToHistory(reportName, 'PDF');
  };

  // CSV download
  const downloadClaimsCSV = () => {
    const reportName = `Claims_Report_${new Date().toISOString().split('T')[0]}`;
    saveReportToHistory(reportName, 'CSV');
  };

  // Download report from history
  const downloadHistoricalReport = (report) => {
    if (report.type === 'CSV' && report.data) {
      const csvContent = convertToCSV(report.data);
      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${report.name}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const convertToCSV = (data) => {
    const headers = ["Employee Name", "Employee ID", "Claim Type", "Amount", "Date", "Status", "Policy Name", "Remarks"];
    const rows = data.map(c => [
      c.employeeName,
      c.employeeIdDisplay,
      c.title,
      c.amount,
      c.claimDate?.split("T")[0],
      c.status,
      c.policyName,
      c.remarks || ""
    ]);
    return [headers, ...rows].map(e => e.join(",")).join("\n");
  };

  // Clear report history
  const clearHistory = () => {
    setReportHistory([]);
    localStorage.removeItem("reportHistory");
  };

  // Quick actions
  const quickFilter = (status) => {
    setStatusFilter(status);
    setActiveTab("overview");
  };

  return (
    <div className="container-fluid" style={{ backgroundColor: COLORS.BACKGROUND }}>
      {/* Header */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h2 className="fw-bold mb-2" style={getTextGradient()}>Reports & Analytics</h2>
              <p className="mb-0" style={{ color: COLORS.TEXT_MUTED }}>Comprehensive insights and analytics for claims management</p>
            </div>
            <div className="rounded p-2" style={{ background: getPrimaryGradient() }}>
              <span className="text-white">
                <i className="bi bi-graph-up me-2"></i>
                Last Updated: {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="row mb-4">
        <div className="col-12">
          <ul className="nav nav-pills nav-fill bg-light rounded p-2">
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "overview" ? "active" : ""}`}
                style={{ 
                  background: activeTab === "overview" ? getPrimaryGradient() : 'transparent',
                  color: activeTab === "overview" ? 'white' : COLORS.TEXT_MUTED,
                  border: 'none'
                }}
                onClick={() => setActiveTab("overview")}
              >
                <i className="bi bi-speedometer2 me-2"></i>Overview
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "charts" ? "active" : ""}`}
                style={{ 
                  background: activeTab === "charts" ? getPrimaryGradient() : 'transparent',
                  color: activeTab === "charts" ? 'white' : COLORS.TEXT_MUTED,
                  border: 'none'
                }}
                onClick={() => setActiveTab("charts")}
              >
                <i className="bi bi-bar-chart me-2"></i>Charts
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "reports" ? "active" : ""}`}
                style={{ 
                  background: activeTab === "reports" ? getPrimaryGradient() : 'transparent',
                  color: activeTab === "reports" ? 'white' : COLORS.TEXT_MUTED,
                  border: 'none'
                }}
                onClick={() => setActiveTab("reports")}
              >
                <i className="bi bi-file-earmark-text me-2"></i>Reports
              </button>
            </li>
            <li className="nav-item">
              <button 
                className={`nav-link ${activeTab === "history" ? "active" : ""}`}
                style={{ 
                  background: activeTab === "history" ? getPrimaryGradient() : 'transparent',
                  color: activeTab === "history" ? 'white' : COLORS.TEXT_MUTED,
                  border: 'none'
                }}
                onClick={() => setActiveTab("history")}
              >
                <i className="bi bi-clock-history me-2"></i>History
              </button>
            </li>
          </ul>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-body">
              <h5 className="card-title mb-3" style={{ color: '#16043fff' }}>Quick Actions</h5>
              <div className="row g-2">
                <div className="col-auto">
                  <button 
                    className="btn btn-sm"
                    style={{ 
                      background: getPrimaryGradient(),
                      color: 'white',
                      border: 'none'
                    }}
                    onClick={() => quickFilter("Pending")}
                  >
                    <i className="bi bi-clock me-1"></i>Pending ({mappedClaims.filter(c => c.status === "Pending").length})
                  </button>
                </div>
                <div className="col-auto">
                  <button 
                    className="btn btn-sm"
                    style={{ 
                      background: getPrimaryGradient(),
                      color: 'white',
                      border: 'none'
                    }}
                    onClick={() => quickFilter("Approved")}
                  >
                    <i className="bi bi-check-circle me-1"></i>Approved ({mappedClaims.filter(c => c.status === "Approved").length})
                  </button>
                </div>
                <div className="col-auto">
                  <button 
                    className="btn btn-sm"
                    style={{ 
                      background: getPrimaryGradient(),
                      color: 'white',
                      border: 'none'
                    }}
                    onClick={() => quickFilter("Rejected")}
                  >
                    <i className="bi bi-x-circle me-1"></i>Rejected ({mappedClaims.filter(c => c.status === "Rejected").length})
                  </button>
                </div>
                <div className="col-auto">
                  <button 
                    className="btn btn-sm"
                    style={{ 
                      background: getPrimaryGradient(),
                      color: 'white',
                      border: 'none'
                    }}
                    onClick={() => setStatusFilter("All")}
                  >
                    <i className="bi bi-arrow-clockwise me-1"></i>Reset Filters
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent border-bottom">
              <h5 className="mb-0" style={{ color: '#16043fff' }}>
                <i className="bi bi-funnel me-2"></i>Filters & Controls
              </h5>
            </div>
            <div className="card-body">
              <div className="row g-3 align-items-end">
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ color: '#16043fff' }}>Status Filter</label>
                  <select 
                    className="form-select" 
                    style={{ borderColor: '#0d569e' }}
                    value={statusFilter} 
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <option value="All">All Status</option>
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ color: '#16043fff' }}>Date Range</label>
                  <select 
                    className="form-select" 
                    style={{ borderColor: '#0d569e' }}
                    value={dateFilter} 
                    onChange={(e) => setDateFilter(e.target.value)}
                  >
                    <option value="all">All Time</option>
                    <option value="today">Today</option>
                    <option value="week">Last 7 Days</option>
                    <option value="month">Last 30 Days</option>
                    <option value="year">Last Year</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ color: '#16043fff' }}>Policy Filter</label>
                  <select 
                    className="form-select" 
                    style={{ borderColor: '#0d569e' }}
                    value={selectedPolicy} 
                    onChange={(e) => setSelectedPolicy(e.target.value)}
                  >
                    <option value="All">All Policies</option>
                    {policies && policies.map(policy => (
                      <option key={policy.policyId} value={policy.policyName}>
                        {policy.policyName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-3">
                  <label className="form-label fw-semibold" style={{ color: '#16043fff' }}>Displaying</label>
                  <div className="bg-light rounded p-2 text-center">
                    <strong style={{ color: '#0d569e' }}>{displayedClaims.length}</strong> of <strong>{mappedClaims.length}</strong> claims
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Tab Content */}
      {activeTab === "overview" && (
        <>
          {/* Summary Cards */}
          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-left-primary border-3 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title" style={{ color: COLORS.TEXT_MUTED }}>Total Claims</h6>
                      <h3 style={{ color: '#0d569e' }}>{mappedClaims.length}</h3>
                      <small style={{ color: COLORS.TEXT_MUTED }}>All time records</small>
                    </div>
                    <i className="bi bi-file-earmark-text fs-1" style={{ color: '#0d569e', opacity: 0.25 }}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-left-warning border-3 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title" style={{ color: COLORS.TEXT_MUTED }}>Pending Claims</h6>
                      <h3 style={{ color: COLORS.WARNING }}>{mappedClaims.filter(c => c.status === "Pending").length}</h3>
                      <small style={{ color: COLORS.TEXT_MUTED }}>Awaiting approval</small>
                    </div>
                    <i className="bi bi-clock fs-1" style={{ color: COLORS.WARNING, opacity: 0.25 }}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-left-success border-3 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title" style={{ color: COLORS.TEXT_MUTED }}>Approved Amount</h6>
                      <h3 style={{ color: COLORS.SUCCESS }}>{formatCurrency(approvedAmount)}</h3>
                      <small style={{ color: COLORS.TEXT_MUTED }}>Total approved</small>
                    </div>
                    <i className="bi bi-check-circle fs-1" style={{ color: COLORS.SUCCESS, opacity: 0.25 }}></i>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 mb-3">
              <div className="card border-left-info border-3 border-0 shadow-sm h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between">
                    <div>
                      <h6 className="card-title" style={{ color: COLORS.TEXT_MUTED }}>Average Claim</h6>
                      <h3 style={{ color: COLORS.ACCENT_1 }}>{formatCurrency(averageClaimAmount)}</h3>
                      <small style={{ color: COLORS.TEXT_MUTED }}>Per claim</small>
                    </div>
                    <i className="bi bi-currency-rupee fs-1" style={{ color: COLORS.ACCENT_1, opacity: 0.25 }}></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Charts Overview */}
          <div className="row mb-4">
            <div className="col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-transparent">
                  <h5 className="mb-0" style={{ color: '#16043fff' }}>Claims Status Overview</h5>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie 
                        data={claimStatusData} 
                        dataKey="value" 
                        nameKey="name" 
                        cx="50%" 
                        cy="50%" 
                        outerRadius={80}
                        label={({name, percent}) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {claimStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} claims`, 'Count']} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="col-md-6 mb-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-header bg-transparent">
                  <h5 className="mb-0" style={{ color: '#16043fff' }}>Monthly Trend</h5>
                </div>
                <div className="card-body">
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={monthlyClaimData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip formatter={(value) => [value, 'Claims']} />
                      <Line type="monotone" dataKey="claims" stroke={COLORS.ACCENT_3} strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Charts Tab Content */}
      {activeTab === "charts" && (
        <div className="row mb-4">
          <div className="col-12 mb-3">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ color: '#16043fff' }}>Advanced Analytics</h5>
                <select 
                  className="form-select w-auto" 
                  style={{ borderColor: '#0d569e' }}
                  value={chartType} 
                  onChange={(e) => setChartType(e.target.value)}
                >
                  <option value="pie">Pie Chart</option>
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                </select>
              </div>
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <h6 className="text-center mb-3" style={{ color: '#16043fff' }}>Claims Status Distribution</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      {chartType === "pie" ? (
                        <PieChart>
                          <Pie 
                            data={claimStatusData} 
                            dataKey="value" 
                            nameKey="name" 
                            cx="50%" 
                            cy="50%" 
                            outerRadius={100}
                            label
                          >
                            {claimStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend />
                        </PieChart>
                      ) : chartType === "bar" ? (
                        <BarChart data={claimStatusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" name="Claims">
                            {claimStatusData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Bar>
                        </BarChart>
                      ) : (
                        <LineChart data={claimStatusData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Line type="monotone" dataKey="value" stroke={COLORS.ACCENT_3} strokeWidth={2} />
                        </LineChart>
                      )}
                    </ResponsiveContainer>
                  </div>
                  <div className="col-md-6 mb-3">
                    <h6 className="text-center mb-3" style={{ color: '#16043fff' }}>Policy Usage Analysis</h6>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={policyUsageData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                        <YAxis />
                        <Tooltip formatter={(value, name) => 
                          name === 'amount' ? [formatCurrency(value), 'Total Amount'] : [value, 'Number of Claims']
                        } />
                        <Legend />
                        <Bar dataKey="claims" name="Number of Claims" fill={COLORS.ACCENT_2} />
                        <Bar dataKey="amount" name="Total Amount" fill={COLORS.ACCENT_1} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reports Tab Content */}
      {activeTab === "reports" && (
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center d-flex flex-column">
                <div className="mb-3">
                  <i className="bi bi-file-earmark-pdf fs-1" style={{ color: COLORS.ERROR }}></i>
                </div>
                <h5 style={{ color: '#16043fff' }}>Comprehensive PDF Report</h5>
                <p style={{ color: COLORS.TEXT_MUTED }} className="flex-grow-1">
                  Generate a detailed PDF report with executive summary, charts, and full claim details.
                </p>
                <button 
                  className="btn mt-auto"
                  style={{ 
                    background: getPrimaryGradient(),
                    color: 'white',
                    border: 'none'
                  }}
                  onClick={downloadClaimsPDF}
                >
                  <i className="bi bi-download me-2"></i>Download PDF
                </button>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center d-flex flex-column">
                <div className="mb-3">
                  <i className="bi bi-file-earmark-spreadsheet fs-1" style={{ color: COLORS.SUCCESS }}></i>
                </div>
                <h5 style={{ color: '#16043fff' }}>Data Export (CSV)</h5>
                <p style={{ color: COLORS.TEXT_MUTED }} className="flex-grow-1">
                  Export filtered claim data to CSV format for further analysis in Excel or other tools.
                </p>
                <CSVLink
                  data={displayedClaims}
                  headers={[
                    { label: "Employee Name", key: "employeeName" },
                    { label: "Employee ID", key: "employeeIdDisplay" },
                    { label: "Claim Type", key: "title" },
                    { label: "Amount", key: "amount" },
                    { label: "Date", key: "claimDate" },
                    { label: "Status", key: "status" },
                    { label: "Policy", key: "policyName" },
                    { label: "Remarks", key: "remarks" }
                  ]}
                  filename={`Claims_Export_${new Date().toISOString().split('T')[0]}.csv`}
                  className="btn mt-auto"
                  style={{ 
                    background: getPrimaryGradient(),
                    color: 'white',
                    border: 'none',
                    textDecoration: 'none'
                  }}
                  onClick={downloadClaimsCSV}
                >
                  <i className="bi bi-download me-2"></i>Export CSV
                </CSVLink>
              </div>
            </div>
          </div>
          <div className="col-md-4 mb-3">
            <div className="card border-0 shadow-sm h-100">
              <div className="card-body text-center d-flex flex-column">
                <div className="mb-3">
                  <i className="bi bi-graph-up fs-1" style={{ color: '#0d569e' }}></i>
                </div>
                <h5 style={{ color: '#16043fff' }}>Policy Analytics</h5>
                <p style={{ color: COLORS.TEXT_MUTED }} className="flex-grow-1">
                  Policy-wise usage statistics and analytics report for strategic planning.
                </p>
                <CSVLink
                  data={policyUsageData}
                  filename={`Policy_Analytics_${new Date().toISOString().split('T')[0]}.csv`}
                  className="btn mt-auto"
                  style={{ 
                    background: getPrimaryGradient(),
                    color: 'white',
                    border: 'none',
                    textDecoration: 'none'
                  }}
                >
                  <i className="bi bi-download me-2"></i>Policy Report
                </CSVLink>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab Content */}
      {activeTab === "history" && (
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-transparent d-flex justify-content-between align-items-center">
                <h5 className="mb-0" style={{ color: '#16043fff' }}>Report Generation History</h5>
                {reportHistory.length > 0 && (
                  <button 
                    className="btn btn-sm"
                    style={{ 
                      background: getPrimaryGradient(),
                      color: 'white',
                      border: 'none'
                    }}
                    onClick={clearHistory}
                  >
                    <i className="bi bi-trash me-1"></i>Clear All History
                  </button>
                )}
              </div>
              <div className="card-body">
                {reportHistory.length === 0 ? (
                  <div className="text-center py-5">
                    <i className="bi bi-clock-history fs-1 mb-3" style={{ color: COLORS.TEXT_MUTED }}></i>
                    <h5 style={{ color: COLORS.TEXT_MUTED }}>No Report History</h5>
                    <p style={{ color: COLORS.TEXT_MUTED }}>Generated reports will appear here for quick access.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th style={{ color: '#16043fff' }}>Report Name</th>
                          <th style={{ color: '#16043fff' }}>Generated On</th>
                          <th style={{ color: '#16043fff' }}>Type</th>
                          <th style={{ color: '#16043fff' }}>Records</th>
                          <th style={{ color: '#16043fff' }}>Filters Applied</th>
                          <th style={{ color: '#16043fff' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportHistory.map(report => (
                          <tr key={report.id}>
                            <td style={{ color: '#16043fff' }}>
                              <i className={`bi ${report.type === 'PDF' ? 'bi-file-earmark-pdf me-2' : 'bi-file-earmark-spreadsheet me-2'}`} 
                                 style={{ color: report.type === 'PDF' ? COLORS.ERROR : COLORS.SUCCESS }}></i>
                              {report.name}
                            </td>
                            <td style={{ color: '#16043fff' }}>{report.generatedOn}</td>
                            <td>
                              <span className={`badge ${report.type === 'PDF' ? 'bg-danger' : 'bg-success'}`}>
                                {report.type}
                              </span>
                            </td>
                            <td>
                              <span className="badge" style={{ backgroundColor: '#0d569e' }}>
                                {report.data ? report.data.length : 'N/A'}
                              </span>
                            </td>
                            <td>
                              <small style={{ color: COLORS.TEXT_MUTED }}>
                                Status: {report.filter?.status}, Date: {report.filter?.date}, Policy: {report.filter?.policy}
                              </small>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm"
                                style={{ 
                                  background: getPrimaryGradient(),
                                  color: 'white',
                                  border: 'none'
                                }}
                                onClick={() => downloadHistoricalReport(report)}
                                disabled={!report.data}
                                title="Download Report"
                              >
                                <i className="bi bi-download"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-transparent">
              <h5 className="mb-0" style={{ color: '#16043fff' }}>Recent Activity Summary</h5>
            </div>
            <div className="card-body">
              <div className="row text-center">
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <h4 style={{ color: '#0d569e' }}>{mappedClaims.filter(c => new Date(c.claimDate).toDateString() === new Date().toDateString()).length}</h4>
                    <small style={{ color: COLORS.TEXT_MUTED }}>Claims Today</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <h4 style={{ color: COLORS.SUCCESS }}>{mappedClaims.filter(c => c.status === "Approved" && new Date(c.claimDate).toDateString() === new Date().toDateString()).length}</h4>
                    <small style={{ color: COLORS.TEXT_MUTED }}>Approved Today</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <h4 style={{ color: COLORS.WARNING }}>{mappedClaims.filter(c => c.status === "Pending" && new Date(c.claimDate).toDateString() === new Date().toDateString()).length}</h4>
                    <small style={{ color: COLORS.TEXT_MUTED }}>Pending Today</small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3">
                    <h4 style={{ color: COLORS.ACCENT_1 }}>{policies?.length || 0}</h4>
                    <small style={{ color: COLORS.TEXT_MUTED }}>Active Policies</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}