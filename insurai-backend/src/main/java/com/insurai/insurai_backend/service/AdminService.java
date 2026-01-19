package com.insurai.insurai_backend.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.config.JwtUtil;
import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.model.Hr;
import com.insurai.insurai_backend.model.RegisterRequest;
import com.insurai.insurai_backend.repository.AgentRepository;
import com.insurai.insurai_backend.repository.HrRepository;

@Service
public class AdminService {

    private static final String ADMIN_EMAIL = "admin@insurai.com";
    private static final String ADMIN_PASSWORD = "Admin@123";

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private HrRepository hrRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtil jwtUtil;

    // -------------------- Admin login --------------------
    public boolean validateAdmin(String email, String password) {
        return ADMIN_EMAIL.equals(email) && ADMIN_PASSWORD.equals(password);
    }

    public String getAdminName(String email) {
        return ADMIN_EMAIL.equals(email) ? "Admin" : null;
    }

    public String getAdminRole() {
        return "ADMIN";
    }

    // -------------------- Generate JWT token --------------------
    public String generateAdminToken(String email) {
        return jwtUtil.generateToken(email, "ADMIN");
    }

    // -------------------- Verify JWT token --------------------
    public boolean isAdmin(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[AdminService] Authorization header missing or invalid");
            return false;
        }

        String token = authHeader.substring(7).trim(); // Remove "Bearer " prefix
        try {
            String role = jwtUtil.extractRole(token);
            return "ADMIN".equalsIgnoreCase(role);
        } catch (Exception e) {
            System.out.println("[AdminService] Invalid JWT token: " + e.getMessage());
            return false;
        }
    }

    // -------------------- Register Agent --------------------
    public void registerAgent(RegisterRequest request) {
        Agent agent = new Agent();
        agent.setName(request.getName());
        agent.setEmail(request.getEmail());
        agent.setPassword(passwordEncoder.encode(request.getPassword()));
        agentRepository.save(agent);
    }

    // -------------------- Register HR --------------------
    public void registerHR(RegisterRequest request) {
        Hr hr = new Hr();
        hr.setName(request.getName());
        hr.setEmail(request.getEmail());
        hr.setPhoneNumber(request.getPhoneNumber());
        hr.setHrId(request.getHrId());
        hr.setPassword(passwordEncoder.encode(request.getPassword()));
        hrRepository.save(hr);
    }
}
