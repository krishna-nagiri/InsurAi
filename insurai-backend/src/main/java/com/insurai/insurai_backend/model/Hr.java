package com.insurai.insurai_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@Entity
@Table(name = "hrs")
public class Hr {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name; // Full Name

    @Column(nullable = false, unique = true)
    private String email; // Corporate Email

    @Column(nullable = false)
    private String phoneNumber; // Contact Number

    @Column(nullable = false, unique = true)
    private String hrId; // Unique HR ID
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private UserStatus status = UserStatus.ACTIVE; // Account Status.

    @Column(nullable = false)
    private String password; // Encrypted Password
}
