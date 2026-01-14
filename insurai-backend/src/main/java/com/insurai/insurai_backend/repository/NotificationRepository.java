package com.insurai.insurai_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurai.insurai_backend.model.Notification;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {

    // ------------------ By User ------------------

    // All notifications for a user
    List<Notification> findByTargetIdOrderByCreatedAtDesc(Long targetId);

    // Unread notifications for a user
    List<Notification> findByTargetIdAndReadStatusFalseOrderByCreatedAtDesc(Long targetId);

    // All notifications for a user with a specific role
    List<Notification> findByTargetIdAndTargetRoleOrderByCreatedAtDesc(Long targetId, String targetRole);

    // Unread notifications for a user with a specific role
    List<Notification> findByTargetIdAndTargetRoleAndReadStatusFalseOrderByCreatedAtDesc(Long targetId, String targetRole);

    // Unread notifications for a user with a specific role and type
    List<Notification> findByTargetIdAndTargetRoleAndNotificationTypeAndReadStatusFalseOrderByCreatedAtDesc(
        Long targetId, String targetRole, String notificationType
    );

    // ------------------ By Role ------------------

    // All notifications for a role
    List<Notification> findByTargetRoleOrderByCreatedAtDesc(String targetRole);

    // Unread notifications for a role
    List<Notification> findByTargetRoleAndReadStatusFalseOrderByCreatedAtDesc(String targetRole);

    // All notifications for a role filtered by type
    List<Notification> findByTargetRoleAndNotificationTypeOrderByCreatedAtDesc(String targetRole, String notificationType);

    // Unread notifications for a role filtered by type
    List<Notification> findByTargetRoleAndNotificationTypeAndReadStatusFalseOrderByCreatedAtDesc(
        String targetRole, String notificationType
    );
}
