package com.insurai.insurai_backend.repository;

import com.insurai.insurai_backend.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Fetch all audit logs ordered by timestamp descending (latest first).
     * Useful for Admin dashboard display.
     */
    List<AuditLog> findAllByOrderByTimestampDesc();

    // Additional query methods can be added later if needed, e.g.,
    // List<AuditLog> findByRole(String role);
    // List<AuditLog> findByAction(String action);
    // List<AuditLog> findByTimestampBetween(LocalDateTime start, LocalDateTime end);
}
