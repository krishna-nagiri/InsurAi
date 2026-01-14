package com.insurai.insurai_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurai.insurai_backend.model.Hr;

public interface HrRepository extends JpaRepository<Hr, Long> {
    // Find HR by email (used for login/validation)
    Optional<Hr> findByEmail(String email);

    // Optionally, you could add a method to filter active HRs if you later add an "active" field
    // List<Hr> findByActiveTrue();
}
