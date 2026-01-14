package com.insurai.insurai_backend.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.Notification;
import com.insurai.insurai_backend.repository.EmployeeRepository;
import com.insurai.insurai_backend.service.InAppNotificationService;

@CrossOrigin(origins = "http://localhost:3000") // Enable CORS for React frontend
@RestController
@RequestMapping("/notifications")
public class NotificationController {

    @Autowired
    private InAppNotificationService notificationService;
    @Autowired
    private EmployeeRepository employeeRepository;

    /**
     * Get all notifications for a specific user AND role (sorted by newest first)
     * Example: GET /notifications/user/5?role=HR
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Notification>> getNotificationsByUser(
            @PathVariable Long userId,
            @RequestParam(required = false) String role
    ) {
        List<Notification> notifications;
        if (role != null) {
            notifications = notificationService.getNotificationsByUserIdAndRole(userId, role);
        } else {
            notifications = notificationService.getNotificationsByUserId(userId);
        }
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get unread notifications for a specific user AND role
     * Example: GET /notifications/user/5/unread?role=HR
     */
    @GetMapping("/user/{userId}/unread")
    public ResponseEntity<List<Notification>> getUnreadNotifications(
            @PathVariable Long userId,
            @RequestParam(required = false) String role
    ) {
        List<Notification> notifications;
        if (role != null) {
            notifications = notificationService.getUnreadNotificationsByUserIdAndRole(userId, role);
        } else {
            notifications = notificationService.getUnreadNotificationsByUserId(userId);
        }
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get all notifications for a specific role (sorted by newest first)
     */
    @GetMapping("/role/{role}")
    public ResponseEntity<List<Notification>> getNotificationsByRole(@PathVariable String role) {
        List<Notification> notifications = notificationService.getNotificationsByRole(role);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Get all notifications for a role filtered by type (e.g., CLAIM, POLICY, GENERAL)
     */
    @GetMapping("/role/{role}/type")
    public ResponseEntity<List<Notification>> getNotificationsByRoleAndType(
            @PathVariable String role,
            @RequestParam String type
    ) {
        List<Notification> notifications = notificationService.getNotificationsByRoleAndType(role, type);
        return ResponseEntity.ok(notifications);
    }

    /**
     * Mark a notification as read
     */
    @PutMapping("/{notificationId}/read")
    public ResponseEntity<?> markAsRead(@PathVariable Long notificationId) {

        Authentication auth =
            SecurityContextHolder.getContext().getAuthentication();

        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }

        String principal = auth.getPrincipal().toString();

        String role = auth.getAuthorities()
                .iterator()
                .next()
                .getAuthority()
                .replace("ROLE_", "");

        Optional<Employee> employee = employeeRepository.findByEmail(principal);

        if (employee.isEmpty()) {
            return ResponseEntity.status(401).build();
        }

        Long currentEmployeeId = employee.get().getId();

        try {
            Notification updated =
                notificationService.markAsRead(notificationId, role, currentEmployeeId);
            return ResponseEntity.ok(updated);

        } catch (RuntimeException ex) {

            if ("NOT_FOUND".equals(ex.getMessage())) {
                return ResponseEntity.notFound().build();
            }

            if ("FORBIDDEN".equals(ex.getMessage())) {
                return ResponseEntity.status(403).build();
            }

            return ResponseEntity.status(500).build();
        }
    }



    /**
     * Delete a notification
     */
    @DeleteMapping("/{notificationId}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long notificationId) {
        notificationService.deleteNotification(notificationId);
        return ResponseEntity.noContent().build();
    }
}
