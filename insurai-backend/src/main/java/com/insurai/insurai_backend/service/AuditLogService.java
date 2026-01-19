package com.insurai.insurai_backend.service;

import com.insurai.insurai_backend.model.AuditLog;
import com.insurai.insurai_backend.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogService {

    private final AuditLogRepository auditLogRepository;

    /**
     * Log an action performed by any user.
     * @param userId ID of the user performing the action
     * @param userName Name of the user
     * @param role Role of the user
     * @param action Action type (LOGIN, LOGOUT, CLAIM_APPROVE, etc.)
     * @param details Optional details about the action
     */
    public void logAction(String userId, String userName, String role, String action, String details) {
        AuditLog log = new AuditLog();
        log.setUserId(userId);
        log.setUserName(userName);
        log.setRole(role);
        log.setAction(action);
        log.setDetails(details);
        log.setTimestamp(LocalDateTime.now());

        auditLogRepository.save(log);
    }

    /**
     * Fetch all audit logs, most recent first.
     * Used for Admin dashboard.
     */
    public List<AuditLog> getAllLogs() {
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }
}
