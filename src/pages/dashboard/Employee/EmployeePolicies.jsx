import React, { useState } from "react";
import jsPDF from "jspdf";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function EmployeePolicies({
  policies = [],
  selectedPolicy,
  setSelectedPolicy
}) {
  const [localSelectedPolicy, setLocalSelectedPolicy] = useState(selectedPolicy);

  const viewPolicyDetails = (policy) => {
    setLocalSelectedPolicy(policy);
    setSelectedPolicy(policy);
  };

  // ✅ Download Policy PDF
  const downloadPolicy = (policy) => {
    const doc = new jsPDF();
    let y = 20;

    doc.setFontSize(18);
    doc.text(policy.name, 20, y);
    y += 10;

    doc.setFontSize(12);
    doc.text(`Provider: ${policy.provider}`, 20, y);
    y += 10;
    doc.text(`Coverage: ${policy.formattedCoverage || `₹${policy.coverageAmount.toLocaleString("en-IN")}`}`, 20, y);
    y += 10;
    doc.text(`Premium: ${policy.formattedPremium || `₹${policy.monthlyPremium.toLocaleString("en-IN")}`}/month`, 20, y);
    y += 10;
    doc.text(`Renewal Date: ${policy.renewalDate}`, 20, y);
    y += 10;
    doc.text(`Status: ${policy.status}`, 20, y);
    y += 15;

    doc.setFontSize(14);
    doc.text("Covered Benefits:", 20, y);
    y += 8;

    doc.setFontSize(12);
    policy.benefits.forEach((benefit) => {
      // Wrap long text to fit page width
      const lines = doc.splitTextToSize(benefit.replace(/\s+/g, " ").trim(), 170);
      lines.forEach((line) => {
        doc.text(`- ${line}`, 25, y);
        y += 7;
        if (y > 280) {
          doc.addPage();
          y = 20;
        }
      });
      y += 3;
    });

    // Sanitize file name
    const fileName = policy.name ? policy.name.replace(/[^a-z0-9]/gi, "_") : "policy";
    doc.save(`${fileName}.pdf`);
  };

  // ✅ Main Render
  return (
    <div className="container-fluid">
      {/* Header Summary */}
      <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center mb-4">
        <h3 className="fw-bold text-gradient mb-2">Your Insurance Policies</h3>
        <div className="d-flex flex-column flex-md-row gap-3 text-muted small">
          <span>
            <strong>{policies.length}</strong> Active Policies
          </span>
          <span>
            <strong>
              ₹
              {policies
                .reduce((total, policy) => total + (policy.monthlyPremium || 0), 0)
                .toLocaleString("en-IN")}
            </strong>{" "}
            Total Monthly Premium
          </span>
        </div>
      </div>

      {/* Policy Cards */}
      <div className="d-flex flex-wrap gap-4">
        {policies.length === 0 ? (
          <div className="text-center w-100 text-muted py-5">
            <i className="bi bi-exclamation-circle fs-1 mb-3 d-block"></i>
            <p>No policies found for your account.</p>
          </div>
        ) : (
          policies.map((policy) => (
            <div
              key={policy.id}
              className="flex-grow-1"
              style={{
                flexBasis:
                  policies.length === 1
                    ? "100%"
                    : policies.length === 2
                    ? "48%"
                    : "30%",
                minWidth: "250px",
              }}
            >
              <div className="card h-100 shadow-sm border rounded-3 hover-shadow transition">
                <div className="card-header bg-white border-0 d-flex justify-content-between align-items-center">
                  <h5 className="mb-0 text-truncate">{policy.name}</h5>
                  <span
                    className={`badge px-3 py-2 ${
                      policy.status === "Active"
                        ? "bg-success"
                        : policy.status === "Expired"
                        ? "bg-danger"
                        : "bg-secondary"
                    }`}
                  >
                    {policy.status}
                  </span>
                </div>

                <div className="card-body">
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Provider:</span>
                    <span>{policy.provider}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Coverage:</span>
                    <span>{policy.formattedCoverage}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <span className="fw-semibold">Premium:</span>
                    <span>{policy.formattedPremium || `₹${policy.monthlyPremium}/month`}</span>
                  </div>
                  <div className="d-flex justify-content-between mb-3">
                    <span className="fw-semibold">Renewal:</span>
                    <span>{policy.renewalDate}</span>
                  </div>

                  <h6 className="fw-semibold mb-2">Covered Benefits:</h6>
                  <div className="d-flex flex-column gap-2 mb-3">
                    {policy.benefits.length > 0 ? (
                      policy.benefits.map((benefit, index) => (
                        <span
                          key={index}
                          className="bg-light border rounded px-3 py-2 text-dark small"
                        >
                          {benefit}
                        </span>
                      ))
                    ) : (
                      <span className="text-muted small">No details available</span>
                    )}
                  </div>

                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-sm btn-primary flex-fill shadow-sm"
                      onClick={() => viewPolicyDetails(policy)}
                    >
                      <i className="bi bi-eye me-1"></i> View Details
                    </button>
                    <button
                      className="btn btn-sm btn-outline-primary flex-fill shadow-sm"
                      onClick={() => downloadPolicy(policy)}
                    >
                      <i className="bi bi-download me-1"></i> Download
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Policy Modal */}
      {localSelectedPolicy && (
        <div className="modal show d-block" tabIndex="-1">
          <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
            <div className="modal-content shadow-lg rounded-4">
              <div className="modal-header border-0 bg-light">
                <h5 className="modal-title">{localSelectedPolicy.name}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setLocalSelectedPolicy(null)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p>
                      <strong>Provider:</strong> {localSelectedPolicy.provider}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Coverage:</strong> {localSelectedPolicy.formattedCoverage}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Premium:</strong> {localSelectedPolicy.formattedPremium || `₹${localSelectedPolicy.monthlyPremium}/month`}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Renewal Date:</strong> {localSelectedPolicy.renewalDate}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Status:</strong> {localSelectedPolicy.status}
                    </p>
                  </div>
                </div>

                <h6 className="mt-3 fw-semibold">Covered Benefits:</h6>
                <ul className="list-group list-group-flush mb-3">
                  {localSelectedPolicy.benefits.map((benefit, idx) => (
                    <li key={idx} className="list-group-item small">
                      {benefit}
                    </li>
                  ))}
                </ul>

                <h6 className="mt-3 fw-semibold">Documents:</h6>
                <div className="d-flex flex-wrap gap-2 mb-2">
                  {localSelectedPolicy.contractUrl && (
                    <a
                      href={localSelectedPolicy.contractUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm shadow-sm"
                    >
                      Contract
                    </a>
                  )}
                  {localSelectedPolicy.termsUrl && (
                    <a
                      href={localSelectedPolicy.termsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm shadow-sm"
                    >
                      Terms
                    </a>
                  )}
                  {localSelectedPolicy.claimFormUrl && (
                    <a
                      href={localSelectedPolicy.claimFormUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm shadow-sm"
                    >
                      Claim Form
                    </a>
                  )}
                  {localSelectedPolicy.annexureUrl && (
                    <a
                      href={localSelectedPolicy.annexureUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline-primary btn-sm shadow-sm"
                    >
                      Annexure
                    </a>
                  )}
                </div>
              </div>
              <div className="modal-footer border-0">
                <button
                  className="btn btn-secondary"
                  onClick={() => setLocalSelectedPolicy(null)}
                >
                  Close
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => downloadPolicy(localSelectedPolicy)}
                >
                  Download Policy Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
