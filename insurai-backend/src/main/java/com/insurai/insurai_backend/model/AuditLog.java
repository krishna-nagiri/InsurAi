package com.insurai.insurai_backend.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String userId;       // ID of the user performing the action
    private String userName;     // Name of the user
    private String role;         // User role: ADMIN, HR, AGENT, EMPLOYEE
    private String action;       // Action type: LOGIN, LOGOUT, CLAIM_APPROVE, etc.
    private String details;      // Additional info about the action
    private LocalDateTime timestamp; // When the action occurred

}
