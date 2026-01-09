import React, { useState } from "react";

export default function AgentAvailability({
  agentName,
  availability,
  toggleAvailability,
  futureFrom,
  setFutureFrom,
  futureTo,
  setFutureTo,
  scheduleFutureAvailability,
}) {
  const [scheduledSlots, setScheduledSlots] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSchedule = () => {
    setError("");
    setSuccess("");

    if (!futureFrom || !futureTo) {
      setError("⚠️ Please select both start and end date/time.");
      return;
    }
    if (new Date(futureFrom) >= new Date(futureTo)) {
      setError("⚠️ End time must be after start time.");
      return;
    }

    const newSlot = { from: futureFrom, to: futureTo };
    setScheduledSlots([...scheduledSlots, newSlot]);
    scheduleFutureAvailability(newSlot);

    setFutureFrom("");
    setFutureTo("");
    setSuccess("✅ Future availability scheduled successfully!");
  };

  const handleRemoveSlot = (index) => {
    const updatedSlots = scheduledSlots.filter((_, i) => i !== index);
    setScheduledSlots(updatedSlots);
    setSuccess("🗑️ Scheduled slot removed.");
  };

  return (
    <div>
      <h3 className="mb-4 fw-bold" style={{ background: 'linear-gradient(to right, #010f0c, #087f5b)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Availability Settings ({agentName})</h3>
      <div className="card shadow-sm">
        <div className="card-header bg-success text-white">
          <h5 className="mb-0">
            <i className="bi bi-person-check me-2"></i> Set Your Availability
          </h5>
        </div>
        <div className="card-body">
          {/* Alerts */}
          {success && (
            <div className="alert alert-success alert-dismissible fade show d-flex align-items-center mb-4">
              <i className="bi bi-check-circle-fill me-2 fs-5"></i>
              <div className="flex-grow-1">{success}</div>
              <button type="button" className="btn-close" onClick={() => setSuccess("")}></button>
            </div>
          )}
          {error && (
            <div className="alert alert-danger alert-dismissible fade show d-flex align-items-center mb-4">
              <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
              <div className="flex-grow-1">{error}</div>
              <button type="button" className="btn-close" onClick={() => setError("")}></button>
            </div>
          )}

          <div className="alert alert-info">
            <i className="bi bi-info-circle me-2"></i>
            When you're unavailable, employees will see that you're not accepting new queries at the moment.
          </div>

          {/* Current Availability */}
          <div className="d-flex align-items-center mb-4">
            <div className="form-check form-switch me-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="availabilityToggle"
                checked={availability}
                onChange={toggleAvailability}
                style={{ transform: "scale(1.5)" }}
              />
            </div>
            <label className="form-check-label fs-5 fw-semibold" htmlFor="availabilityToggle">
              I am currently available for employee queries
            </label>
          </div>

          <div
            className={`p-3 rounded-3 ${
              availability ? "bg-success bg-opacity-10" : "bg-warning bg-opacity-10"
            }`}
          >
            <h6 className="mb-2">Current Status:</h6>
            <span
              className={`badge fs-6 px-3 py-2 ${
                availability ? "bg-success" : "bg-warning text-dark"
              }`}
            >
              {availability
                ? "Available - Employees can contact you"
                : "Unavailable - Not accepting new queries"}
            </span>
          </div>

          {/* Schedule Future Availability */}
          <div className="mt-4">
            <h6 className="fw-bold">Schedule Future Availability:</h6>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">From</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={futureFrom}
                  onChange={(e) => setFutureFrom(e.target.value)}
                />
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label fw-semibold">To</label>
                <input
                  type="datetime-local"
                  className="form-control"
                  value={futureTo}
                  onChange={(e) => setFutureTo(e.target.value)}
                />
              </div>
            </div>
            <button className="btn btn-success" onClick={handleSchedule}>
              <i className="bi bi-calendar-check me-2"></i> Schedule Availability
            </button>
          </div>

          {/* Scheduled Slots Table */}
          {scheduledSlots.length > 0 && (
            <div className="mt-5">
              <h6 className="fw-bold mb-3">
                <i className="bi bi-clock-history me-2"></i> Upcoming Scheduled Slots
              </h6>
              <div className="table-responsive">
                <table className="table table-bordered align-middle">
                  <thead className="table-light">
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scheduledSlots.map((slot, index) => (
                      <tr key={index}>
                        <td>{new Date(slot.from).toLocaleString()}</td>
                        <td>{new Date(slot.to).toLocaleString()}</td>
                        <td>
                          <span className="badge bg-primary">Scheduled</span>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveSlot(index)}
                          >
                            <i className="bi bi-trash me-1"></i> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
