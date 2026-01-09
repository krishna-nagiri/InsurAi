import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import jsPDF from "jspdf";
import "jspdf-autotable";
import ReportsAnalytics from "./ReportsAnalytics";
import HRClaims from "./HRClaims";
import HRPolicies from "./HRPolicies";
import HREmployees from "./HREmployees"; 
import HRFraud from "./HRFraud";
import HRNotification from "./HRNotification";

// Enhanced HR Dashboard with Enterprise Features
export default function HRDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("home");

  // Enhanced State Management
  const [pendingClaims, setPendingClaims] = useState([]);
  const [mappedClaims, setMappedClaims] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [hrs, setHrs] = useState([]);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [viewingClaim, setViewingClaim] = useState(null);
  const [remarksInput, setRemarksInput] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchName, setSearchName] = useState("");
  const [policyFilter, setPolicyFilter] = useState("");

  // Enhanced Dashboard States
  const [dashboardStats, setDashboardStats] = useState({
    pendingClaims: 0,
    approvedClaims: 0,
    rejectedClaims: 0,
    totalClaimsAmount: 0,
    pendingAmount: 0,
    activePolicies: 0,
    expiringPolicies: 0,
    activeEmployees: 0,
    totalEmployees: 0,
    approvalRate: 0,
    avgProcessingTime: "2.3 days",
    highPriorityClaims: 0,
    totalCoverageAmount: 0,
    monthlyPremium: 0,
    fraudRiskScore: 0
  });

  const [loading, setLoading] = useState({
    claims: true,
    employees: true,
    policies: true,
    dashboard: true
  });

  const [notifications, setNotifications] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [performanceMetrics, setPerformanceMetrics] = useState({});
  const [quickActions, setQuickActions] = useState([]);

  // claim notification count for sidebar / quick actions
  const [claimNotifications, setClaimNotifications] = useState(0);

  const loggedInHrId = parseInt(localStorage.getItem("id"));

  // clear claim notifications when user navigates to the claims tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === "claims") {
      setClaimNotifications(0);
    }
  };

  // Enhanced Data Fetching with Error Handling
  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, employees: true }));
      const response = await fetch("http://localhost:8077/auth/employees");
      if (!response.ok) throw new Error('Failed to fetch employees');
      const data = await response.json();
      setEmployees(Array.isArray(data) ? data : []);
      console.debug("fetchEmployees ->", Array.isArray(data) ? data.length : 0);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error fetching employees:", err);
      addNotification('error', 'Failed to load employee data', true);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, employees: false }));
    }
  }, []);

  const fetchHRList = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:8077/hr");
      if (!response.ok) throw new Error('Failed to fetch HR list');
      const data = await response.json();
      setHrs(Array.isArray(data) ? data : []);
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error("Error fetching HR list:", err);
      addNotification('error', 'Failed to load HR team data', true);
      return [];
    }
  }, []);

  const fetchPolicies = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, policies: true }));
      const token = localStorage.getItem("token");
      const response = await fetch("http://localhost:8077/employee/policies", {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      if (!response.ok) {
        throw new Error('Failed to fetch policies');
      }

      const data = await response.json();
      const policiesArray = Array.isArray(data) ? data : (data?.policies ?? []);
      const formattedPolicies = policiesArray.map(policy => ({
        id: policy.id ?? policy.policyId ?? null,
        policyName: policy.policyName ?? policy.name ?? "Unknown Policy",
        policyType: policy.policyType ?? policy.type ?? "General",
        providerName: policy.providerName ?? policy.provider ?? "Unknown",
        coverageAmount: Number(policy.coverageAmount ?? policy.coverage ?? 0) || 0,
        monthlyPremium: Number(policy.monthlyPremium ?? policy.premium ?? 0) || 0,
        renewalDate: policy.renewalDate ?? policy.renewal_date ?? null,
        policyStatus: policy.policyStatus ?? policy.status ?? "Unknown",
        policyDescription: policy.policyDescription ?? policy.description ?? "",
        contractUrl: policy.contractUrl ?? policy.contract_url ?? null,
        termsUrl: policy.termsUrl ?? policy.terms_url ?? null,
        claimFormUrl: policy.claimFormUrl ?? policy.claim_form_url ?? null,
        annexureUrl: policy.annexureUrl ?? policy.annexure_url ?? null,
      }));
      setPolicies(formattedPolicies);
      console.debug("fetchPolicies ->", formattedPolicies.length);
      return formattedPolicies;
    } catch (err) {
      console.error("Error fetching policies:", err);
      addNotification('error', 'Failed to load policy data', true);
      return [];
    } finally {
      setLoading(prev => ({ ...prev, policies: false }));
    }
  }, []);

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, claims: true }));
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/hr/login");
        return;
      }

      const response = await fetch(`http://localhost:8077/hr/claims?hrId=${loggedInHrId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setPendingClaims(data);
        processEnhancedDashboardStats(data);
        addNotification('success', `Loaded ${data.length} claims successfully`);
      } else if (response.status === 403) {
        navigate("/hr/login");
      } else {
        throw new Error('Failed to fetch claims');
      }
    } catch (err) {
      console.error("Error fetching claims:", err);
      addNotification('error', 'Failed to load claim data');
    } finally {
      setLoading(prev => ({ ...prev, claims: false }));
    }
  }, [loggedInHrId, navigate]);

  // memoize employees/policies to break circular deps
  const memoizedEmployees = useMemo(() => employees, [employees.length]);
  const memoizedPolicies = useMemo(() => policies, [policies.length]);

  // memoize helpers so stats callback can stay stable
  const calculateFraudRiskScore = useCallback((claims) => {
    if (!Array.isArray(claims) || claims.length === 0) return 0;
    const highAmountClaims = claims.filter(claim => parseFloat(claim.amount) > 100000).length;
    const recentClaims = claims.filter(claim => {
      const claimDate = new Date(claim.claimDate);
      const daysAgo = (new Date() - claimDate) / (1000 * 60 * 60 * 24);
      return daysAgo < 30;
    }).length;
    return Math.min(100, Math.round((highAmountClaims / claims.length) * 50 + (recentClaims / claims.length) * 50));
  }, []);

  const calculateAverageProcessingTime = useCallback((claims) => {
    const processedClaims = (Array.isArray(claims) ? claims : []).filter(claim => claim.status !== "Pending");
    if (processedClaims.length === 0) return "0 days";
    const totalProcessingTime = processedClaims.reduce((sum, claim) => {
      const created = new Date(claim.createdDate || claim.claimDate || Date.now());
      const processed = new Date(claim.processedDate || Date.now());
      return sum + (processed - created);
    }, 0);
    const avgDays = totalProcessingTime / (processedClaims.length * 1000 * 60 * 60 * 24);
    return `${avgDays.toFixed(1)} days`;
  }, []);

  // stable stats processor using memoizedEmployees/policies
  const processEnhancedDashboardStats = useCallback((claims) => {
    const cls = Array.isArray(claims) ? claims : [];
    const emps = memoizedEmployees || [];
    const pols = memoizedPolicies || [];

    const pendingClaims = cls.filter(c => (c.status ?? c.claim_status) === "Pending");
    const approvedClaims = cls.filter(c => (c.status ?? c.claim_status) === "Approved");
    const rejectedClaims = cls.filter(c => (c.status ?? c.claim_status) === "Rejected");

    const getAmount = c => parseFloat(c.amount ?? c.claim_amount ?? 0) || 0;
    const totalClaimsAmount = cls.reduce((sum, c) => sum + getAmount(c), 0);
    const pendingAmount = pendingClaims.reduce((sum, c) => sum + getAmount(c), 0);

    const activePolicies = pols.length;
    const totalCoverageAmount = pols.reduce((sum, p) => sum + (parseFloat(p.coverageAmount ?? p.total_coverage ?? 0) || 0), 0);

    const totalEmployees = emps.length;
    const activeEmployees = emps.some(e => typeof e.active !== "undefined") ? emps.filter(e => e.active).length : totalEmployees;

    const approvalRate = cls.length > 0 ? Math.round((approvedClaims.length / cls.length) * 100) : 0;
    const avgProcessingTime = calculateAverageProcessingTime(cls);
    const fraudRiskScore = calculateFraudRiskScore(cls);

    setDashboardStats({
      pendingClaims: pendingClaims.length,
      approvedClaims: approvedClaims.length,
      rejectedClaims: rejectedClaims.length,
      totalClaimsAmount,
      pendingAmount,
      activePolicies,
      expiringPolicies: 0,
      activeEmployees,
      totalEmployees,
      approvalRate,
      avgProcessingTime,
      highPriorityClaims: pendingClaims.filter(c => getAmount(c) > 50000).length,
      totalCoverageAmount,
      monthlyPremium: 0,
      fraudRiskScore,
    });
  }, [memoizedEmployees, memoizedPolicies, calculateAverageProcessingTime, calculateFraudRiskScore]);

  // only trigger when backend arrays change (use lengths to avoid callback instability)
  useEffect(() => {
    if (pendingClaims.length > 0 && employees.length > 0 && policies.length > 0) {
      processEnhancedDashboardStats(pendingClaims);
    }
  }, [pendingClaims, employees.length, policies.length, processEnhancedDashboardStats]);

  // Enhanced Notification System
  const addNotification = (type, message, autoClose = true) => {
    const id = Date.now(); // unique ID for each notification
    const notification = {
      id,
      type,
      message,
      timestamp: new Date(),
      read: false
    };

    // Add the new notification at the start (do not slice unless you want a hard max)
    setNotifications(prev => [notification, ...prev]);

    // Auto-remove after 5 seconds (use functional update to avoid stale state)
    if (autoClose) {
      const timer = setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
      // optional: store timers if you want to clear on unmount (not strictly required here)
    }
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notification => ({ ...notification, read: true })));
  };

  // Auto-mark notifications as read after 5s to improve UX (cleans up timely)
  useEffect(() => {
    const timers = [];
    notifications.forEach(n => {
      if (!n.read) {
        const t = setTimeout(() => {
          setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        }, 5000);
        timers.push(t);
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [notifications]);

  // Enhanced Modal Handlers
  const openViewModal = (claim) => {
    setViewingClaim(claim);
    addNotification('info', `Viewing claim from ${claim.employeeName}`);
  };

  const closeViewModal = () => setViewingClaim(null);

  const handleView = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
    addNotification('info', `Viewing employee: ${employee.name}`);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  const handleEdit = (employee) => {
    addNotification('warning', `Edit feature coming soon for: ${employee.name}`);
  };

  // Enhanced Claim Mapping
  useEffect(() => {
    if (pendingClaims.length > 0 && employees.length > 0 && hrs.length > 0 && policies.length > 0) {
      const updatedClaims = pendingClaims.map(claim => {
        const employee = employees.find(emp => emp.id === claim.employeeId || claim.employee_id);
        const hr = hrs.find(hr => hr.id === claim.assignedHrId || claim.assigned_hr_id);
        const policy = policies.find(p => p.id === claim.policyId || claim.policy_id);

        return {
          ...claim,
          employeeName: employee?.name || "Unknown",
          employeeIdDisplay: employee?.employeeId || "N/A",
          documents: claim.documents || [],
          assignedHrName: hr?.name || "Not Assigned",
          policyName: policy?.policyName || "N/A",
          canModify: claim.assignedHrId === loggedInHrId || claim.assigned_hr_id === loggedInHrId,
          remarks: claim.remarks || "",
          priority: calculateClaimPriority(claim),
          daysPending: calculateDaysPending(claim)
        };
      });
      setMappedClaims(updatedClaims);
    }
  }, [pendingClaims, employees, hrs, policies, loggedInHrId]);

  const calculateClaimPriority = (claim) => {
    const amount = parseFloat(claim.amount) || 0;
    if (amount > 100000) return "High";
    if (amount > 50000) return "Medium";
    return "Low";
  };

  const calculateDaysPending = (claim) => {
    const claimDate = new Date(claim.claimDate);
    const today = new Date();
    return Math.ceil((today - claimDate) / (1000 * 60 * 60 * 24));
  };

  // Enhanced Claim Actions
  const approveClaim = async (id, remarks) => {
    const claim = mappedClaims.find(c => c.id === id);
    if (!claim.canModify) {
      addNotification('error', 'You are not assigned to this claim');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8077/hr/claims/approve/${id}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ remarks })
      });
      
      if (response.ok) {
        const updatedClaim = await response.json();
        const hr = hrs.find(hr => hr.id === updatedClaim.assignedHrId);
        const policy = policies.find(p => p.id === updatedClaim.policyId);
        
        setMappedClaims(prev =>
          prev.map(c => (c.id === id ? {
            ...updatedClaim,
            employeeName: employees.find(emp => emp.id === updatedClaim.employeeId)?.name || "Unknown",
            employeeIdDisplay: employees.find(emp => emp.id === updatedClaim.employeeId)?.employeeId || "N/A",
            documents: updatedClaim.documents || [],
            assignedHrName: hr?.name || "Not Assigned",
            policyName: policy?.policyName || "N/A",
            canModify: updatedClaim.assignedHrId === loggedInHrId,
            remarks: updatedClaim.remarks || ""
          } : c))
        );
        
        addNotification('success', `Claim approved successfully for ${claim.employeeName}`);
        fetchClaims(); // Refresh claims data
      } else {
        throw new Error('Failed to approve claim');
      }
    } catch (err) {
      console.error("Error approving claim:", err);
      addNotification('error', 'Failed to approve claim');
    }
  };

  const rejectClaim = async (id, remarks) => {
    const claim = mappedClaims.find(c => c.id === id);
    if (!claim.canModify) {
      addNotification('error', 'You are not assigned to this claim');
      return;
    }
    
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`http://localhost:8077/hr/claims/reject/${id}`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ remarks })
      });
      
      if (response.ok) {
        const updatedClaim = await response.json();
        const hr = hrs.find(hr => hr.id === updatedClaim.assignedHrId);
        const policy = policies.find(p => p.id === updatedClaim.policyId);
        
        setMappedClaims(prev =>
          prev.map(c => (c.id === id ? {
            ...updatedClaim,
            employeeName: employees.find(emp => emp.id === updatedClaim.employeeId)?.name || "Unknown",
            employeeIdDisplay: employees.find(emp => emp.id === updatedClaim.employeeId)?.employeeId || "N/A",
            documents: updatedClaim.documents || [],
            assignedHrName: hr?.name || "Not Assigned",
            policyName: policy?.policyName || "N/A",
            canModify: updatedClaim.assignedHrId === loggedInHrId,
            remarks: updatedClaim.remarks || ""
          } : c))
        );
        
        addNotification('warning', `Claim rejected for ${claim.employeeName}`);
        fetchClaims(); // Refresh claims data
      } else {
        throw new Error('Failed to reject claim');
      }
    } catch (err) {
      console.error("Error rejecting claim:", err);
      addNotification('error', 'Failed to reject claim');
    }
  };

  // Enhanced Data Export Functions
  const downloadCSV = () => {
    if (!displayedClaims.length) {
      addNotification('warning', 'No claims available to download');
      return;
    }

    const headers = [
      "Employee Name", "Employee ID", "Claim Type", "Amount", "Date",
      "Status", "Policy Name", "Remarks", "Priority", "Days Pending", "Documents"
    ];

    const rows = displayedClaims.map(c => [
      c.employeeName,
      c.employeeIdDisplay,
      c.title,
      c.amount,
      c.claimDate?.split("T")[0],
      c.status,
      c.policyName,
      c.remarks || "",
      c.priority,
      c.daysPending,
      c.documents?.length > 0 ? c.documents.map(d => `http://localhost:8077${d}`).join(" | ") : "No documents"
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `claims_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('success', 'CSV export completed successfully');
  };

  const downloadPDF = () => {
    if (!displayedClaims.length) {
      addNotification('warning', 'No claims available to download');
      return;
    }

    const doc = new jsPDF();
    
    // Add header with theme colors
    doc.setFontSize(16);
    doc.setTextColor(22, 4, 63); // #16043f
    doc.text('Claims Report - InsurAI Enterprise', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 22);
    doc.text(`Total Claims: ${displayedClaims.length}`, 14, 28);

    const rows = displayedClaims.map(c => [
      c.employeeName,
      c.employeeIdDisplay,
      c.title,
      `₹${c.amount}`,
      c.claimDate?.split("T")[0],
      c.status,
      c.policyName,
      c.priority,
      c.daysPending
    ]);

    doc.autoTable({
      head: [[
        "Employee", "ID", "Type", "Amount", "Date", "Status", "Policy", "Priority", "Days"
      ]],
      body: rows,
      startY: 35,
      theme: "grid",
      headStyles: { 
        fillColor: [22, 4, 63], // #16043f
        textColor: 255,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 8,
        cellPadding: 2,
        overflow: 'linebreak',
        halign: 'center',
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 15 },
        2: { cellWidth: 20 },
        3: { cellWidth: 15 },
        4: { cellWidth: 15 },
        5: { cellWidth: 15 },
        6: { cellWidth: 25 },
        7: { cellWidth: 12 },
        8: { cellWidth: 12 }
      },
      margin: { left: 10, right: 10 }
    });

    doc.save(`claims_report_${new Date().toISOString().split('T')[0]}.pdf`);
    addNotification('success', 'PDF report generated successfully');
  };

  // Enhanced Filtering
  const filteredEmployees = employees.filter(emp => {
    const matchesName = emp.name?.toLowerCase().includes(searchName.toLowerCase());
    const matchesPolicy = policyFilter === "" || emp.role === policyFilter;
    return matchesName && matchesPolicy;
  });

  const displayedClaims = mappedClaims.filter(claim =>
    statusFilter === "All" ? true : claim.status === statusFilter
  );

  // Enhanced Initialization
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoading(prev => ({ ...prev, dashboard: true }));
      await Promise.all([
        fetchEmployees(),
        fetchHRList(),
        fetchPolicies(),
        fetchClaims()
      ]);
      setLoading(prev => ({ ...prev, dashboard: false }));
      // removed addNotification('success', 'Dashboard initialized successfully');
    };

    initializeDashboard();
  }, [fetchEmployees, fetchHRList, fetchPolicies, fetchClaims]);

  // Enhanced Logout with Confirmation
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      addNotification('info', 'Logged out successfully');
      navigate("/hr/login");
    }
  };

  // ---- new helpers: Indian number formatting ----
  const formatINR = (amount) => {
    if (amount == null || isNaN(amount)) return "₹0";
    const abs = Math.abs(amount);
    if (abs >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`;
    if (abs >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`;
    if (abs >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  const formatPercent = (v) => (v == null || isNaN(v) ? "0%" : `${Math.round(v)}%`);

  // Enhanced Home Tab Render with Advanced Features
  const renderEnhancedHomeContent = () => {
    if (loading.dashboard) {
      return (
        <div className="container-fluid">
          <div className="row justify-content-center">
            <div className="col-12 text-center py-5">
              <div className="spinner-border text-primary" style={{width: '3rem', height: '3rem'}}>
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted">Initializing Enterprise Dashboard...</p>
            </div>
          </div>
        </div>
      );
    }

    const highPriorityClaims = mappedClaims.filter(claim => claim.priority === "High");
    const recentActivities = mappedClaims.slice(0, 10).map(claim => ({
      id: claim.id,
      type: 'claim',
      title: `New claim from ${claim.employeeName}`,
      description: `${claim.title} - ₹${claim.amount}`,
      timestamp: claim.claimDate,
      priority: claim.priority
    }));

    return (
      <div className="container-fluid">
        {/* Enhanced Header */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="d-flex justify-content-between align-items-start">
              <div>
                <h2 className="fw-bold mb-2 theme-font-color">Enterprise HR Dashboard</h2>
                <div className="d-flex align-items-center gap-3">
                  <span className="text-muted">
                    <i className="bi bi-building me-1"></i>
                    Corporate Insurance Management Portal
                  </span>
                  <span className="badge theme-badge">
                    <i className="bi bi-shield-check me-1"></i>
                    Enterprise Edition
                  </span>
                </div>
              </div>
              <div className="text-end">
                <div className="bg-light rounded p-3 border">
                  <div className="fw-bold theme-font-color">
                    {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                  </div>
                  <small className="text-muted">
                    Last updated: {new Date().toLocaleTimeString('en-IN')}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enterprise KPI Dashboard */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-white border-0">
                <h5 className="card-title mb-0 theme-font-color">
                  <i className="bi bi-speedometer2 theme-icon-primary me-2"></i>
                  Key Performance Indicators
                </h5>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {/* Total Coverage */}
                  <div className="col-xl-3 col-md-6">
                    <div className="card bg-primary bg-opacity-10 border-0 h-100 card-hover-effect">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="text-primary mb-2">Total Coverage</h6>
                            <h3 className="text-primary mb-1">{formatINR(dashboardStats.totalCoverageAmount)}</h3>
                            <small className="text-muted">Active policies coverage</small>
                          </div>
                          <div className="bg-primary bg-opacity-25 rounded p-2">
                            <i className="bi bi-shield-check text-primary fs-5"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Pending Amount */}
                  <div className="col-xl-3 col-md-6">
                    <div className="card bg-warning bg-opacity-10 border-0 h-100 card-hover-effect">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="text-warning mb-2">Pending Amount</h6>
                            <h3 className="text-warning mb-1">{formatINR(dashboardStats.pendingAmount)}</h3>
                            <small className="text-muted">{dashboardStats.pendingClaims || 0} claims pending</small>
                          </div>
                          <div className="bg-warning bg-opacity-25 rounded p-2">
                            <i className="bi bi-clock-history text-warning fs-5"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fraud Risk */}
                  <div className="col-xl-3 col-md-6">
                    <div className="card bg-danger bg-opacity-10 border-0 h-100 card-hover-effect">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="text-danger mb-2">Fraud Risk</h6>
                            <h3 className="text-danger mb-1">{formatPercent(dashboardStats.fraudRiskScore)}</h3>
                            <small className="text-muted">Risk assessment score</small>
                          </div>
                          <div className="bg-danger bg-opacity-25 rounded p-2">
                            <i className="bi bi-shield-exclamation text-danger fs-5"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Approval Rate */}
                  <div className="col-xl-3 col-md-6">
                    <div className="card bg-success bg-opacity-10 border-0 h-100 card-hover-effect">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start">
                          <div>
                            <h6 className="text-success mb-2">Approval Rate</h6>
                            <h3 className="text-success mb-1">{formatPercent(dashboardStats.approvalRate)}</h3>
                            <small className="text-muted">Claim processing efficiency</small>
                          </div>
                          <div className="bg-success bg-opacity-25 rounded p-2">
                            <i className="bi bi-graph-up-arrow text-success fs-5"></i>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="row mb-4">
          {/* Quick Actions */}
          <div className="col-xl-8">
            <div className="card border-0 shadow-sm h-100 card-hover-effect">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 theme-font-color">
                  <i className="bi bi-lightning-fill theme-icon-warning me-2"></i>
                  Quick Actions
                </h5>
                <span className="badge theme-badge">Most Used</span>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  {[
                    {
                      icon: "bi-list-check",
                      label: "Manage Claims",
                      description: `${dashboardStats.pendingClaims} pending`,
                      color: "primary",
                      tab: "claims",
                      count: dashboardStats.pendingClaims
                    },
                    {
                      icon: "bi-shield-check",
                      label: "Policy Management",
                      description: `${dashboardStats.activePolicies} active`,
                      color: "success",
                      tab: "policies",
                      count: dashboardStats.activePolicies
                    },
                    {
                      icon: "bi-people",
                      label: "Employee Portal",
                      description: `${dashboardStats.activeEmployees} active`,
                      color: "info",
                      tab: "employees",
                      count: dashboardStats.activeEmployees
                    },
                    {
                      icon: "bi-graph-up",
                      label: "Analytics",
                      description: "View reports",
                      color: "warning",
                      tab: "reports"
                    },
                    {
                      icon: "bi-shield-exclamation",
                      label: "Fraud Monitoring",
                      description: "Risk management",
                      color: "danger",
                      tab: "fraud"
                    },
                    {
                      icon: "bi-file-earmark-spreadsheet",
                      label: "Export Data",
                      description: "CSV/PDF reports",
                      color: "secondary",
                      action: downloadCSV
                    }
                  ].map((action, index) => (
                    <div key={index} className="col-xl-4 col-md-6">
                      <button
                        className={`btn btn-outline-${action.color} w-100 h-100 p-3 text-start quick-action-btn`}
                        onClick={() => action.tab ? setActiveTab(action.tab) : action.action?.()}
                      >
                        <div className="d-flex align-items-center">
                          <div className={`bg-${action.color} bg-opacity-10 rounded p-2 me-3`}>
                            <i className={`${action.icon} text-${action.color} fs-5`}></i>
                          </div>
                          <div className="flex-grow-1">
                            <div className="fw-bold text-dark">{action.label}</div>
                            <small className="text-muted">{action.description}</small>
                          </div>
                          {action.count > 0 && (
                            <span className={`badge bg-${action.color} ms-2`}>
                              {action.count}
                            </span>
                          )}
                        </div>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* System Status */}
          <div className="col-xl-4">
            <div className="card border-0 shadow-sm h-100 card-hover-effect">
              <div className="card-header bg-white border-0">
                <h5 className="card-title mb-0 theme-font-color">
                  <i className="bi bi-heart-pulse theme-icon-success me-2"></i>
                  System Status
                </h5>
              </div>
              <div className="card-body">
                <div className="list-group list-group-flush">
                  {[
                    { service: 'Claims API', status: 'operational', icon: 'bi-check-circle' },
                    { service: 'Employee Database', status: 'operational', icon: 'bi-check-circle' },
                    { service: 'Policy Management', status: 'operational', icon: 'bi-check-circle' },
                    { service: 'Document Storage', status: 'operational', icon: 'bi-check-circle' },
                    { service: 'Analytics Engine', status: 'operational', icon: 'bi-check-circle' }
                  ].map((service, index) => (
                    <div key={index} className="list-group-item d-flex justify-content-between align-items-center border-0 px-0">
                      <div>
                        <i className={`${service.icon} theme-icon-success me-2`}></i>
                        {service.service}
                      </div>
                      <span className="badge theme-badge-success">Operational</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 p-3 bg-light rounded">
                  <small className="text-muted">
                    <i className="bi bi-info-circle me-1"></i>
                    All systems running optimally. Last checked: {new Date().toLocaleTimeString('en-IN')}
                  </small>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Claims Overview & Alerts */}
        <div className="row">
          {/* Recent Claims */}
          <div className="col-xl-8 mb-4">
            <div className="card border-0 shadow-sm h-100 card-hover-effect">
              <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                <h5 className="card-title mb-0 theme-font-color">
                  <i className="bi bi-clock-history theme-icon-primary me-2"></i>
                  Recent Claims Activity
                </h5>
                <div>
                  <span className="badge bg-warning me-2">{dashboardStats.pendingClaims} Pending</span>
                  <span className="badge theme-badge">₹{(dashboardStats.pendingAmount/1000).toFixed(0)}K</span>
                </div>
              </div>
              <div className="card-body">
                {mappedClaims.length > 0 ? (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>Employee</th>
                          <th>Claim Type</th>
                          <th>Amount</th>
                          <th>Priority</th>
                          <th>Days</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mappedClaims.slice(0, 5).map((claim) => (
                          <tr key={claim.id}>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-2">
                                  <i className="bi bi-person text-primary"></i>
                                </div>
                                <div>
                                  <div className="fw-bold">{claim.employeeName}</div>
                                  <small className="text-muted">ID: {claim.employeeIdDisplay}</small>
                                </div>
                              </div>
                            </td>
                            <td>
                              <div>{claim.title}</div>
                              <small className="text-muted">{claim.policyName}</small>
                            </td>
                            <td className="fw-bold text-primary">₹{claim.amount}</td>
                            <td>
                              <span className={`badge ${
                                claim.priority === "High" ? "bg-danger" :
                                claim.priority === "Medium" ? "bg-warning" : "bg-info"
                              }`}>
                                {claim.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                claim.daysPending > 7 ? "bg-danger" : 
                                claim.daysPending > 3 ? "bg-warning" : "bg-success"
                              }`}>
                                {claim.daysPending}d
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                claim.status === "Pending" ? "bg-warning" : 
                                claim.status === "Approved" ? "bg-success" : "bg-danger"
                              }`}>
                                {claim.status}
                              </span>
                            </td>
                            <td>
                              <button 
                                className="btn btn-sm btn-outline-primary"
                                onClick={() => { openViewModal(claim); setActiveTab("claims"); }}
                              >
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <i className="bi bi-check-circle display-4 text-success"></i>
                    <p className="text-muted mt-3">No pending claims! All caught up.</p>
                  </div>
                )}
                <div className="text-center mt-3">
                  <button 
                    className="btn theme-btn-primary"
                    onClick={() => setActiveTab("claims")}
                  >
                    <i className="bi bi-arrow-right me-2"></i>View All Claims
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Alerts & Notifications */}
          <div className="col-xl-4 mb-4">
            <div className="card border-0 shadow-sm h-100 card-hover-effect">
              <div className="card-header bg-white border-0">
                <h5 className="card-title mb-0 theme-font-color">
                  <i className="bi bi-bell theme-icon-warning me-2"></i>
                  Priority Alerts
                </h5>
              </div>
              <div className="card-body">
                <div className="alert-list">
                  {dashboardStats.expiringPolicies > 0 && (
                    <div className="alert alert-warning d-flex align-items-start">
                      <i className="bi bi-exclamation-triangle fs-5 me-2 mt-1"></i>
                      <div>
                        <strong>Policy Renewal Required</strong>
                        <br />
                        <small>{dashboardStats.expiringPolicies} policies expiring in next 30 days</small>
                        <div className="mt-1">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => setActiveTab("policies")}>
                            Review Policies
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardStats.highPriorityClaims > 0 && (
                    <div className="alert alert-danger d-flex align-items-start">
                      <i className="bi bi-shield-exclamation fs-5 me-2 mt-1"></i>
                      <div>
                        <strong>High Priority Claims</strong>
                        <br />
                        <small>{dashboardStats.highPriorityClaims} claims require immediate attention</small>
                        <div className="mt-1">
                          <button className="btn btn-sm btn-outline-danger" onClick={() => setActiveTab("claims")}>
                            Review Now
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {dashboardStats.fraudRiskScore > 70 && (
                    <div className="alert alert-dark d-flex align-items-start">
                      <i className="bi bi-activity fs-5 me-2 mt-1"></i>
                      <div>
                        <strong>High Fraud Risk Detected</strong>
                        <br />
                        <small>Risk score: {dashboardStats.fraudRiskScore}% - Review suspicious claims</small>
                        <div className="mt-1">
                          <button className="btn btn-sm btn-outline-dark" onClick={() => setActiveTab("fraud")}>
                            Investigate
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="alert alert-success d-flex align-items-start">
                    <i className="bi bi-check-circle fs-5 me-2 mt-1"></i>
                    <div>
                      <strong>System Operational</strong>
                      <br />
                      <small>All services running normally</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Enhanced Main Render Function
  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return renderEnhancedHomeContent();
      case "claims":
        return (
          <HRClaims
            pendingClaims={pendingClaims}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            displayedClaims={displayedClaims}
            mappedClaims={mappedClaims}
            setMappedClaims={setMappedClaims}
            viewingClaim={viewingClaim}
            openViewModal={openViewModal}
            closeViewModal={closeViewModal}
            approveClaim={approveClaim}
            rejectClaim={rejectClaim}
            downloadCSV={downloadCSV}
            downloadPDF={downloadPDF}
          />
        );
      case "policies":
        return <HRPolicies policies={policies} />;
      case "employees":
        return (
          <HREmployees
            employees={employees}
            searchName={searchName}
            setSearchName={setSearchName}
            policyFilter={policyFilter}
            setPolicyFilter={setPolicyFilter}
            filteredEmployees={filteredEmployees}
            handleView={handleView}
            handleEdit={handleEdit}
            showModal={showModal}
            selectedEmployee={selectedEmployee}
            handleCloseModal={handleCloseModal}
          />
        );
      case "fraud":
        return <HRFraud />;
      case "reports":
        return <ReportsAnalytics mappedClaims={mappedClaims} policies={policies} />;
      case "notifications":
        return <HRNotification currentHrId={loggedInHrId} />;
      default:
        return renderEnhancedHomeContent();
    }
  };

 return (
  <div className="hr-dashboard enterprise-dashboard">
    {/* Enhanced Notification System */}
    <div className="notification-container position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`alert alert-${notification.type} alert-dismissible fade show mb-2 shadow`}
          style={{ minWidth: '300px' }}
        >
          <div className="d-flex align-items-center">
            <i
              className={`bi ${
                notification.type === 'success'
                  ? 'bi-check-circle'
                  : notification.type === 'error'
                  ? 'bi-exclamation-circle'
                  : notification.type === 'warning'
                  ? 'bi-exclamation-triangle'
                  : 'bi-info-circle'
              } me-2`}
            ></i>
            <div className="flex-grow-1">{notification.message}</div>
          </div>
          <button type="button" className="btn-close" onClick={() => removeNotification(notification.id)}></button>
        </div>
      ))}
    </div>

    {/* Enhanced Header */}
    <header className="dashboard-header text-white py-3">
      <div className="container-fluid">
        <div className="row align-items-center">
          <div className="col-md-6 d-flex align-items-center">
            {/* Hamburger button for mobile */}
            <button
              className="btn d-md-none me-3"
              onClick={() =>
                document.querySelector('.dashboard-sidebar').classList.toggle('show')
              }
            >
              <i className="bi bi-list fs-3 text-white"></i>
            </button>

            <div className="brand-logo me-3">
              <i className="bi bi-shield-check fs-2 text-white"></i>
            </div>
            <div>
              <h2 className="mb-0 fw-bold">InsurAI HR Portal</h2>
              <small className="text-light opacity-75">HR Management Portal v2.0</small>
            </div>
          </div>

          <div className="col-md-6 text-end d-flex align-items-center justify-content-end gap-4">
            <div className="text-end">
              <div className="fw-bold">{localStorage.getItem('hrName') || 'HR Administrator'}</div>
              <small className="text-light opacity-75">
                <i className="bi bi-building me-1"></i> Corporate Account
              </small>
            </div>
            <div className="vr bg-light opacity-50" style={{ height: '30px' }}></div>
            <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-2"></i> Logout
            </button>
          </div>
        </div>
      </div>
    </header>

    {/* Enhanced Main Layout */}
    <div className="dashboard-main d-flex">
      {/* Enhanced Sidebar */}
      <aside className="dashboard-sidebar bg-light border-end">
        <nav className="nav flex-column p-3">
          {[
            { id: 'home', icon: 'bi-speedometer2', label: 'Dashboard', badge: null },
            { id: 'claims', icon: 'bi-file-earmark-check', label: 'Claim Approval', badge: dashboardStats.pendingClaims },
            { id: 'policies', icon: 'bi-card-list', label: 'Policy Management', badge: dashboardStats.activePolicies },
            { id: 'employees', icon: 'bi-people', label: 'Employee Portal', badge: dashboardStats.activeEmployees },
            { id: 'fraud', icon: 'bi-shield-exclamation', label: 'Fraud Monitoring', badge: dashboardStats.fraudRiskScore > 70 ? '!' : null },
            { id: 'reports', icon: 'bi-graph-up', label: 'Analytics', badge: null },
            { id: 'notifications', icon: 'bi-bell', label: 'Notifications', badge: notifications.filter((n) => !n.read).length },
          ].map((item) => (
            <a
              key={item.id}
              href="#"
              className={`nav-link sidebar-link ${activeTab === item.id ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                setActiveTab(item.id);
                // Auto-close sidebar on mobile
                document.querySelector('.dashboard-sidebar').classList.remove('show');
              }}
            >
              <i className={`${item.icon} me-3`}></i>
              {item.label}
              {item.badge !== null && item.badge > 0 && <span className="badge theme-badge-danger ms-auto">{item.badge}</span>}
              {item.badge === '!' && <span className="badge theme-badge-warning ms-auto">!</span>}
            </a>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer p-3 border-top">
          <div className="d-flex align-items-center mb-2">
            <div className="bg-success rounded-circle p-1 me-2">
              <i className="bi bi-circle-fill text-success" style={{ fontSize: '8px' }}></i>
            </div>
            <small className="text-muted">System Online</small>
          </div>
          <small className="text-muted d-block mt-1">v2.0.1 • Enterprise Edition</small>
        </div>
      </aside>

      {/* Enhanced Content Area */}
      <main className="dashboard-content flex-grow-1 bg-light">
        <div className="dashboard-content-wrapper p-4">{renderContent()}</div>
      </main>
    </div>

      {/* Enhanced Global Styles */}
      <style>{`
        .enterprise-dashboard {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        .dashboard-header {
          background: linear-gradient(135deg, #1e3a5f 100%);
          border-bottom: 1px solid #46627f;
        }
        
        /* Theme Colors */
        .theme-font-color {
          color: #1e3a5f !important;
        }
        
        .theme-badge {
          background-color: #16043fff !important;
          color: white !important;
        }
        
        .theme-badge-success {
          background-color: #198754 !important;
          color: white !important;
        }
        
        .theme-badge-warning {
          background-color: #ffc107 !important;
          color: black !important;
        }
        
        .theme-badge-danger {
          background-color: #dc3545 !important;
          color: white !important;
        }
        
        .theme-btn-primary {
          background: linear-gradient(135deg, 100%);
          border-color: #16043fff;
          color: white !important;
        }
        
        .theme-btn-primary:hover {
          background: linear-gradient(135deg, #0d569eff 0%, #16043fff 100%);
          border-color: #0d569eff;
          color: white !important;
        }
        
        /* Different Icon Colors */
        .theme-icon-primary {
          color: #16043fff !important;
        }
        
        .theme-icon-warning {
          color: #ffc107 !important;
        }
        
        .theme-icon-success {
          color: #198754 !important;
        }
        
        .theme-icon-danger {
          color: #dc3545 !important;
        }
        
        .theme-icon-info {
          color: #0dcaf0 !important;
        }
        
        /* Card Hover Effects */
        .card-hover-effect {
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }
        
        .card-hover-effect:hover {
          transform: translateY(-5px);
          box-shadow: 0 12px 35px rgba(22, 4, 63, 0.15) !important;
          border-color: rgba(22, 4, 63, 0.1);
        }
        
        .sidebar-link {
          border-radius: 8px;
          margin-bottom: 5px;
          transition: all 0.3s ease;
          color: #495057;
          padding: 12px 15px;
        }
        
        .sidebar-link:hover {
          background-color: #e9ecef;
          color: #16043fff;
          transform: translateX(5px);
        }
        
        .sidebar-link.active {
          background: linear-gradient(135deg, #16043fff 0%, #0d569eff 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 2px 10px rgba(22, 4, 63, 0.3);
        }
        
        .quick-action-btn {
          transition: all 0.3s ease;
          border: 1px solid #dee2e6;
          border-radius: 10px;
        }
        
        .quick-action-btn:hover {
          transform: translateY(-3px);
          box-shadow: 0 5px 20px rgba(0,0,0,0.15);
        }
        
        .card {
          border-radius: 12px;
          transition: all 0.3s ease;
        }
        
        .notification-container {
          max-width: 400px;
        }
        
        .bg-gradient-primary {
          background: linear-gradient(135deg, #16043fff 0%, #0d569eff 100%);
        }
        
        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed;
            top: 0;
            left: -280px;
            height: 100vh;
            z-index: 1000;
            transition: left 0.3s ease;
          }
          
          @media (max-width: 768px) {
        .dashboard-sidebar {
          position: fixed;
          top: 0;
          left: -280px;
          width: 280px;
          height: 100vh;
          z-index: 1050;
          transition: left 0.3s ease;
        }
        .dashboard-sidebar.show {
          left: 0;
        }
      }
          .dashboard-sidebar.show {
            left: 0;
          }
        }
      `}</style>
    </div>
  );
}