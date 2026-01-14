package com.insurai.insurai_backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;

@Entity
@Table(name = "admins")
public class Admin {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    // Store role in simple form like "ADMIN", will add ROLE_ prefix at runtime
    @Column(nullable = false)
    private String role = "ADMIN";

    // Constructors
    public Admin() {}

    public Admin(String email, String password, String role) {
        this.email = email;
        this.password = password;
        this.role = role;
    }

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }

    // Utility method to get Spring Security compatible role
    @Transient
    public String getSpringRole() {
        return role.startsWith("ROLE_") ? role : "ROLE_" + role;
    }

    @Override
    public String toString() {
        return "Admin{" +
                "id=" + id +
                ", email='" + email + '\'' +
                ", role='" + role + '\'' +
                '}';
    }
}
