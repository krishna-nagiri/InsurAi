// src/pages/dashboard/Employee/EmployeeHome.jsx
import React, { useMemo, useState, useEffect } from "react";
import { Line, Doughnut, Pie, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const EmployeeHome = ({
  claims = [],
  queries = [],
  policies = [],
  setActiveTab,
  employeeData,
  agentsAvailability = []
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    console.log("Claims:", claims);
    console.log("Policies:", policies);
    console.log("Queries:", queries);
  }, [claims, policies, queries]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // -------------------- Statistics Calculation --------------------
  const dashboardStats = useMemo(() => {
    const totalClaims = claims.length;
    const approvedClaims = claims.filter(claim => claim.status === 'Approved').length;
    const pendingClaims = claims.filter(claim => claim.status === 'Pending').length;
    const totalClaimAmount = claims.reduce((sum, claim) => sum + (parseFloat(claim.amount) || 0), 0);
    
    const totalQueries = queries.length;
    const resolvedQueries = queries.filter(query => query.response && query.response.trim() !== "").length;
    
    const totalPolicies = policies.length;
    const activePolicies = policies.filter(policy => policy.status === 'Active').length;
    const totalCoverage = policies.reduce((sum, policy) => {
      const coverageValue = Number(policy.coverage?.replace(/[^0-9.-]+/g, "")) || 0;
      return sum + coverageValue;
    }, 0);

    return {
      claims: { total: totalClaims, approved: approvedClaims, pending: pendingClaims, amount: totalClaimAmount },
      queries: { total: totalQueries, resolved: resolvedQueries },
      policies: { total: totalPolicies, active: activePolicies, coverage: totalCoverage }
    };
  }, [claims, queries, policies]);

  // -------------------- 2. Policy Coverage Charts --------------------
  const policyCoverageChart = useMemo(() => {
    const policyTypes = policies.reduce((acc, policy) => {
      const type = policy.policy_type || policy.category || "General";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});

    const coverageByProvider = policies.reduce((acc, policy) => {
      const provider = policy.provider || "Unknown";
      const coverageValue = Number(policy.coverage?.replace(/[^0-9.-]+/g, "")) || 0;
      acc[provider] = (acc[provider] || 0) + coverageValue;
      return acc;
    }, {});

    return {
      byType: {
        labels: Object.keys(policyTypes),
        datasets: [{
          data: Object.values(policyTypes),
          backgroundColor: ['#0d6efd', '#6f42c1', '#d63384', '#fd7e14', '#20c997', '#ffc107'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      byCoverage: {
        labels: Object.keys(coverageByProvider),
        datasets: [{
          data: Object.values(coverageByProvider),
          backgroundColor: ['#6610f2', '#e83e8c', '#6f42c1', '#fd7e14', '#20c997'],
          borderWidth: 2,
          borderColor: '#fff'
        }]
      }
    };
  }, [policies]);

  // -------------------- 3. Queries Status Chart --------------------
  const queriesStatusChart = useMemo(() => {
    const statusCounts = queries.reduce((acc, query) => {
      let status = "Open";
      if (query.response && query.response.trim() !== "") status = "Resolved";
      else if (query.status === "In Progress") status = "In Progress";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, { Open: 0, "In Progress": 0, Resolved: 0 });

    return {
      doughnut: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: ["#ffc107", "#17a2b8", "#28a745"],
            borderWidth: 2,
            borderColor: "#fff",
            cutout: "60%",
          },
        ],
      },
      bar: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            label: "Queries by Status",
            data: Object.values(statusCounts),
            backgroundColor: ["#ffc107", "#17a2b8", "#28a745"],
            borderWidth: 1,
          },
        ],
      },
    };
  }, [queries]);

  // -------------------- 4. Recent Activities --------------------
  const recentActivities = useMemo(() => {
    const activities = [
      ...claims.map(claim => ({
        id: `claim-${claim.id}`,
        type: 'claim',
        title: 'Claim Submitted',
        description: `${claim.title || 'Claim'} - ₹${claim.amount?.toLocaleString() || '0'}`,
        status: claim.status,
        date: claim.created_at || claim.submittedDate || new Date().toISOString(),
        icon: 'bi-wallet2',
        color: getStatusColor(claim.status)
      })),
      ...queries.map(query => ({
        id: `query-${query.id}`,
        type: 'query',
        title: query.response ? 'Query Resolved' : 'Query Asked',
        description: query.queryText?.substring(0, 50) + (query.queryText?.length > 50 ? '...' : ''),
        status: query.response ? 'Resolved' : 'Open',
        date: query.created_at || new Date().toISOString(),
        icon: 'bi-chat-dots',
        color: query.response ? 'success' : 'warning'
      })),
      ...policies.map(policy => ({
        id: `policy-${policy.id}`,
        type: 'policy',
        title: 'Policy Active',
        description: `${policy.name || 'N/A'} - ${policy.coverage || '₹0'} coverage`,
        status: policy.status || 'Active',
        date: policy.start_date || new Date().toISOString(),
        icon: 'bi-shield-check',
        color: 'info'
      }))
    ];

    return activities
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 8);
  }, [claims, queries, policies]);

  // -------------------- 5. Upcoming Renewals --------------------
  const upcomingRenewals = useMemo(() => {
    const renewals = policies
      .filter((policy) => policy.renewal_date)
      .map((policy) => {
        const renewalDate = new Date(policy.renewal_date);
        const daysUntilRenewal = Math.ceil((renewalDate - currentTime) / (1000 * 60 * 60 * 24));
        return {
          ...policy,
          daysUntilRenewal,
          urgency:
            daysUntilRenewal <= 7
              ? "high"
              : daysUntilRenewal <= 14
              ? "medium"
              : "low",
        };
      })
      .filter((policy) => policy.daysUntilRenewal > 0 && policy.daysUntilRenewal <= 30)
      .sort((a, b) => a.daysUntilRenewal - b.daysUntilRenewal);

    return renewals;
  }, [policies, currentTime]);

  // -------------------- 6. Quick Actions --------------------
  const quickActions = [
    { id: 1, label: "Submit Claim", icon: "bi-plus-circle", tab: "newClaim", color: "primary", description: "File a new insurance claim" },
    { id: 2, label: "Ask Question", icon: "bi-question-circle", tab: "askQuery", color: "info", description: "Get help from our agents" },
    { id: 3, label: "View Policies", icon: "bi-file-text", tab: "policies", color: "success", description: "Check your policy details" },
    { id: 4, label: "Download Documents", icon: "bi-download", tab: "policies", color: "warning", description: "Access policy documents" },
    { id: 5, label: "Support", icon: "bi-headset", tab: "support", color: "secondary", description: "Contact customer support" },
    { id: 6, label: "My Queries", icon: "bi-chat-left", tab: "myQueries", color: "dark", description: "Check query status" },
  ];

  // -------------------- Helper Functions --------------------
  function getStatusColor(status) {
    if (!status) return "secondary";
    const s = status.toLowerCase();
    if (s.includes("approve")) return "success";
    if (s.includes("reject")) return "danger";
    if (s.includes("pending") || s.includes("review")) return "warning";
    return "secondary";
  }

  const formatCurrency = (amount) => `₹${amount?.toLocaleString("en-IN") || "0"}`;

  // -------------------- Render Functions --------------------

  const renderStatsCards = () => (
    <div className="row mb-4">
      {/* Claims Stats */}
      <div className="col-xl-3 col-md-6 mb-4">
        <div className="card border-left-primary shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-primary text-uppercase mb-1">
                  Total Claims
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">
                  {dashboardStats.claims.total}
                </div>
                <div className="text-xs text-gray-600">
                  ₹{dashboardStats.claims.amount.toLocaleString('en-IN')} total
                </div>
              </div>
              <div className="col-auto">
                <i className="bi bi-wallet2 fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Policies Stats */}
      <div className="col-xl-3 col-md-6 mb-4">
        <div className="card border-left-success shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-success text-uppercase mb-1">
                  Active Policies
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">
                  {dashboardStats.policies.active}
                </div>
                <div className="text-xs text-gray-600">
                  ₹{dashboardStats.policies.coverage.toLocaleString('en-IN')} coverage
                </div>
              </div>
              <div className="col-auto">
                <i className="bi bi-shield-check fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Queries Stats */}
      <div className="col-xl-3 col-md-6 mb-4">
        <div className="card border-left-info shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-info text-uppercase mb-1">
                  Support Queries
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">
                  {dashboardStats.queries.total}
                </div>
                <div className="text-xs text-gray-600">
                  {dashboardStats.queries.resolved} resolved
                </div>
              </div>
              <div className="col-auto">
                <i className="bi bi-chat-left-text fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Renewals Stats */}
      <div className="col-xl-3 col-md-6 mb-4">
        <div className="card border-left-warning shadow-sm h-100 py-2">
          <div className="card-body">
            <div className="d-flex align-items-center">
              <div className="flex-grow-1">
                <div className="text-xs font-weight-bold text-warning text-uppercase mb-1">
                  Upcoming Renewals
                </div>
                <div className="h5 mb-0 font-weight-bold text-gray-800">
                  {upcomingRenewals.length}
                </div>
                <div className="text-xs text-gray-600">
                  Next 30 days
                </div>
              </div>
              <div className="col-auto">
                <i className="bi bi-calendar-check fa-2x text-gray-300"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderPolicyCoverageCharts = () => (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3">
        <h6 className="card-title mb-0 text-gray-800">
          <i className="bi bi-pie-chart me-2"></i>
          Policy Coverage Overview
        </h6>
      </div>
      <div className="card-body">
        <ul className="nav nav-pills mb-3" id="policyChartsTab" role="tablist">
          <li className="nav-item" role="presentation">
            <button
              className="nav-link active"
              id="type-tab"
              data-bs-toggle="pill"
              data-bs-target="#type"
              type="button"
            >
              By Type
            </button>
          </li>
          <li className="nav-item" role="presentation">
            <button
              className="nav-link"
              id="coverage-tab"
              data-bs-toggle="pill"
              data-bs-target="#coverage"
              type="button"
            >
              By Coverage
            </button>
          </li>
        </ul>
        <div className="tab-content">
          <div className="tab-pane fade show active" id="type">
            <div style={{ height: "220px" }}>
              <Doughnut
                data={policyCoverageChart.byType}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: "bottom",
                      labels: {
                        usePointStyle: true,
                        padding: 15
                      }
                    } 
                  },
                }}
              />
            </div>
          </div>
          <div className="tab-pane fade" id="coverage">
            <div style={{ height: "220px" }}>
              <Doughnut
                data={policyCoverageChart.byCoverage}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { 
                    legend: { 
                      position: "bottom",
                      labels: {
                        usePointStyle: true,
                        padding: 15
                      }
                    } 
                  },
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderQueriesStatusChart = () => (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3">
        <h6 className="card-title mb-0 text-gray-800">
          <i className="bi bi-bar-chart me-2"></i>
          Queries Status
        </h6>
      </div>
      <div className="card-body">
        <div style={{ height: "200px" }}>
          <Bar
            data={queriesStatusChart.bar}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { 
                legend: { display: false },
                tooltip: {
                  backgroundColor: '#1f2937',
                  titleColor: '#f9fafb',
                  bodyColor: '#f9fafb'
                }
              },
              scales: { 
                y: { 
                  beginAtZero: true, 
                  ticks: { stepSize: 1 },
                  grid: { color: 'rgba(0,0,0,0.1)' }
                },
                x: {
                  grid: { display: false }
                }
              },
            }}
          />
        </div>
        <div className="mt-3 text-center">
          <div className="row">
            <div className="col-4">
              <small className="text-warning">
                <i className="bi bi-circle-fill me-1"></i>
                Open: {queriesStatusChart.bar.datasets[0].data[0]}
              </small>
            </div>
            <div className="col-4">
              <small className="text-info">
                <i className="bi bi-circle-fill me-1"></i>
                In Progress: {queriesStatusChart.bar.datasets[0].data[1]}
              </small>
            </div>
            <div className="col-4">
              <small className="text-success">
                <i className="bi bi-circle-fill me-1"></i>
                Resolved: {queriesStatusChart.bar.datasets[0].data[2]}
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderRecentActivitiesTimeline = () => (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h6 className="card-title mb-0 text-gray-800">
          <i className="bi bi-clock-history me-2"></i>
          Recent Activities
        </h6>
        <span className="badge bg-primary">{recentActivities.length}</span>
      </div>
      <div className="card-body">
        <div className="timeline">
          {recentActivities.map((activity, index) => (
            <div key={activity.id} className="timeline-item d-flex mb-3 position-relative">
              <div className="timeline-marker flex-shrink-0">
                <div className={`bg-${activity.color} rounded-circle d-flex align-items-center justify-content-center`} 
                     style={{width: '32px', height: '32px'}}>
                  <i className={`${activity.icon} text-white fs-6`}></i>
                </div>
              </div>
              <div className="timeline-content ms-3 flex-grow-1">
                <div className="d-flex justify-content-between align-items-start mb-1">
                  <h6 className="mb-0 text-gray-800 fw-semibold">{activity.title}</h6>
                  <small className="text-gray-600">
                    {new Date(activity.date).toLocaleDateString("en-IN")}
                  </small>
                </div>
                <p className="mb-1 text-gray-700 small">{activity.description}</p>
                <span className={`badge bg-${activity.color}`}>{activity.status}</span>
              </div>
            </div>
          ))}
          {recentActivities.length === 0 && (
            <div className="text-center py-4">
              <i className="bi bi-activity display-4 text-gray-300 mb-3"></i>
              <h6 className="text-gray-500">No recent activities</h6>
              <p className="text-gray-600 small mb-0">Your recent activities will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderUpcomingRenewals = () => (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center">
        <h6 className="card-title mb-0 text-gray-800">
          <i className="bi bi-calendar-event me-2"></i>
          Upcoming Renewals
        </h6>
        {upcomingRenewals.length > 0 && (
          <span className={`badge bg-${
            upcomingRenewals.some((r) => r.urgency === "high") ? "warning" : "info"
          }`}>
            {upcomingRenewals.length}
          </span>
        )}
      </div>
      <div className="card-body">
        {upcomingRenewals.length > 0 ? (
          upcomingRenewals.map((renewal) => (
            <div
              key={renewal.id}
              className={`alert alert-${
                renewal.urgency === "high" ? "warning" : 
                renewal.urgency === "medium" ? "info" : "light"
              } d-flex align-items-center mb-3 p-3 border-0`}
            >
              <i className={`bi bi-${
                renewal.urgency === "high" ? "exclamation-triangle-fill" : 
                renewal.urgency === "medium" ? "info-circle-fill" : "calendar-check"
              } me-3 fs-5`}></i>
              <div className="flex-grow-1">
                <h6 className="alert-heading text-gray-800 mb-1">{renewal.name}</h6>
                <p className="text-gray-700 mb-1 small">{renewal.provider}</p>
                <small className={`text-${
                  renewal.urgency === "high" ? "warning" : 
                  renewal.urgency === "medium" ? "info" : "gray-600"
                } fw-semibold`}>
                  Renews in {renewal.daysUntilRenewal} days
                </small>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-4">
            <i className="bi bi-check-circle display-4 text-success mb-3"></i>
            <h6 className="text-gray-500">No upcoming renewals</h6>
            <p className="text-gray-600 small mb-0">All policies are up to date</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderQuickActionsPanel = () => (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-white py-3">
        <h5 className="card-title mb-0 text-gray-800">
          <i className="bi bi-lightning-fill text-warning me-2"></i> Quick Actions
        </h5>
      </div>
      <div className="card-body">
        <div className="row g-3">
          {quickActions.map((action) => (
            <div key={action.id} className="col-xl-4 col-lg-6 col-md-6">
              <button
                className={`btn btn-${action.color} w-100 h-100 py-3 d-flex flex-column align-items-center justify-content-center shadow-sm border-0`}
                onClick={() => setActiveTab(action.tab)}
                title={action.description}
              >
                <i className={`${action.icon} fs-2 mb-2`}></i>
                <span className="fw-semibold small">{action.label}</span>
                <small className="text-white opacity-75 mt-1">{action.description}</small>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // -------------------- Layout --------------------
  return (
    <div className="p-4">
      {/* Header Section */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold text-gray-800 mb-1">Dashboard Overview</h4>
          <p className="text-gray-600 mb-0">
            Welcome back! Here's your insurance summary for {currentTime.toLocaleDateString("en-IN")}
          </p>
        </div>
        <div className="text-end">
          <div className="badge bg-light text-dark p-2 border">
            <i className="bi bi-clock me-1"></i>
            {currentTime.toLocaleTimeString("en-IN", { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            })}
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {renderStatsCards()}

      {/* Quick Actions */}
      {renderQuickActionsPanel()}

      {/* Charts Row */}
      <div className="row mb-4">
        <div className="col-xl-6 col-lg-6 mb-4">
          {renderPolicyCoverageCharts()}
        </div>
        <div className="col-xl-6 col-lg-6 mb-4">
          {renderQueriesStatusChart()}
        </div>
      </div>

      {/* Activities & Renewals Row */}
      <div className="row">
        <div className="col-xl-8 col-lg-7 mb-4">
          {renderRecentActivitiesTimeline()}
        </div>
        <div className="col-xl-4 col-lg-5 mb-4">
          {renderUpcomingRenewals()}
        </div>
      </div>

      <style>{`
        .timeline-item { position: relative; }
        .timeline-item:not(:last-child):after {
          content: '';
          position: absolute;
          left: 16px;
          top: 40px;
          bottom: -20px;
          width: 2px;
          background-color: #e9ecef;
        }
        .timeline-marker {
          z-index: 1;
        }
        .card {
          transition: transform 0.2s ease-in-out;
        }
        .card:hover {
          transform: translateY(-2px);
        }
        .btn {
          transition: all 0.2s ease-in-out;
        }
        .btn:hover {
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  );
};

export default EmployeeHome;