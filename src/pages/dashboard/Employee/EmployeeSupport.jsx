import React, { useState } from "react";

export default function EmployeeSupport({ 
  agentsAvailability, 
  selectedAgentId, 
  setSelectedAgentId, 
  showNotificationAlert 
}) {
  const [activeFaq, setActiveFaq] = useState(""); // Track which FAQ is selected
  const [expandedFaqs, setExpandedFaqs] = useState([]); // Track expanded FAQ items

  const faqs = [
    {
      id: "submitClaim",
      question: "How to submit a claim?",
      answer: "Log in to your Employee Dashboard, navigate to 'Submit New Claim', fill in the claim details, attach required documents, and submit. Ensure all fields are correctly filled for faster processing.",
      icon: "bi-file-text",
      category: "Claims"
    },
    {
      id: "processingTime",
      question: "Claim processing time",
      answer: "Claims are processed Monday to Saturday. Standard claims are reviewed within 48 hours. Urgent claims are prioritized and processed as quickly as possible.",
      icon: "bi-clock",
      category: "Claims"
    },
    {
      id: "requiredDocs",
      question: "Required documents",
      answer: "You will need: Contract form, Claim form, Hospital bills, Medical reports, Supporting receipts, ID proof. Ensure all documents are legible and complete.",
      icon: "bi-file-earmark",
      category: "Claims"
    },
    {
      id: "trackClaim",
      question: "Can I track my claim status?",
      answer: "Yes, all submitted claims can be tracked in real-time via the 'My Claims' section in your dashboard. You'll receive status updates at every stage of the process.",
      icon: "bi-truck",
      category: "Tracking"
    },
    {
      id: "contactAssistance",
      question: "Who can I contact for assistance?",
      answer: "You can contact our insurance agents via callback request, live chat (coming soon), or email support@insurai.com. Our team is available Monday-Friday 9AM-6PM.",
      icon: "bi-person",
      category: "Support"
    },
    {
      id: "urgentAssistance",
      question: "What if I need urgent assistance?",
      answer: "For urgent medical emergencies, call 1-800-INSURAI (1-800-467-8724). Available 24/7 for emergency claims and immediate assistance.",
      icon: "bi-exclamation-triangle",
      category: "Emergency"
    },
    {
      id: "policyCoverage",
      question: "What does my policy cover?",
      answer: "Your policy covers hospitalization, surgical procedures, medication, and diagnostic tests. Check your policy document for specific coverage details and limits.",
      icon: "bi-shield-check",
      category: "Policy"
    },
    {
      id: "renewalProcess",
      question: "How to renew my policy?",
      answer: "Policy renewal is automatic. You'll receive a notification 30 days before expiry. No action required unless you wish to make changes to your coverage.",
      icon: "bi-arrow-repeat",
      category: "Policy"
    }
  ];

  const requiredDocuments = [
    { name: "Contract Form", mandatory: true },
    { name: "Claim Form", mandatory: true },
    { name: "Hospital Bills", mandatory: true },
    { name: "Medical Reports", mandatory: true },
    { name: "Supporting Receipts", mandatory: true },
    { name: "ID Proof", mandatory: true },
    { name: "Doctor's Prescription", mandatory: false },
    { name: "Discharge Summary", mandatory: false }
  ];

  const supportCategories = [
    { name: "Claims", count: 3, icon: "bi-file-text" },
    { name: "Policy", count: 2, icon: "bi-shield-check" },
    { name: "Tracking", count: 1, icon: "bi-truck" },
    { name: "Support", count: 2, icon: "bi-headset" }
  ];

  const toggleFaq = (faqId) => {
    setExpandedFaqs(prev => 
      prev.includes(faqId) 
        ? prev.filter(id => id !== faqId)
        : [...prev, faqId]
    );
  };

  const getAvailableAgentsCount = () => {
    return agentsAvailability.filter(a => a.available).length;
  };

  const renderContactAgentCard = () => (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3">
        <h5 className="card-title mb-0 text-gray-800">
          <i className="bi bi-people me-2"></i>
          Contact Insurance Agent
        </h5>
      </div>
      <div className="card-body">
        <div className="text-center mb-4">
          <i className="bi bi-headset display-4 text-primary mb-3"></i>
          <p className="text-gray-600 mb-0">
            Get personalized assistance with your claims and policies from our expert agents.
          </p>
        </div>

        {/* Agent Availability Status */}
        <div className="card bg-light border-0 mb-4">
          <div className="card-body py-3">
            <div className="d-flex justify-content-between align-items-center">
              <div>
                <span className="fw-semibold text-gray-800">Agent Availability</span>
                <div className="text-xs text-gray-600">
                  {getAvailableAgentsCount()} of {agentsAvailability.length} agents online
                </div>
              </div>
              <div className={`badge ${getAvailableAgentsCount() > 0 ? 'bg-success' : 'bg-warning'}`}>
                {getAvailableAgentsCount() > 0 ? 'Available' : 'Limited'}
              </div>
            </div>
          </div>
        </div>

        {/* Agent Selection */}
        {agentsAvailability.length > 0 ? (
          <>
            <div className="mb-3">
              <label className="form-label fw-semibold text-gray-700">
                Select Agent <span className="text-danger">*</span>
              </label>
              <select
                className="form-select"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
              >
                <option value="">Choose an agent...</option>
                {agentsAvailability.map((a) => (
                  <option
                    key={a.id}
                    value={a.agent.id}
                    disabled={!a.available}
                    className={a.available ? "text-success" : "text-muted"}
                  >
                    {a.agent.name} • {a.available ? "🟢 Online" : "🔴 Offline"}
                    {a.agent.specialization && ` • ${a.agent.specialization}`}
                  </option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary w-100 shadow-sm"
              disabled={!selectedAgentId}
              onClick={() => showNotificationAlert("Agent callback requested. They will contact you soon.", "success")}
            >
              <i className="bi bi-telephone me-2"></i> Request Callback
            </button>

            <div className="text-center mt-3">
              <small className="text-gray-600">
                <i className="bi bi-info-circle me-1"></i>
                Typically respond within 2-4 hours
              </small>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <i className="bi bi-person-x display-4 text-gray-300 mb-3"></i>
            <p className="text-gray-600 mb-3">No agents available currently</p>
            <button
              className="btn btn-outline-primary"
              onClick={() => showNotificationAlert("Our team will contact you as soon as an agent becomes available.", "info")}
            >
              <i className="bi bi-bell me-2"></i> Notify Me
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderFaqsCard = () => (
    <div className="card shadow-sm border-0 h-100">
      <div className="card-header bg-white py-3">
        <h5 className="card-title mb-0 text-gray-800">
          <i className="bi bi-question-circle me-2"></i>
          FAQs & Resources
        </h5>
      </div>
      <div className="card-body">
        <div className="text-center mb-4">
          <i className="bi bi-lightbulb display-4 text-warning mb-3"></i>
          <p className="text-gray-600 mb-0">
            Find answers to common questions about your insurance benefits and claim processes.
          </p>
        </div>

        {/* FAQ Categories */}
        <div className="mb-4">
          <label className="form-label fw-semibold text-gray-700">Browse by Category</label>
          <div className="row g-2">
            {supportCategories.map((category, index) => (
              <div key={index} className="col-6">
                <button
                  className="btn btn-outline-primary w-100 text-start"
                  onClick={() => setActiveFaq(category.name)}
                >
                  <i className={`bi ${category.icon} me-2`}></i>
                  {category.name}
                  <span className="badge bg-primary ms-2">{category.count}</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Quick FAQ Links */}
        <div className="mb-4">
          <label className="form-label fw-semibold text-gray-700">Quick Questions</label>
          <div className="d-grid gap-2">
            {faqs.slice(0, 4).map((faq, index) => (
              <button
                key={faq.id}
                className="btn btn-outline-secondary text-start"
                onClick={() => toggleFaq(faq.id)}
              >
                <i className={`bi ${faq.icon} me-2`}></i>
                {faq.question}
                <i className={`bi ${expandedFaqs.includes(faq.id) ? 'bi-chevron-up' : 'bi-chevron-down'} float-end mt-1`}></i>
              </button>
            ))}
          </div>
        </div>

        {/* Expanded FAQ Content */}
        {expandedFaqs.map(faqId => {
          const faq = faqs.find(f => f.id === faqId);
          if (!faq) return null;
          
          return (
            <div key={faq.id} className="card border-primary mb-3">
              <div className="card-header bg-light-primary border-0">
                <h6 className="mb-0 text-gray-800">
                  <i className={`bi ${faq.icon} me-2`}></i>
                  {faq.question}
                </h6>
              </div>
              <div className="card-body">
                <p className="text-gray-700 mb-0">{faq.answer}</p>
                {faq.id === "requiredDocs" && (
                  <div className="mt-3">
                    <h6 className="fw-semibold text-gray-800 mb-2">Required Documents:</h6>
                    <div className="row">
                      {requiredDocuments.map((doc, i) => (
                        <div key={i} className="col-md-6 mb-2">
                          <div className="d-flex align-items-center">
                            <i className={`bi ${doc.mandatory ? 'bi-file-earmark-check text-success' : 'bi-file-earmark-plus text-info'} me-2`}></i>
                            <span className={doc.mandatory ? "fw-semibold text-gray-800" : "text-gray-600"}>
                              {doc.name}
                              {doc.mandatory && <small className="text-danger ms-1">*</small>}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <small className="text-gray-600">
                      <i className="bi bi-info-circle me-1"></i>
                      * Mandatory documents
                    </small>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* View All FAQs Button */}
        <div className="d-grid">
          <button
            className="btn btn-primary"
            onClick={() => setActiveFaq("allFaqs")}
          >
            <i className="bi bi-search me-2"></i> View All FAQs
          </button>
        </div>
      </div>
    </div>
  );

  const renderSupportChannels = () => (
    <div className="row">
      {/* Live Chat Support */}
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white py-3">
            <h5 className="card-title mb-0 text-gray-800">
              <i className="bi bi-chat-dots me-2"></i>
              Live Chat Support
            </h5>
          </div>
          <div className="card-body text-center">
            <div className="mb-4">
              <i className="bi bi-chat-square-text display-4 text-success mb-3"></i>
              <h6 className="text-gray-800">Real-time Assistance</h6>
              <p className="text-gray-600 mb-0">
                Chat with our support team for immediate assistance with your queries.
              </p>
            </div>
            
            <div className="card bg-light-success border-0 mb-4">
              <div className="card-body py-3">
                <div className="d-flex align-items-center">
                  <i className="bi bi-clock text-warning me-2"></i>
                  <small className="text-gray-600">Available: Monday - Friday, 9AM - 6PM</small>
                </div>
              </div>
            </div>

            <button
              className="btn btn-success w-100 shadow-sm"
              onClick={() => showNotificationAlert("Live chat feature coming soon! Stay tuned for updates.", "info")}
            >
              <i className="bi bi-chat me-2"></i> Start Live Chat
            </button>
          </div>
        </div>
      </div>

      {/* Email Support */}
      <div className="col-md-6 mb-4">
        <div className="card shadow-sm border-0 h-100">
          <div className="card-header bg-white py-3">
            <h5 className="card-title mb-0 text-gray-800">
              <i className="bi bi-envelope me-2"></i>
              Email Support
            </h5>
          </div>
          <div className="card-body text-center">
            <div className="mb-4">
              <i className="bi bi-envelope-check display-4 text-primary mb-3"></i>
              <h6 className="text-gray-800">Detailed Support</h6>
              <p className="text-gray-600 mb-0">
                Send detailed queries via email and get comprehensive responses.
              </p>
            </div>

            <div className="card bg-light border-0 mb-4">
              <div className="card-body py-3">
                <h6 className="text-gray-800 mb-1">support@insurai.com</h6>
                <small className="text-gray-600">We respond within 24 hours</small>
              </div>
            </div>

            <button
              className="btn btn-primary w-100 shadow-sm"
              onClick={() => window.location = "mailto:support@insurai.com?subject=Insurance Support Query"}
            >
              <i className="bi bi-send me-2"></i> Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderEmergencyAssistance = () => (
    <div className="card shadow-sm border-0 bg-gradient-warning text-dark">
      <div className="card-body">
        <div className="row align-items-center">
          <div className="col-md-2 text-center">
            <i className="bi bi-exclamation-triangle display-4"></i>
          </div>
          <div className="col-md-8">
            <h5 className="fw-bold mb-2">Emergency Assistance</h5>
            <p className="mb-2">For urgent medical emergencies requiring immediate claim processing:</p>
            <h3 className="fw-bold mb-2">1-800-INSURAI (1-800-467-8724)</h3>
            <p className="mb-0">
              <i className="bi bi-clock me-1"></i>
              Available 24/7 for emergency claims and immediate assistance
            </p>
          </div>
          <div className="col-md-2 text-center">
            <button
              className="btn btn-danger btn-lg shadow-sm"
              onClick={() => showNotificationAlert("Emergency line: 1-800-467-8724. Please use this number only for genuine emergencies.", "warning")}
            >
              <i className="bi bi-telephone me-2"></i> Call Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAllFaqsModal = () => (
    <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0,0,0,0.5)" }}>
      <div className="modal-dialog modal-lg modal-dialog-centered">
        <div className="modal-content shadow-lg border-0">
          <div className="modal-header bg-gradient-primary text-white">
            <h5 className="modal-title">
              <i className="bi bi-question-circle me-2"></i>
              Frequently Asked Questions
            </h5>
            <button 
              type="button" 
              className="btn-close btn-close-white" 
              onClick={() => setActiveFaq("")}
            ></button>
          </div>
          <div className="modal-body" style={{ maxHeight: '60vh', overflowY: 'auto' }}>
            {faqs.map((faq, index) => (
              <div key={faq.id} className="card mb-3 border-0 shadow-sm">
                <div className="card-header bg-light border-0">
                  <h6 className="mb-0 text-gray-800">
                    <i className={`bi ${faq.icon} me-2`}></i>
                    {faq.question}
                    <span className="badge bg-secondary ms-2">{faq.category}</span>
                  </h6>
                </div>
                <div className="card-body">
                  <p className="text-gray-700 mb-0">{faq.answer}</p>
                </div>
              </div>
            ))}
            
            {/* Required Documents Section */}
            <div className="card border-0 shadow-sm">
              <div className="card-header bg-light border-0">
                <h6 className="mb-0 text-gray-800">
                  <i className="bi bi-file-earmark-check me-2"></i>
                  Required Documents Checklist
                </h6>
              </div>
              <div className="card-body">
                <div className="row">
                  {requiredDocuments.map((doc, i) => (
                    <div key={i} className="col-md-6 mb-2">
                      <div className="d-flex align-items-center">
                        <i className={`bi ${doc.mandatory ? 'bi-check-circle-fill text-success' : 'bi-info-circle text-info'} me-2`}></i>
                        <span className={doc.mandatory ? "fw-semibold text-gray-800" : "text-gray-600"}>
                          {doc.name}
                        </span>
                        {doc.mandatory && <small className="text-danger ms-1">*</small>}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3">
                  <small className="text-gray-600">
                    <i className="bi bi-info-circle me-1"></i>
                    * Mandatory documents for claim processing
                  </small>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer border-0">
            <button 
              type="button" 
              className="btn btn-secondary rounded-pill px-4" 
              onClick={() => setActiveFaq("")}
            >
              <i className="bi bi-x-circle me-1"></i> Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
         <h3 className="fw-bold text-gradient mb-2">Get Support</h3>
          <p className="text-gray-600 mb-0">Multiple ways to get help with your insurance needs</p>
        </div>
      </div>

      {/* Main Support Cards */}
      <div className="row mb-4">
        <div className="col-lg-6 mb-4">
          {renderContactAgentCard()}
        </div>
        <div className="col-lg-6 mb-4">
          {renderFaqsCard()}
        </div>
      </div>

      {/* Support Channels */}
      {renderSupportChannels()}

      {/* Emergency Assistance */}
      <div className="mb-4">
        {renderEmergencyAssistance()}
      </div>

      {/* All FAQs Modal */}
      {activeFaq === "allFaqs" && renderAllFaqsModal()}
    </div>
  );
}