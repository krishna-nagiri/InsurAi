package com.insurai.insurai_backend.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.insurai.insurai_backend.model.Employee;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    // Find by email
    Optional<Employee> findByEmail(String email);

    // Find by employee ID
    Optional<Employee> findByEmployeeId(String employeeId);

    // 🔹 New method for password reset functionality
    Optional<Employee> findByResetToken(String resetToken);
}
