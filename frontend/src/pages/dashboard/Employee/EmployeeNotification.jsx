// src/components/notification/EmployeeNotification.jsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

export default function EmployeeNotification({ userDbId, token }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [selectedNotifications, setSelectedNotifications] = useState(new Set());

  // ---------------- Fetch Notifications ----------------
  useEffect(() => {
    if (!userDbId) {
      setError("User DB ID not provided.");
      setLoading(false);
      return;
    }
    if (!token) {
      setError("Authentication token not found. Please login.");
      setLoading(false);
      return;
    }

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const url =
          filter === "unread"
            ? `http://localhost:8077/notifications/user/${Number(userDbId)}/unread`
            : `http://localhost:8077/notifications/user/${Number(userDbId)}`;

        const response = await axios.get(url, {
          params: { role: "EMPLOYEE" },
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setNotifications(response.data || []);
          setError(null);
        } else {
          setError("Failed to fetch notifications.");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch notifications from server.");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    const interval = setInterval(fetchNotifications, 30000); // auto-refresh every 30s
    return () => clearInterval(interval);
  }, [userDbId, token, filter]);

  // ---------------- Mark Single Notification as Read ----------------
  const markAsRead = async (notificationId) => {
    try {
      const response = await axios.put(
        `http://localhost:8077/notifications/${Number(notificationId)}/read`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.status === 200 && response.data) {
        setNotifications((prev) =>
          prev.map((n) =>
            Number(n.id) === Number(notificationId)
              ? { ...n, readStatus: true }
              : n
          )
        );
        setSelectedNotifications((prev) => {
          const newSet = new Set(prev);
          newSet.delete(Number(notificationId));
          return newSet;
        });
      } else {
        alert("Failed to mark notification as read.");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to mark notification as read.");
    }
  };

  // ---------------- Toggle Selection ----------------
  const toggleSelection = (id) => {
    setSelectedNotifications((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(Number(id))) newSet.delete(Number(id));
      else newSet.add(Number(id));
      return newSet;
    });
  };

  // ---------------- Mark Multiple Notifications as Read ----------------
  const markMultipleAsRead = async () => {
    if (selectedNotifications.size === 0) return;

    try {
      await Promise.all(
        Array.from(selectedNotifications).map((id) =>
          axios.put(
            `http://localhost:8077/notifications/${Number(id)}/read`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          )
        )
      );

      setNotifications((prev) =>
        prev.map((n) =>
          selectedNotifications.has(Number(n.id))
            ? { ...n, readStatus: true }
            : n
        )
      );
      setSelectedNotifications(new Set());
    } catch (err) {
      console.error(err);
      alert("Failed to mark selected notifications as read.");
    }
  };

  // ---------------- Filters ----------------
  const filteredNotifications = useMemo(() => {
    if (filter === "all") return notifications;
    if (filter === "unread") return notifications.filter((n) => !n.readStatus);
    if (filter === "read") return notifications.filter((n) => n.readStatus);
    return notifications;
  }, [notifications, filter]);

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.readStatus).length,
    [notifications]
  );
  const readCount = useMemo(
    () => notifications.filter((n) => n.readStatus).length,
    [notifications]
  );

  // ---------------- Loading / Error ----------------
  if (loading)
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status"></div>
        <div className="mt-2">Loading notifications...</div>
      </div>
    );

  if (error)
    return (
      <div className="alert alert-danger mt-4 d-flex align-items-center">
        <i className="bi bi-exclamation-triangle-fill me-2"></i>
        {error}
      </div>
    );

  // ---------------- Render ----------------
  return (
    <div className="container-fluid">
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3 className="fw-bold text-gradient mb-2">
          <i className="bi bi-bell-fill me-2"></i> Notifications
        </h3>
        {unreadCount > 0 && (
          <span className="badge bg-danger fs-6 px-3 py-2">
            <i className="bi bi-exclamation-circle-fill me-1"></i>
            {unreadCount} Unread
          </span>
        )}
      </div>

      {/* Filter & Actions */}
      <div className="d-flex justify-content-between mb-4 flex-wrap gap-2">
        <div className="btn-group">
          <input
            type="radio"
            className="btn-check"
            name="filter"
            id="all"
            checked={filter === "all"}
            onChange={() => setFilter("all")}
          />
          <label className="btn btn-outline-primary" htmlFor="all">
            All ({notifications.length})
          </label>

          <input
            type="radio"
            className="btn-check"
            name="filter"
            id="unread"
            checked={filter === "unread"}
            onChange={() => setFilter("unread")}
          />
          <label className="btn btn-outline-warning" htmlFor="unread">
            Unread ({unreadCount})
          </label>

          <input
            type="radio"
            className="btn-check"
            name="filter"
            id="read"
            checked={filter === "read"}
            onChange={() => setFilter("read")}
          />
          <label className="btn btn-outline-success" htmlFor="read">
            Read ({readCount})
          </label>
        </div>

        {selectedNotifications.size > 0 && (
          <button
            className="btn btn-success btn-sm"
            onClick={markMultipleAsRead}
          >
            <i className="bi bi-check2-all me-1"></i> Mark Selected (
            {selectedNotifications.size})
          </button>
        )}
      </div>

      {/* Notifications Grid */}
      <div className="row g-3">
        {filteredNotifications.length === 0 ? (
          <div className="col-12 text-center py-5 text-muted">
            <i className="bi bi-bell-slash display-1"></i>
            <h5 className="mt-3">No notifications found</h5>
            <p>
              {filter === "all"
                ? "You're all caught up!"
                : `No ${filter} notifications.`}
            </p>
          </div>
        ) : (
          filteredNotifications.map((n) => (
            <div key={n.id} className="col-md-6 col-lg-4">
              <div
                className={`card h-100 shadow-sm border-0 ${
                  !n.readStatus ? "border-warning border-2" : ""
                } ${
                  selectedNotifications.has(Number(n.id))
                    ? "border-primary border-2"
                    : ""
                }`}
                style={{
                  cursor: "pointer",
                  background: !n.readStatus
                    ? "linear-gradient(135deg, #fff3cd 0%, #ffffff 50%)"
                    : undefined,
                }}
              >
                <div className="card-body d-flex flex-column">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={selectedNotifications.has(Number(n.id))}
                        onChange={(e) => {
                          e.stopPropagation();
                          toggleSelection(n.id);
                        }}
                      />
                    </div>
                    {!n.readStatus && (
                      <button
                        className="btn btn-sm btn-outline-success"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(n.id);
                        }}
                      >
                        <i className="bi bi-check-circle"></i>
                      </button>
                    )}
                  </div>

                  <h6 className="card-title fw-semibold mb-2">{n.title}</h6>
                  <p
                    className="card-text text-muted mb-3"
                    style={{ fontSize: "0.95rem", lineHeight: 1.4 }}
                  >
                    {n.message}
                  </p>

                  <div className="d-flex justify-content-between align-items-center mt-auto pt-2 border-top">
                    <small className="text-muted" style={{ fontSize: "0.8rem" }}>
                      <i className="bi bi-clock me-1"></i>
                      {new Date(n.createdAt).toLocaleString()}
                    </small>
                    <span className={`badge ${n.readStatus ? "bg-secondary" : "bg-primary"}`}>
                      <i className={`bi ${n.readStatus ? "bi-check-circle" : "bi-circle"} me-1`}></i>
                      {n.readStatus ? "Read" : "Unread"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Fixed Selection Bar */}
      {selectedNotifications.size > 0 && (
        <div className="position-fixed bottom-0 start-50 translate-middle-x mb-3">
          <div className="bg-primary text-white rounded-pill px-4 py-2 shadow-lg d-flex align-items-center gap-3">
            <span>
              <i className="bi bi-check2-circle me-2"></i>
              {selectedNotifications.size} selected
            </span>
            <button className="btn btn-light btn-sm" onClick={markMultipleAsRead}>
              Mark as Read
            </button>
            <button
              className="btn btn-outline-light btn-sm"
              onClick={() => setSelectedNotifications(new Set())}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      <style>{`
        .card:hover { transform: translateY(-2px); box-shadow: 0 4px 15px rgba(0,0,0,0.1); }
        .transition-all { transition: all 0.2s ease-in-out; }
        .btn-check:checked + .btn-outline-primary { background-color: #0d6efd; border-color: #0d6efd; color:white; }
        .btn-check:checked + .btn-outline-warning { background-color: #ffc107; border-color: #ffc107; color:black; }
        .btn-check:checked + .btn-outline-success { background-color: #198754; border-color: #198754; color:white; }
      `}</style>
    </div>
  );
}
