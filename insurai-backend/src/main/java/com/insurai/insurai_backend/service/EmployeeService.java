package com.insurai.insurai_backend.service;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.repository.EmployeeRepository;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class EmployeeService {

    private final EmployeeRepository employeeRepository;
    private final JavaMailSender mailSender; // For sending emails

    // TODO: Replace with your actual secret key from application.properties or environment variable
    private final String jwtSecret = "YOUR_SECRET_KEY_HERE";

    /**
     * Registers a new employee.
     * Assumes password is already encoded and role is set in controller.
     */
    public Employee register(Employee employee) {
        return employeeRepository.save(employee);
    }

    /**
     * Validate employee credentials.
     */
    public boolean validateCredentials(Employee employee, String rawPassword, PasswordEncoder passwordEncoder) {
        return passwordEncoder.matches(rawPassword, employee.getPassword());
    }

    // -------------------- Generate simple token for Employee --------------------
    public String generateEmployeeToken(String identifier) {
        String tokenData = identifier + ":" + System.currentTimeMillis();
        return Base64.getEncoder().encodeToString(tokenData.getBytes(StandardCharsets.UTF_8));
    }

    // -------------------- Verify employee token (JWT version) --------------------
    public boolean isEmployee(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) return false;

        try {
            String token = authHeader.substring(7).trim();
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject();
            return employeeRepository.findByEmail(email).isPresent();

        } catch (Exception e) {
            System.out.println("[EmployeeService] JWT validation failed: " + e.getMessage());
            return false;
        }
    }

    // -------------------- Get Employee object from JWT token --------------------
    public Employee getEmployeeFromToken(String token) {
        if (token == null || token.isEmpty()) return null;

        try {
            Claims claims = Jwts.parserBuilder()
                    .setSigningKey(jwtSecret.getBytes(StandardCharsets.UTF_8))
                    .build()
                    .parseClaimsJws(token)
                    .getBody();

            String email = claims.getSubject();
            return employeeRepository.findByEmail(email).orElse(null);

        } catch (Exception e) {
            System.out.println("[EmployeeService] Failed to get employee from token: " + e.getMessage());
            return null;
        }
    }

    // -------------------- Lookup Employee by Email --------------------
    public Employee findByEmail(String email) {
        return employeeRepository.findByEmail(email).orElse(null);
    }

    // -------------------- Lookup Employee by Employee ID --------------------
    public Employee findByEmployeeId(String employeeId) {
        return employeeRepository.findByEmployeeId(employeeId).orElse(null);
    }

    // -------------------- Send Reset Password Email --------------------
    public void sendResetPasswordEmail(String email, String token) {
        Optional<Employee> optionalEmp = employeeRepository.findByEmail(email);
        if (optionalEmp.isEmpty()) return;

        Employee emp = optionalEmp.get();

        // Set token and expiry (30 minutes from now)
        emp.setResetToken(token);
        emp.setResetTokenExpiry(LocalDateTime.now().plusMinutes(30));
        employeeRepository.save(emp);

        // Construct frontend reset password link (HashRouter-friendly)
        String resetLink = "http://localhost:5173/#/employee/reset-password/" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(emp.getEmail());
        message.setSubject("Reset Your Password");
        message.setText("Hi " + emp.getName() + ",\n\n" +
                "Click the link below to reset your password (valid for 30 minutes):\n" +
                resetLink + "\n\n" +
                "If you didn't request this, please ignore this email.\n\n" +
                "Thanks,\nInsurAi Team");

        mailSender.send(message);
    }
}
