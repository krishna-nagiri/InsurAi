import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import EmployeeClaims from './EmployeeClaims';
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import jsPDF from "jspdf";
import EmployeeSupport from './EmployeeSupport';
import EmployeeQueries from "./EmployeeQueries"; 
import EmployeeNotification from "./EmployeeNotification"; 
import Chatbot from './Chatbot';
import EmployeePolicies from "./EmployeePolicies";

export default function EmployeeDashboard() {
  const navigate = useNavigate();
  const [employeeName, setEmployeeName] = useState("");
  const [activeTab, setActiveTab] = useState("home");
  const [policies, setPolicies] = useState([]);
  const [claims, setClaims] = useState([]);
  const [queries, setQueries] = useState([]);
  const [agentsAvailability, setAgentsAvailability] = useState([]);
  const [selectedAgentId, setSelectedAgentId] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const [loading, setLoading] = useState({
    dashboard: false,
    policies: false,
    claims: false,
    queries: false
  });
  const [employeeId, setEmployeeId] = useState(null);

  const [newClaim, setNewClaim] = useState({
    type: "",
    amount: "",
    description: "",
    date: new Date().toISOString().split("T")[0],
    documents: []
  });

  const [newQuery, setNewQuery] = useState({ queryText: "" });
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedPolicyId, setSelectedPolicyId] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  // Enhanced theme and data states
  const [theme, setTheme] = useState("corporate");
  const [dashboardStats, setDashboardStats] = useState({
    activePolicies: 0,
    totalCoverage: 0,
    pendingClaims: 0,
    totalQueries: 0,
    resolvedQueries: 0,
    upcomingRenewals: 0,
    approvalRate: 0,
    efficiencyScore: 85,
    monthlyPremium: 0,
    totalClaimsAmount: 0,
    avgClaimAmount: 0,
    riskScore: 12
  });

  // Enhanced claim types with categories and icons
  const [claimTypes, setClaimTypes] = useState([
    { id: 1, name: "Health", category: "Medical", icon: "bi-heart-pulse", color: "danger" },
    { id: 2, name: "Accident", category: "Medical", icon: "bi-bandaid", color: "warning" },
    { id: 3, name: "Travel", category: "General", icon: "bi-airplane", color: "info" },
    { id: 4, name: "Dental", category: "Medical", icon: "bi-tooth", color: "primary" },
    { id: 5, name: "Vision", category: "Medical", icon: "bi-eye", color: "success" },
    { id: 6, name: "Life", category: "Life", icon: "bi-person-check", color: "dark" },
  ]);

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ------------------ KEEPING ORIGINAL LOGIN & REDIRECT CODE AS IS ------------------
  useEffect(() => {
    const token = localStorage.getItem("token"); 
    const storedName = localStorage.getItem("name");

    if (!token || token.trim() === "") {
      console.log("Missing token, redirecting to login");
      navigate("/employee/login");
      return;
    }

    setEmployeeName(storedName || "Employee");
    fetchEmployeeData(token);
    fetchAgents(token);
    fetchEmployeeQueries(token);
    fetchEmployeeClaims(token);

    const interval = setInterval(() => fetchEmployeeQueries(token), 15000);
    return () => clearInterval(interval);
  }, [navigate]);

  // Enhanced data processing with more metrics
  useEffect(() => {
    const activePolicies = policies.filter(p => p.status === "Active").length;
    const totalCoverage = policies.reduce((sum, p) => sum + Number(p.coverageAmount || 0), 0);
    const pendingClaims = claims.filter(c => c.status === "Pending" || c.status === "In Review").length;
    const totalQueries = queries.length;
    const resolvedQueries = queries.filter(q => q.response && q.response.trim() !== "").length;
    
    const upcomingRenewals = policies.filter(p => {
      if (!p.renewalDate) return false;
      const days = Math.ceil((new Date(p.renewalDate) - new Date()) / (1000*60*60*24));
      return days > 0 && days <= 30;
    }).length;

    const approvedClaims = claims.filter(c => c.status === "Approved").length;
    const approvalRate = claims.length > 0 ? Math.round((approvedClaims / claims.length) * 100) : 0;

    const monthlyPremium = policies.reduce((sum, p) => sum + Number(p.monthlyPremium || 0), 0);
    const totalClaimsAmount = claims.reduce((sum, claim) => {
      const amount = parseFloat(String(claim.amount).replace(/[^0-9.-]+/g, "")) || 0;
      return sum + amount;
    }, 0);
    const avgClaimAmount = claims.length > 0 ? totalClaimsAmount / claims.length : 0;

    // Calculate risk score based on various factors
    const highValuePolicies = policies.filter(p => Number(p.coverageAmount || 0) > 500000).length;
    const pendingRatio = claims.length > 0 ? pendingClaims / claims.length : 0;
    const riskScore = Math.min(100, Math.round((highValuePolicies * 20) + (pendingRatio * 80)));

    setDashboardStats({
      activePolicies,
      totalCoverage,
      pendingClaims,
      totalQueries,
      resolvedQueries,
      upcomingRenewals,
      approvalRate,
      monthlyPremium,
      totalClaimsAmount,
      avgClaimAmount,
      riskScore,
      efficiencyScore: calculateEfficiencyScore(claims, queries)
    });
  }, [policies, claims, queries]);

  const calculateEfficiencyScore = (claims, queries) => {
    const claimResolutionRate = claims.length > 0 ? 
      claims.filter(c => c.status === "Approved" || c.status === "Rejected").length / claims.length : 1;
    const queryResolutionRate = queries.length > 0 ? 
      queries.filter(q => q.response && q.response.trim() !== "").length / queries.length : 1;
    
    return Math.round((claimResolutionRate * 0.6 + queryResolutionRate * 0.4) * 100);
  };

  const parseDate = (dateString) => {
  if (!dateString) return new Date(); // fallback to now
  // Replace space with T for ISO, remove microseconds
  return new Date(dateString.replace(' ', 'T').replace(/\.\d+/, ''));
};

  // Enhanced notification system that closes when tab changes
  const showNotificationAlert = useCallback((msg) => {
    setNotificationMessage(msg);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 4000);
  }, []);

  // Enhanced tab change handler that closes notifications
  const handleTabChange = useCallback((tab) => {
    setShowNotification(false); // Close notification when tab changes
    setActiveTab(tab);
  }, []);

  // ------------------ KEEPING ORIGINAL URL FORMATTING ------------------
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

  // ------------------ KEEPING ORIGINAL EMPLOYEE FETCH ------------------
  const fetchLoggedInEmployee = async (token) => {
    try {
      const response = await axios.get("http://localhost:8077/auth/employees", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const storedEmail = localStorage.getItem("email");
      const employee = response.data.find(emp => emp.email === storedEmail);

      if (!employee) {
        console.error("Employee not found");
        navigate("/employee/login");
        return;
      }

      setEmployeeId(employee.employeeId);       
      setEmployeeName(employee.name || "Employee");
      localStorage.setItem("employeeId", employee.employeeId);
      localStorage.setItem("name", employee.name || "Employee");

    } catch (error) {
      console.error("Error fetching employee:", error);
      navigate("/employee/login");
    }
  };

  // ------------------ Enhanced policies fetch ------------------
  const fetchEmployeeData = async (token) => {
    setLoading(prev => ({ ...prev, policies: true }));
    try {
      const response = await axios.get("http://localhost:8077/employee/policies", {
        headers: { Authorization: `Bearer ${token}` }
      });

      const formattedPolicies = response.data.map((policy) => ({
        id: policy.id,
        name: policy.policyName,
        provider: policy.providerName,
        coverageAmount: policy.coverageAmount,
        formattedCoverage: `₹${policy.coverageAmount?.toLocaleString('en-IN')}`,
        monthlyPremium: policy.monthlyPremium || 0,
        renewalDate: policy.renewalDate,
        status: policy.policyStatus,
        benefits: policy.policyDescription ? [policy.policyDescription] : [],
        contractUrl: formatPublicUrl(policy.contractUrl),
        termsUrl: formatPublicUrl(policy.termsUrl),
        claimFormUrl: formatPublicUrl(policy.claimFormUrl),
        annexureUrl: formatPublicUrl(policy.annexureUrl),
        remainingCoverageAmount: Number(policy.coverageAmount),
        policyType: policy.policyType || "General"
      }));

      setPolicies(formattedPolicies);
    } catch (error) {
      console.error("Error fetching employee data:", error);
      if (error.response?.status === 403) navigate("/employee/login");
    } finally {
      setLoading(prev => ({ ...prev, policies: false }));
    }
  };

  // Enhanced claims fetch
  const fetchEmployeeClaims = async (token) => {
    setLoading(prev => ({ ...prev, claims: true }));
    try {
      const response = await axios.get("http://localhost:8077/employee/claims", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setClaims(response.data);
    } catch (error) {
      console.error("Error fetching claims:", error);
    } finally {
      setLoading(prev => ({ ...prev, claims: false }));
    }
  };

  // ------------------ KEEPING ORIGINAL AGENTS FETCH ------------------
  const fetchAgents = async (token) => {
    try {
      const response = await axios.get("http://localhost:8077/agent/availability/all", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgentsAvailability(response.data);
    } catch (error) {
      console.error("Error fetching agents:", error);
    }
  };

  // ------------------ KEEPING ORIGINAL QUERIES FETCH ------------------
  const fetchEmployeeQueries = async (token) => {
    setLoading(prev => ({ ...prev, queries: true }));
    try {
      const response = await axios.get("http://localhost:8077/employee/queries", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setQueries(response.data);
    } catch (error) {
      console.error("Error fetching employee queries:", error);
      if (error.response?.status === 403) navigate("/employee/login");
    } finally {
      setLoading(prev => ({ ...prev, queries: false }));
    }
  };

  // ------------------ KEEPING ORIGINAL LOGOUT ------------------
  const handleLogout = () => {
    localStorage.clear();
    navigate("/employee/login");
  };

  // ------------------ Enhanced claim submission ------------------
  const handleClaimSubmit = (e) => {
    e.preventDefault();

    const claimAmount = Number(newClaim.amount);

    if (!newClaim.type || !claimAmount || !newClaim.description || !selectedPolicyId) {
      showNotificationAlert("Please fill all required claim fields.");
      return;
    }

    const selectedPolicy = policies.find(p => Number(p.id) === Number(selectedPolicyId));
    if (!selectedPolicy) {
      showNotificationAlert("Please select a valid policy.");
      return;
    }

    const approvedClaims = claims.filter(
      claim => Number(claim.policyId) === selectedPolicy.id && claim.status === "Approved"
    );
    const totalClaimed = approvedClaims.reduce((sum, claim) => sum + (Number(claim.amount) || 0), 0);
    const remainingCoverage = (selectedPolicy.coverageAmount || 0) - totalClaimed;

    if (claimAmount > remainingCoverage) {
      showNotificationAlert(
        `Claim amount exceeds remaining coverage (₹${remainingCoverage.toLocaleString("en-IN")})!`
      );
      return;
    }

    const updatedPolicies = policies.map(policy => {
      if (policy.id === selectedPolicy.id) {
        return {
          ...policy,
          remainingCoverageAmount: remainingCoverage - claimAmount
        };
      }
      return policy;
    });
    setPolicies(updatedPolicies);

    const newClaimData = {
      id: Math.floor(Math.random() * 100000),
      type: newClaim.type,
      amount: claimAmount,
      formattedAmount: `₹${claimAmount.toLocaleString("en-IN")}`,
      submittedDate: new Date().toISOString().split("T")[0],
      status: "In Review",
      processedDate: null,
      description: newClaim.description,
      policyId: selectedPolicy.id,
      policyName: selectedPolicy.name,
      documents: newClaim.documents || []
    };

    setClaims([...claims, newClaimData]);
    showNotificationAlert("Claim submitted successfully! It will be processed shortly.");

    setNewClaim({
      type: "",
      amount: "",
      description: "",
      date: new Date().toISOString().split("T")[0],
      documents: [],
      policyId: ""
    });
    setSelectedPolicyId("");
    handleTabChange("claims");
  };

  // ------------------ KEEPING ORIGINAL QUERY SUBMIT ------------------
  const handleQuerySubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    if (!token || token.trim() === "") {
      navigate("/employee/login");
      return;
    }

    if (!selectedAgentId) {
      showNotificationAlert("Please select an agent to assign the query.");
      return;
    }

    const selectedAgent = agentsAvailability.find(
      a => a.agent.id.toString() === selectedAgentId.toString()
    );
    if (!selectedAgent || !selectedAgent.available) {
      showNotificationAlert("Selected agent is not available. Please choose another agent.");
      return;
    }

    if (!newQuery.queryText || newQuery.queryText.trim() === "") {
      showNotificationAlert("Query text cannot be empty.");
      return;
    }

    if (!newQuery.policyId) {
      showNotificationAlert("Please select a policy.");
      return;
    }

    if (!newQuery.claimType || newQuery.claimType.trim() === "") {
      showNotificationAlert("Please select a claim type.");
      return;
    }

    const selectedPolicy = policies.find(
      p => p.id.toString() === newQuery.policyId.toString()
    );
    const policyName = selectedPolicy?.name || "";

    setLoading(prev => ({ ...prev, queries: true }));

    try {
      const response = await axios.post(
        `http://localhost:8077/employee/queries?agentId=${selectedAgentId}&queryText=${encodeURIComponent(newQuery.queryText)}&policyName=${encodeURIComponent(policyName)}&claimType=${encodeURIComponent(newQuery.claimType)}`,
        null,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const savedQuery = response.data;
      setQueries([savedQuery, ...queries]);
      showNotificationAlert("Query submitted successfully! An agent will respond shortly.");

      setNewQuery({ queryText: "", policyId: "", claimType: "" });
      setSelectedAgentId("");
      handleTabChange("myQueries");
    } catch (error) {
      console.error("Error submitting query:", error);
      const msg = error.response?.data || "Failed to submit query. Check console for details.";
      showNotificationAlert(msg);
    } finally {
      setLoading(prev => ({ ...prev, queries: false }));
    }
  };

  const handleDocumentUpload = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      setNewClaim({
        ...newClaim,
        documents: [...newClaim.documents, ...Array.from(files)]
      });
    }
  };

  const handleQueryInputChange = (field, value) => {
    setNewQuery({ ...newQuery, [field]: value });
  };

  // ------------------ Enhanced PDF download ------------------
  const downloadPolicy = (policy) => {
    const doc = new jsPDF();

    // Enhanced header with branding
    doc.setFillColor(27, 38, 44);
    doc.rect(0, 0, 210, 30, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("INSURAI ENTERPRISE", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Policy Document", 105, 22, { align: 'center' });

    // Policy details
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(16);
    doc.text(policy.name, 20, 45);

    doc.setFontSize(12);
    let yPosition = 60;
    
    const details = [
      `Provider: ${policy.provider}`,
      `Coverage: ${policy.formattedCoverage}`,
      `Monthly Premium: ₹${policy.monthlyPremium?.toLocaleString('en-IN')}`,
      `Renewal Date: ${policy.renewalDate}`,
      `Status: ${policy.status}`,
      `Policy Type: ${policy.policyType || 'General'}`
    ];

    details.forEach(detail => {
      doc.text(detail, 20, yPosition);
      yPosition += 8;
    });

    // Benefits section
    yPosition += 10;
    doc.setFontSize(14);
    doc.text("Covered Benefits:", 20, yPosition);
    yPosition += 10;
    doc.setFontSize(10);
    
    policy.benefits.forEach((benefit, index) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }
      doc.text(`• ${benefit}`, 25, yPosition);
      yPosition += 6;
    });

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 285);
    doc.text("InsurAI Enterprise - Confidential Document", 105, 285, { align: 'center' });

    doc.save(`${policy.name.replace(/\s+/g, '_')}_Policy.pdf`);
  };

  const viewPolicyDetails = (policy) => {
    setSelectedPolicy(policy);
  };

  // Enhanced navigation items with badges
  const navigationItems = [
    { tab: "home", label: "Dashboard", icon: "bi-speedometer2", badge: null },
    { tab: "policies", label: "My Policies", icon: "bi-file-text", badge: dashboardStats.activePolicies },
    { tab: "claims", label: "My Claims", icon: "bi-wallet2", badge: dashboardStats.pendingClaims },
    { tab: "newClaim", label: "Submit Claim", icon: "bi-plus-circle", badge: null },
    { tab: "askQuery", label: "Ask a Question", icon: "bi-question-circle", badge: null },
    { tab: "myQueries", label: "My Queries", icon: "bi-chat-left-text", badge: dashboardStats.totalQueries },
    { tab: "notifications", label: "Notifications", icon: "bi-bell", badge: null },
    { tab: "support", label: "Support", icon: "bi-headset", badge: null },
  ];

  // ------------------ Enhanced Home Dashboard with Advanced UI ------------------
  const renderEnhancedHomeDashboard = () => (
    <div className="container-fluid">
      {/* Enhanced Header Section */}
      <div className="row mb-4">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-start">
            <div>
              <h2 className="fw-bold text-gradient mb-2">Employee Dashboard</h2>
              <div className="d-flex align-items-center gap-3">
                <span className="text-muted">
                  <i className="bi bi-person-badge me-1"></i>
                  Welcome back, {employeeName}
                </span>
                <span className="badge bg-primary">
                  <i className="bi bi-shield-check me-1"></i>
                  Enterprise Portal
                </span>
              </div>
            </div>
            <div className="text-end">
              <div className="bg-light rounded p-3 border shadow-sm">
                <div className="fw-bold text-primary">
                  {currentTime.toLocaleDateString('en-IN', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </div>
                <div className="text-muted">
                  <i className="bi bi-clock me-1"></i>
                  {currentTime.toLocaleTimeString('en-IN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true 
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Statistics Cards with Advanced Metrics */}
      <div className="row mb-4">
        <div className="col-xl-2 col-md-4 col-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card bg-primary bg-opacity-10">
            <div className="card-body text-center">
              <div className="bg-primary bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-shield-check text-primary fs-4"></i>
              </div>
              <h3 className="text-primary mb-1">{dashboardStats.activePolicies}</h3>
              <div className="text-muted mb-2">Active Policies</div>
              <small className="text-primary">
                <i className="bi bi-currency-rupee me-1"></i>
                ₹{(dashboardStats.totalCoverage / 100000).toFixed(1)}L coverage
              </small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card bg-warning bg-opacity-10">
            <div className="card-body text-center">
              <div className="bg-warning bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-clock-history text-warning fs-4"></i>
              </div>
              <h3 className="text-warning mb-1">{dashboardStats.pendingClaims}</h3>
              <div className="text-muted mb-2">Pending Claims</div>
              <small className="text-warning">
                <i className="bi bi-graph-up me-1"></i>
                {dashboardStats.approvalRate}% approval rate
              </small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card bg-success bg-opacity-10">
            <div className="card-body text-center">
              <div className="bg-success bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-chat-left-text text-success fs-4"></i>
              </div>
              <h3 className="text-success mb-1">{dashboardStats.totalQueries}</h3>
              <div className="text-muted mb-2">Total Queries</div>
              <small className="text-success">
                <i className="bi bi-check-circle me-1"></i>
                {dashboardStats.resolvedQueries} resolved
              </small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card bg-info bg-opacity-10">
            <div className="card-body text-center">
              <div className="bg-info bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-calendar-event text-info fs-4"></i>
              </div>
              <h3 className="text-info mb-1">{dashboardStats.upcomingRenewals}</h3>
              <div className="text-muted mb-2">Renewals Due</div>
              <small className="text-info">
                <i className="bi bi-clock me-1"></i>
                Next 30 days
              </small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card bg-danger bg-opacity-10">
            <div className="card-body text-center">
              <div className="bg-danger bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-activity text-danger fs-4"></i>
              </div>
              <h3 className="text-danger mb-1">{dashboardStats.riskScore}%</h3>
              <div className="text-muted mb-2">Risk Score</div>
              <small className="text-danger">
                <i className="bi bi-shield-exclamation me-1"></i>
                Low risk profile
              </small>
            </div>
          </div>
        </div>

        <div className="col-xl-2 col-md-4 col-6 mb-4">
          <div className="card border-0 shadow-sm h-100 dashboard-card bg-secondary bg-opacity-10">
            <div className="card-body text-center">
              <div className="bg-secondary bg-opacity-25 rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{width: '60px', height: '60px'}}>
                <i className="bi bi-graph-up-arrow text-secondary fs-4"></i>
              </div>
              <h3 className="text-secondary mb-1">{dashboardStats.efficiencyScore}%</h3>
              <div className="text-muted mb-2">Efficiency</div>
              <small className="text-secondary">
                <i className="bi bi-lightning me-1"></i>
                High performance
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Financial Overview Row */}
      <div className="row mb-4">
        <div className="col-xl-4 col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="card-title mb-0">
                <i className="bi bi-currency-rupee text-success me-2"></i>
                Financial Summary
              </h6>
            </div>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Monthly Premium</span>
                <strong className="text-success">₹{dashboardStats.monthlyPremium.toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Total Claims</span>
                <strong className="text-warning">₹{dashboardStats.totalClaimsAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <span>Avg Claim</span>
                <strong className="text-info">₹{dashboardStats.avgClaimAmount.toLocaleString('en-IN')}</strong>
              </div>
              <div className="d-flex justify-content-between align-items-center">
                <span>Coverage Used</span>
                <strong className="text-primary">
                  {dashboardStats.totalCoverage > 0 ? 
                    Math.round((dashboardStats.totalClaimsAmount / dashboardStats.totalCoverage) * 100) : 0}%
                </strong>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="card-title mb-0">
                <i className="bi bi-speedometer2 text-primary me-2"></i>
                Performance Metrics
              </h6>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Claim Approval Rate</span>
                  <strong>{dashboardStats.approvalRate}%</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div className="progress-bar bg-primary" style={{width: `${dashboardStats.approvalRate}%`}}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Query Resolution</span>
                  <strong>
                    {dashboardStats.totalQueries > 0 ? 
                      Math.round((dashboardStats.resolvedQueries / dashboardStats.totalQueries) * 100) : 0}%
                  </strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div className="progress-bar bg-info" style={{width: `${dashboardStats.totalQueries > 0 ? Math.round((dashboardStats.resolvedQueries / dashboardStats.totalQueries) * 100) : 0}%`}}></div>
                </div>
              </div>
              <div className="mb-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>System Efficiency</span>
                  <strong>{dashboardStats.efficiencyScore}%</strong>
                </div>
                <div className="progress" style={{height: '8px'}}>
                  <div className="progress-bar bg-warning" style={{width: `${dashboardStats.efficiencyScore}%`}}></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="col-xl-4 col-md-6 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="card-title mb-0">
                <i className="bi bi-lightning-fill text-warning me-2"></i>
                Quick Actions
              </h6>
            </div>
            <div className="card-body">
              <div className="row g-2">
                {[
                  { label: "Submit Claim", icon: "bi-plus-circle", color: "primary", tab: "newClaim" },
                  { label: "Ask Question", icon: "bi-question-circle", color: "info", tab: "askQuery" },
                  { label: "View Policies", icon: "bi-file-text", color: "success", tab: "policies" },
                  { label: "Check Claims", icon: "bi-wallet2", color: "warning", tab: "claims" },
                ].map((action, index) => (
                  <div key={index} className="col-6">
                    <button 
                      className={`btn btn-outline-${action.color} w-100 text-start p-2`}
                      onClick={() => handleTabChange(action.tab)}
                    >
                      <i className={`${action.icon} me-2`}></i>
                      {action.label}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity & System Status */}
      <div className="row">
        <div className="col-xl-8 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
              <h6 className="card-title mb-0">
                <i className="bi bi-clock-history text-primary me-2"></i>
                Recent Activity
              </h6>
              <span className="badge bg-primary">Live</span>
            </div>
            <div className="card-body">
              {[...claims, ...queries]
                .sort((a, b) => parseDate(b.submittedDate || b.created_at) - parseDate(a.submittedDate || a.created_at))
                .slice(0, 5)
                .map((item, index) => {
                  const itemDate = parseDate(item.submittedDate || item.created_at);
                  return (
                    <div key={index} className="d-flex align-items-center mb-3 pb-3 border-bottom">
                      <div className={`bg-${item.status === 'Approved' ? 'success' : item.status === 'Pending' ? 'warning' : 'info'} bg-opacity-10 rounded-circle p-2 me-3`}>
                        <i className={`bi bi-${item.amount ? 'wallet2' : 'chat-dots'} text-${item.status === 'Approved' ? 'success' : item.status === 'Pending' ? 'warning' : 'info'}`}></i>
                      </div>
                      <div className="flex-grow-1">
                        <div className="fw-bold">{item.amount ? 'Claim Submitted' : 'Query Asked'}</div>
                        <small className="text-muted">
                          {item.amount
                            ? `₹${Number(item.amount || 0).toLocaleString('en-IN')}`
                            : item.queryText?.substring(0, 50) + (item.queryText?.length > 50 ? '...' : '')}
                        </small>
                      </div>
                      <div className="text-end">
                        <small className="text-muted">{itemDate.toLocaleDateString('en-IN')}</small>
                        <div>
                          <span className={`badge bg-${item.status === 'Approved' ? 'success' : item.status === 'Pending' ? 'warning' : 'info'}`}>
                            {item.status || 'Open'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>

        <div className="col-xl-4 mb-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0">
              <h6 className="card-title mb-0">
                <i className="bi bi-heart-pulse text-success me-2"></i>
                System Status
              </h6>
            </div>
            <div className="card-body">
              {[
                { service: 'Policy Management', status: 'Operational', icon: 'bi-check-circle' },
                { service: 'Claims Processing', status: 'Operational', icon: 'bi-check-circle' },
                { service: 'Query System', status: 'Operational', icon: 'bi-check-circle' },
                { service: 'Document Storage', status: 'Operational', icon: 'bi-check-circle' },
                { service: 'Agent Support', status: `${agentsAvailability.filter(a => a.available).length} Online`, icon: 'bi-check-circle' },
              ].map((service, index) => (
                <div key={index} className="d-flex justify-content-between align-items-center mb-2 pb-2 border-bottom">
                  <div>
                    <i className={`${service.icon} text-success me-2`}></i>
                    {service.service}
                  </div>
                  <span className="badge bg-success">{service.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

return (
    <div className="employee-dashboard enterprise-dashboard">
      {/* Notification Alert */}
      {showNotification && (
        <div
          className="alert alert-success alert-dismissible fade show m-3 position-fixed top-0 end-0"
          style={{ zIndex: 9999, minWidth: '350px' }}
          role="alert"
        >
          <div className="d-flex align-items-center">
            <i className="bi bi-check-circle me-2 fs-5"></i>
            <div className="flex-grow-1">
              <strong>{notificationMessage}</strong>
            </div>
            <button type="button" className="btn-close" onClick={() => setShowNotification(false)}></button>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="dashboard-header text-white py-3 px-4 shadow-lg w-100" >
        <div className="container-fluid">
          <div className="row align-items-center">
            <div className="col-md-6 d-flex align-items-center">
              <div className="brand-logo me-3">
                <i className="bi bi-shield-check fs-2 text-white"></i>
              </div>
              <div>
                <h2 className="mb-0 fw-bold">InsurAI Employee Portal</h2>
                <small className="text-light opacity-75">Employee Insurance Suite v2.0</small>
              </div>
            </div>
            <div className="col-md-6 d-flex justify-content-end align-items-center">
              <div className="d-flex align-items-center gap-4">
                <div className="text-end">
                  <div className="fw-bold">{employeeName}</div>
                  <small className="text-light opacity-75">
                    <i className="bi bi-person-circle me-1"></i> Welcome
                  </small>
                </div>
                <div className="vr bg-light opacity-50" style={{height: '30px'}}></div>
                <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
                  <i className="bi bi-box-arrow-right me-2"></i> Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <div className="dashboard-main d-flex">
        {/* Sidebar */}
        <aside className={`dashboard-sidebar shadow-sm ${isMobileMenuOpen ? 'show' : ''}`}>
          <nav className="nav flex-column p-3">
            {navigationItems.map((link) => (
              <a
                href="#"
                key={link.tab}
                className={`nav-link sidebar-link mb-2 ${activeTab === link.tab ? 'active' : ''}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleTabChange(link.tab);
                  if (link.tab === "notifications") {
                    setShowNotification(false);
                    setNotificationMessage("");
                  }
                }}
              >
                <i className={`${link.icon} me-3`}></i>
                <span>{link.label}</span>
                {link.badge > 0 && <span className="badge bg-danger ms-auto">{link.badge}</span>}
              </a>
            ))}
          </nav>

          {/* Sidebar Footer */}
          <div className="sidebar-footer mt-auto p-3 small text-muted border-top">
            <div className="d-flex align-items-center mb-2">
              <div className="bg-success rounded-circle p-1 me-2">
                <i className="bi bi-circle-fill text-success" style={{fontSize: '8px'}}></i>
              </div>
              <span>System Online</span>
            </div>
            <div>v2.0.1 • Employee Suite</div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="dashboard-content flex-grow-1 bg-light">
          <div className="dashboard-content-wrapper p-4">
            {activeTab === "home" && renderEnhancedHomeDashboard()}
            {activeTab === "policies" && (
              <EmployeePolicies
                employeeId={employeeId}
                downloadPolicy={downloadPolicy}
                policies={policies}
                selectedPolicy={selectedPolicy}
                setSelectedPolicy={setSelectedPolicy}
              />
            )}
            {(activeTab === "claims" || activeTab === "newClaim") && (
              <EmployeeClaims
                policies={policies}
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                claims={claims}
                newClaim={newClaim}
                setNewClaim={setNewClaim}
                handleClaimSubmit={handleClaimSubmit}
                handleDocumentUpload={handleDocumentUpload}
                showNotificationAlert={showNotificationAlert}
                employeeId={employeeId}
                token={localStorage.getItem("token")}
                selectedPolicyId={selectedPolicyId}
                setSelectedPolicyId={setSelectedPolicyId}
              />
            )}
            {(activeTab === "askQuery" || activeTab === "myQueries" || activeTab === "queryDetails") && (
              <EmployeeQueries
                activeTab={activeTab}
                queries={queries}
                setActiveTab={handleTabChange}
                agentsAvailability={agentsAvailability}
                selectedAgentId={selectedAgentId}
                setSelectedAgentId={setSelectedAgentId}
                handleQuerySubmit={handleQuerySubmit}
                handleQueryInputChange={handleQueryInputChange}
                newQuery={newQuery}
                loading={loading.queries}
                policies={policies}
                claimTypes={claimTypes}
              />
            )}
            {activeTab === "notifications" && (
              <EmployeeNotification
                userDbId={Number(localStorage.getItem("id"))}
                token={localStorage.getItem("token") || ""}
              />
            )}
            {activeTab === "support" && (
              <EmployeeSupport
                agentsAvailability={agentsAvailability}
                selectedAgentId={selectedAgentId}
                setSelectedAgentId={setSelectedAgentId}
                showNotificationAlert={showNotificationAlert}
              />
            )}
          </div>
        </main>
      </div>

      {/* Chatbot */}
      <Chatbot employeeData={{ name: employeeName, claims, policies, queries }} />

      {/* Global Styles */}
      <style>{`
        .enterprise-dashboard {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }

        /* Header Gradient */
        .employee-dashboard .dashboard-header {
          background: linear-gradient(135deg, #1b262c 0%, #206c95ff 100%);
        }

        /* Sidebar */
        .dashboard-sidebar {
          width: 250px;
          min-height: 100vh;
          background: #f8f9fa;
          transition: all 0.3s ease;
        }

        .sidebar-link {
          border-radius: 8px;
          margin-bottom: 5px;
          padding: 12px 15px;
          display: flex;
          align-items: center;
          color: #495057;
          transition: all 0.3s ease;
        }

        .sidebar-link:hover {
          background-color: #ffffff;
          color: #0d6efd;
          transform: translateX(5px);
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }

        .sidebar-link.active {
          background: linear-gradient(135deg, #1b262c  0%, #206c95ff 100%);
          color: white;
          font-weight: 600;
          box-shadow: 0 4px 15px rgba(0,123,255,0.3);
        }

        .sidebar-footer {
          color: #495057;
        }

        /* Enhanced Cards with Theme Colors */
        .dashboard-card {
          transition: all 0.3s ease;
          border: none;
        }

        .dashboard-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0,0,0,0.15);
        }

        /* Progress Bars with Theme Colors */
        .progress {
          background-color: #e9ecef;
          border-radius: 10px;
        }

        .progress-bar {
          border-radius: 10px;
        }

        .bg-primary {
          background: linear-gradient(135deg, #1b262c 0%, #206c95ff 100%) !important;
        }

        /* Buttons with Theme Colors */
        .btn-primary {
          background: linear-gradient(135deg, #1b262c 0%, #206c95ff 100%);
          border: none;
        }

        .btn-primary:hover {
          background: linear-gradient(135deg, #152026 0%, #1a5a7a 100%);
          transform: translateY(-2px);
          box-shadow: 0 4px 15px rgba(32, 108, 149, 0.4);
        }

        .btn-outline-primary {
          color: #206c95ff;
          border-color: #206c95ff;
        }

        .btn-outline-primary:hover {
          background: linear-gradient(135deg, #1b262c 0%, #206c95ff 100%);
          border-color: #206c95ff;
          transform: translateY(-2px);
        }

        /* Badges */
        .badge {
          font-size: 0.7em;
        }

        /* Charts and Graphs */
        .chart-container {
          background: white;
          border-radius: 10px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        /* Table Styling */
        .table-theme {
          background: white;
          border-radius: 10px;
          overflow: hidden;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .table-theme thead {
          background: linear-gradient(135deg, #1b262c 0%, #206c95ff 100%);
          color: white;
        }

        .table-theme th {
          border: none;
          padding: 15px;
          font-weight: 600;
        }

        .table-theme td {
          padding: 12px 15px;
          border-color: #dee2e6;
        }

        /* Form Controls */
        .form-control:focus {
          border-color: #206c95ff;
          box-shadow: 0 0 0 0.2rem rgba(32, 108, 149, 0.25);
        }

        /* Alert Styling */
        .alert-success {
          background: linear-gradient(135deg, #d4edda 0%, #c3e6cb 100%);
          border: 1px solid #28a745;
          color: #155724;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .dashboard-sidebar {
            position: fixed;
            top: 76px;
            left: -280px;
            height: calc(100vh - 76px);
            z-index: 1000;
            transition: left 0.3s ease;
          }
          .dashboard-sidebar.show {
            left: 0;
          }
          
          .dashboard-card {
            margin-bottom: 15px;
          }
          
          .dashboard-content-wrapper {
            padding: 15px;
          }
        }

        /* Animation for smooth transitions */
        .fade-in {
          animation: fadeIn 0.5s ease-in;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Text gradient for headers */
        .text-gradient {
          background: linear-gradient(135deg, #1b262c 0%, #206c95ff 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>
    </div>
  );
}