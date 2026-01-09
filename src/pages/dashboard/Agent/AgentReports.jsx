import React, { useState, useMemo } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";
import Papa from "papaparse";

export default function AgentReports({ 
  assistedClaims = [], 
  employeeQueries = [],
  agentData = {}
}) {
  const [dateRange, setDateRange] = useState("30days");
  const [activeChart, setActiveChart] = useState("status");

  const theme = {
    primary: "#3B82F6",
    secondary: "#8B5CF6",
    success: "#10B981",
    info: "#06B6D4",
    warning: "#F59E0B",
    danger: "#EF4444",
    light: "#F8FAFC",
    dark: "#1E293B",
    gray: {
      100: "#F1F5F9",
      200: "#E2E8F0",
      300: "#CBD5E1",
      400: "#94A3B8",
      500: "#64748B",
      600: "#475569",
      700: "#334155",
      800: "#1E293B",
      900: "#0F172A"
    }
  };

  // Calculate date range based on selection
  const getDateRange = useMemo(() => {
    const end = new Date();
    let start = new Date();
    
    switch(dateRange) {
      case "7days":
        start.setDate(end.getDate() - 7);
        break;
      case "30days":
        start.setDate(end.getDate() - 30);
        break;
      case "90days":
        start.setDate(end.getDate() - 90);
        break;
      default:
        start.setDate(end.getDate() - 30);
    }
    
    return { start, end };
  }, [dateRange]);

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const { start, end } = getDateRange; // ✅ use destructured object directly

    const filteredClaims = assistedClaims.filter(claim => {
      const claimDate = new Date(claim.createdAt);
      return claimDate >= start && claimDate <= end;
    });

    const filteredQueries = employeeQueries.filter(query => {
      const queryDate = new Date(query.createdAt);
      return queryDate >= start && queryDate <= end;
    });

    return { claims: filteredClaims, queries: filteredQueries };
  }, [assistedClaims, employeeQueries, getDateRange]);

  // Performance metrics with correct claim success
  const performanceMetrics = useMemo(() => {
    const { claims, queries } = filteredData;

    const totalQueries = queries.length;
    const resolvedQueries = queries.filter(q => q.status?.toLowerCase() === "resolved").length;
    const resolutionRate = totalQueries > 0 ? Math.round((resolvedQueries / totalQueries) * 100) : 0;

    const totalClaims = claims.length;
    // ✅ Corrected claim success: case-insensitive check
    const approvedClaims = claims.filter(c => c.status?.toLowerCase() === "approved").length;
    const claimSuccessRate = totalClaims > 0 ? Math.round((approvedClaims / totalClaims) * 100) : 0;

    const baseRating = 4.0;
    const performanceBonus = (resolutionRate / 100) * 0.5 + (claimSuccessRate / 100) * 0.3;
    const satisfactionRating = Math.min(5.0, baseRating + performanceBonus);

    const queriesByDay = {};
    const queriesByType = {};
    const claimsByStatus = {
      'approved': approvedClaims,
      'pending': claims.filter(c => c.status?.toLowerCase() === 'pending').length,
      'rejected': claims.filter(c => c.status?.toLowerCase() === 'rejected').length
    };

    const performanceByHour = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      queries: Math.floor(Math.random() * 10) + 1 // simulated
    }));

    queries.forEach(query => {
      const date = new Date(query.createdAt);
      const day = date.toLocaleDateString('en-US', { weekday: 'short' });
      queriesByDay[day] = (queriesByDay[day] || 0) + 1;

      const type = query.claimType || "General";
      queriesByType[type] = (queriesByType[type] || 0) + 1;
    });

    return {
      totalQueries,
      resolvedQueries,
      resolutionRate,
      totalClaims,
      approvedClaims,
      claimSuccessRate,
      satisfactionRating: parseFloat(satisfactionRating.toFixed(1)),
      queriesByDay,
      queriesByType,
      claimsByStatus,
      performanceByHour
    };
  }, [filteredData]);

  // Stats cards
 // Enhanced Statistics Cards - removed Success Rate card
const renderStatsCards = () => (
  <div className="row mb-4">
    {[
      { 
        title: "Queries Handled", 
        value: performanceMetrics.totalQueries, 
        icon: "bi-chat-left-text", 
        color: "primary",
        description: "Total inquiries processed"
      },
      { 
        title: "Resolution Rate", 
        value: `${performanceMetrics.resolutionRate}%`, 
        icon: "bi-check-circle", 
        color: "success",
        description: "Queries successfully resolved"
      },
      { 
        title: "Satisfaction Rate", 
        value: `${performanceMetrics.satisfactionRating}/5`, 
        icon: "bi-star", 
        color: "warning",
        description: "Customer satisfaction score"
      },
      
    ].map((stat, idx) => (
      <div key={idx} className="col-xl-4 col-md-6 mb-4">
        <div className="card border-0 shadow-sm h-100" style={{ 
          borderLeft: `4px solid ${theme[stat.color]}`,
          background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease'
        }}>
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-uppercase mb-1" style={{ color: theme[stat.color] }}>
                  {stat.title}
                </div>
                <div className="h4 mb-0 font-weight-bold" style={{ color: theme.dark }}>{stat.value}</div>
                <small className="text-muted">{stat.description}</small>
              </div>
              <div className="col-auto">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                  style={{ 
                    width: '50px', 
                    height: '50px', 
                    backgroundColor: `${theme[stat.color]}15`,
                    border: `2px solid ${theme[stat.color]}20`
                  }}
                >
                  <i 
                    className={`bi ${stat.icon}`} 
                    style={{ color: theme[stat.color], fontSize: '1.5rem' }}
                  ></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ))}
  </div>
);


  // Enhanced Charts Section with 4 different chart types
  const renderCharts = () => (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3 border-0">
        <div className="d-flex justify-content-between align-items-center">
          <h6 className="font-weight-bold mb-0" style={{ color: theme.dark }}>Performance Analytics</h6>
          <div className="btn-group btn-group-sm">
            {[
              { key: "status", label: "Status", icon: "bi-pie-chart" },
              { key: "types", label: "Types", icon: "bi-bar-chart" },
              { key: "timeline", label: "Timeline", icon: "bi-graph-up" },
              { key: "performance", label: "Performance", icon: "bi-speedometer2" }
            ].map(chart => (
              <button
                key={chart.key}
                className={`btn ${activeChart === chart.key ? "btn-primary" : "btn-outline-primary"} rounded-pill px-3`}
                onClick={() => setActiveChart(chart.key)}
              >
                <i className={`${chart.icon} me-1`}></i>
                {chart.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="card-body">
        {/* Status Distribution Pie Chart */}
        {activeChart === "status" && (
          <div className="row align-items-center">
            <div className="col-md-6">
              <div className="d-flex justify-content-center">
                <div 
                  className="rounded-circle d-flex align-items-center justify-content-center position-relative shadow-sm"
                  style={{ 
                    width: '250px', 
                    height: '250px', 
                    background: `conic-gradient(
                      ${theme.success} 0% ${(performanceMetrics.resolvedQueries / performanceMetrics.totalQueries) * 100}%,
                      ${theme.warning} 0% 100%
                    )`
                  }}
                >
                  <div 
                    className="rounded-circle bg-white d-flex align-items-center justify-content-center shadow"
                    style={{ width: '180px', height: '180px' }}
                  >
                    <div className="text-center">
                      <div className="h4 mb-0 font-weight-bold" style={{ color: theme.dark }}>
                        {performanceMetrics.resolutionRate}%
                      </div>
                      <small className="text-muted">Resolved</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <div className="d-flex align-items-center mb-3 p-2 rounded" style={{ backgroundColor: theme.gray[50] }}>
                  <div 
                    className="rounded me-3 shadow-sm"
                    style={{ width: '16px', height: '16px', backgroundColor: theme.success }}
                  ></div>
                  <span className="flex-grow-1 fw-semibold" style={{ color: theme.dark }}>Resolved Queries</span>
                  <span className="fw-bold" style={{ color: theme.dark }}>{performanceMetrics.resolvedQueries}</span>
                  <span className="text-muted ms-2">
                    ({performanceMetrics.totalQueries > 0 ? Math.round((performanceMetrics.resolvedQueries / performanceMetrics.totalQueries) * 100) : 0}%)
                  </span>
                </div>
                <div className="d-flex align-items-center mb-3 p-2 rounded" style={{ backgroundColor: theme.gray[50] }}>
                  <div 
                    className="rounded me-3 shadow-sm"
                    style={{ width: '16px', height: '16px', backgroundColor: theme.warning }}
                  ></div>
                  <span className="flex-grow-1 fw-semibold" style={{ color: theme.dark }}>Pending Queries</span>
                  <span className="fw-bold" style={{ color: theme.dark }}>{performanceMetrics.totalQueries - performanceMetrics.resolvedQueries}</span>
                  <span className="text-muted ms-2">
                    ({performanceMetrics.totalQueries > 0 ? Math.round(((performanceMetrics.totalQueries - performanceMetrics.resolvedQueries) / performanceMetrics.totalQueries) * 100) : 0}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Query Types Bar Chart */}
        {activeChart === "types" && (
          <div>
            <h6 className="text-center mb-4">Queries by Type</h6>
            <div className="row">
              {Object.entries(performanceMetrics.queriesByType).map(([type, count], index) => {
                const percentage = (count / performanceMetrics.totalQueries) * 100;
                const colors = [theme.primary, theme.info, theme.success, theme.warning, theme.secondary];
                const color = colors[index % colors.length];
                
                return (
                  <div key={type} className="col-md-6 mb-3">
                    <div className="d-flex align-items-center p-3 rounded" style={{ backgroundColor: theme.gray[50] }}>
                      <div className="flex-grow-1">
                        <div className="d-flex justify-content-between mb-2">
                          <span className="fw-semibold" style={{ color: theme.dark }}>{type}</span>
                          <span className="fw-bold" style={{ color: theme.dark }}>{count}</span>
                        </div>
                        <div className="progress" style={{ height: '12px', backgroundColor: theme.gray[200] }}>
                          <div 
                            className="progress-bar rounded" 
                            role="progressbar" 
                            style={{ 
                              width: `${percentage}%`,
                              backgroundColor: color
                            }}
                            aria-valuenow={percentage} 
                            aria-valuemin="0" 
                            aria-valuemax="100"
                          ></div>
                        </div>
                        <div className="text-end mt-1">
                          <small className="text-muted">{percentage.toFixed(1)}%</small>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Timeline Area Chart */}
        {activeChart === "timeline" && (
          <div>
            <h6 className="text-center mb-4">Weekly Query Distribution</h6>
            <div className="d-flex align-items-end justify-content-between" style={{ height: '200px', padding: '0 20px' }}>
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => {
                const count = performanceMetrics.queriesByDay[day] || 0;
                const maxCount = Math.max(...Object.values(performanceMetrics.queriesByDay), 1);
                const height = (count / maxCount) * 150;
                
                return (
                  <div key={day} className="flex-fill text-center mx-1">
                    <div className="d-flex align-items-end justify-content-center" style={{ height: '150px' }}>
                      <div 
                        className="rounded-top mx-1 transition-all position-relative"
                        style={{ 
                          height: `${height}px`, 
                          width: '35px',
                          background: `linear-gradient(to top, ${theme.primary}, ${theme.secondary})`,
                          opacity: 0.8,
                          cursor: 'pointer'
                        }}
                        title={`${count} queries on ${day}`}
                      >
                        <div 
                          className="position-absolute top-0 start-50 translate-middle-x badge rounded-pill"
                          style={{ 
                            backgroundColor: theme.dark,
                            fontSize: '0.6rem',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                    <div className="small text-muted mt-2 fw-semibold">{day}</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Performance Gauge Chart */}
        {activeChart === "performance" && (
          <div className="text-center">
            <h6 className="mb-4">Overall Performance Score</h6>
            <div className="position-relative d-inline-block">
              {/* Gauge Background */}
              <div 
                className="rounded-circle position-relative"
                style={{
                  width: '200px',
                  height: '200px',
                  background: `conic-gradient(
                    ${theme.danger} 0% 25%,
                    ${theme.warning} 25% 50%,
                    ${theme.info} 50% 75%,
                    ${theme.success} 75% 100%
                  )`,
                  mask: 'radial-gradient(transparent 60%, black 61%)'
                }}
              ></div>
              
              {/* Needle */}
              <div 
                className="position-absolute top-0 start-50 translate-middle-x"
                style={{
                  width: '2px',
                  height: '90px',
                  backgroundColor: theme.dark,
                  transform: `rotate(${performanceMetrics.satisfactionRating * 36 - 90}deg)`,
                  transformOrigin: 'bottom center',
                  transition: 'transform 0.5s ease'
                }}
              ></div>
              
              {/* Center circle */}
              <div 
                className="position-absolute top-50 start-50 translate-middle rounded-circle bg-white shadow"
                style={{
                  width: '30px',
                  height: '30px'
                }}
              ></div>
              
              {/* Score */}
              <div className="position-absolute top-50 start-50 translate-middle text-center">
                <div className="h3 mb-0 fw-bold" style={{ color: theme.dark }}>
                  {performanceMetrics.satisfactionRating}
                </div>
                <small className="text-muted">/5</small>
              </div>
            </div>
            
            <div className="mt-4 row justify-content-center">
              <div className="col-auto">
                <span className="badge" style={{ backgroundColor: theme.danger }}>Poor</span>
              </div>
              <div className="col-auto">
                <span className="badge" style={{ backgroundColor: theme.warning }}>Fair</span>
              </div>
              <div className="col-auto">
                <span className="badge" style={{ backgroundColor: theme.info }}>Good</span>
              </div>
              <div className="col-auto">
                <span className="badge" style={{ backgroundColor: theme.success }}>Excellent</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Export Functions
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Title
    doc.setFontSize(20);
    doc.setTextColor(theme.primary);
    doc.text("Agent Performance Report", 14, 20);
    
    // Summary Section
    doc.setFontSize(12);
    doc.setTextColor(theme.dark);
    doc.text(`Report Period: Last ${dateRange}`, 14, 35);
    doc.text(`Total Queries: ${performanceMetrics.totalQueries}`, 14, 45);
    doc.text(`Resolution Rate: ${performanceMetrics.resolutionRate}%`, 14, 55);
    doc.text(`Satisfaction Rating: ${performanceMetrics.satisfactionRating}/5`, 14, 65);
    
    // Queries Table
    const queryData = employeeQueries.map(q => [
      q.id,
      q.employee || 'N/A',
      q.query?.substring(0, 30) + '...' || 'N/A',
      q.status,
      q.response?.substring(0, 20) + '...' || 'No response',
      new Date(q.createdAt).toLocaleDateString()
    ]);
    
    doc.autoTable({
      head: [['ID', 'Employee', 'Query', 'Status', 'Response', 'Created Date']],
      body: queryData,
      startY: 75,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    doc.save(`Agent-Performance-Report-${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const generateCSV = () => {
    const data = employeeQueries.map(q => ({
      ID: q.id,
      Employee: q.employee,
      Query: q.query,
      Status: q.status,
      Response: q.response,
      CreatedAt: new Date(q.createdAt).toLocaleString(),
      ResolvedAt: q.resolvedAt ? new Date(q.resolvedAt).toLocaleString() : 'N/A'
    }));
    
    const csv = Papa.unparse(data);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Agent-Queries-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Buttons
  const renderExportButtons = () => (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-8">
            <h6 className="font-weight-bold mb-1" style={{ color: theme.dark }}>Export Reports</h6>
            <small className="text-muted">Download detailed performance data in various formats</small>
          </div>
          <div className="col-md-4">
            <div className="d-flex gap-2">
              <button 
                className="btn btn-outline-danger flex-fill d-flex align-items-center justify-content-center"
                onClick={generatePDF}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-file-earmark-pdf me-2"></i>
                PDF
              </button>
              <button 
                className="btn btn-outline-success flex-fill d-flex align-items-center justify-content-center"
                onClick={generateCSV}
                style={{ borderRadius: '8px' }}
              >
                <i className="bi bi-file-earmark-excel me-2"></i>
                CSV
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="mb-4">
      <div className="mb-4">
        <h3 className="fw-bold mb-1" style={{ background: 'linear-gradient(to right, #010f0c, #087f5b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Agent Performance Reports</h3>
        <p style={{ color: theme.gray[600] }} className="mb-0">
          Comprehensive analytics and performance metrics with advanced visualizations
        </p>
      </div>
      
      {renderStatsCards()}
      {renderCharts()}
      {renderExportButtons()}
    </div>
  );
}