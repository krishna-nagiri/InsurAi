package com.insurai.insurai_backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "employees")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Employee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // 👇 Corporate employee ID
    @Column(unique = true, nullable = false)
    private String employeeId;

    private String name;

    @Column(unique = true, nullable = false)
    private String email;

    private String password;

    @Enumerated(EnumType.STRING)
    private Role role = Role.EMPLOYEE;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE;   // Account Status.

    // -------------------- Password Reset Fields --------------------
    @Column(name = "reset_token", length = 100)
    private String resetToken; // Token for resetting password

    @Column(name = "reset_token_expiry")
    private LocalDateTime resetTokenExpiry; // Token expiry timestamp

    // -------------------- Role Enum --------------------
    public enum Role {
        EMPLOYEE, HR, ADMIN
    }
}
