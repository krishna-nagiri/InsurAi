package com.insurai.insurai_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.insurai.insurai_backend.model.Policy;
import com.insurai.insurai_backend.service.AdminService;
import com.insurai.insurai_backend.service.PolicyService;

@RestController
@RequestMapping("/admin/policies")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class PolicyController {

    private final PolicyService policyService;
    private final AdminService adminService;
    private final ObjectMapper objectMapper;

    @Autowired
    public PolicyController(PolicyService policyService, AdminService adminService, ObjectMapper objectMapper) {
        this.policyService = policyService;
        this.adminService = adminService;
        this.objectMapper = objectMapper;

        // Register JavaTimeModule to properly handle LocalDate
        this.objectMapper.registerModule(new JavaTimeModule());
        this.objectMapper.disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);
    }

    // -------------------- Create or Update a policy with documents --------------------
    @PostMapping
    public ResponseEntity<?> savePolicyWithDocuments(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestPart("policy") String policyJson, // receive JSON as string
            @RequestPart(value = "contract", required = false) MultipartFile contract,
            @RequestPart(value = "terms", required = false) MultipartFile terms,
            @RequestPart(value = "claimForm", required = false) MultipartFile claimForm,
            @RequestPart(value = "annexure", required = false) MultipartFile annexure
    ) {
        if (!adminService.isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }

        try {
            // Deserialize JSON string into Policy object
            Policy policy = objectMapper.readValue(policyJson, Policy.class);
            Policy savedPolicy;

            if (policy.getId() != null) {
                // Update existing policy
                savedPolicy = policyService.updatePolicy(policy.getId(), policy);
            } else {
                // Create new policy
                savedPolicy = policyService.createPolicy(policy);
            }

            // Upload documents if provided
            if (contract != null || terms != null || claimForm != null || annexure != null) {
                savedPolicy = policyService.uploadDocuments(
                        savedPolicy.getId(),
                        contract,
                        terms,
                        claimForm,
                        annexure
                );
            }

            return ResponseEntity.ok(savedPolicy);

        } catch (Exception e) {
            e.printStackTrace(); // log full exception for debugging
            return ResponseEntity.status(500).body("Failed to save policy or upload documents: " + e.getMessage());
        }
    }

    // -------------------- Get all policies --------------------
    @GetMapping
    public ResponseEntity<?> getAllPolicies(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!adminService.isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }
        List<Policy> policies = policyService.getAllPolicies();
        return ResponseEntity.ok(policies);
    }

    // -------------------- Get active policies --------------------
    @GetMapping("/active")
    public ResponseEntity<?> getActivePolicies(@RequestHeader(value = "Authorization", required = false) String authHeader) {
        if (!adminService.isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }
        List<Policy> activePolicies = policyService.getActivePolicies();
        return ResponseEntity.ok(activePolicies);
    }

    // -------------------- Get policy by ID --------------------
    @GetMapping("/{id}")
    public ResponseEntity<?> getPolicyById(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        if (!adminService.isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }
        Policy policy = policyService.getPolicyById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found with id " + id));
        return ResponseEntity.ok(policy);
    }

    // -------------------- Delete policy --------------------
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePolicy(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @PathVariable Long id
    ) {
        if (!adminService.isAdmin(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }
        policyService.deletePolicy(id);
        return ResponseEntity.noContent().build();
    }
}
