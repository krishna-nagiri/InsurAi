package com.insurai.insurai_backend.controller;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.insurai_backend.config.JwtUtil;
import com.insurai.insurai_backend.model.AuditLog;
import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.LoginRequest;
import com.insurai.insurai_backend.model.RegisterRequest;
import com.insurai.insurai_backend.model.UpdateStatusRequest;
import com.insurai.insurai_backend.service.AdminService;
import com.insurai.insurai_backend.service.AuditLogService;
import com.insurai.insurai_backend.service.ClaimService;
import com.insurai.insurai_backend.service.PolicyService;
import com.insurai.insurai_backend.service.UserManagementService;

@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "http://localhost:5173") // React frontend
public class AdminController {

    @Autowired
    private AdminService adminService;

    @Autowired
    private PolicyService policyService;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private ClaimService claimService;

    @Autowired
    private AuditLogService auditLogService;
    
    @Autowired
    private UserManagementService userManagementService;

    // -------------------- Admin Login --------------------
    @PostMapping("/login")
    public ResponseEntity<?> adminLogin(@RequestBody LoginRequest loginRequest) {
        String email = loginRequest.getEmail();
        String password = loginRequest.getPassword();

        if (adminService.validateAdmin(email, password)) {
            // Generate JWT token
            String token = jwtUtil.generateToken(email, "ADMIN");
            return ResponseEntity.ok(new LoginResponse(
                    "Login successful",
                    adminService.getAdminName(email),
                    "ADMIN",
                    token
            ));
        } else {
            return ResponseEntity.status(403).body("Invalid admin credentials");
        }
    }

    // -------------------- Register Agent --------------------
    @PostMapping("/agent/register")
    public ResponseEntity<?> registerAgent(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody RegisterRequest registerRequest) {

        if (!isAdminJwt(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }

        adminService.registerAgent(registerRequest);
        return ResponseEntity.ok("Agent registered successfully");
    }

    // -------------------- Register HR --------------------
    @PostMapping("/hr/register")
    public ResponseEntity<?> registerHR(
            @RequestHeader(value = "Authorization", required = false) String authHeader,
            @RequestBody RegisterRequest registerRequest) {

        if (!isAdminJwt(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }

        adminService.registerHR(registerRequest);
        return ResponseEntity.ok("HR registered successfully");
    }

    // -------------------- Get All Claims --------------------
    @GetMapping("/claims")
    public ResponseEntity<?> getAllClaims(@RequestHeader(value = "Authorization") String authHeader) {
        try {
            if (!isAdminJwt(authHeader)) {
                return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
            }

            List<Claim> claims = claimService.getAllClaims(); // Make sure this method exists in ClaimService
            List<ClaimDTO> dtos = claims.stream()
                    .map(ClaimDTO::new)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(dtos);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching claims: " + e.getMessage());
        }
    }

    // -------------------- JWT Validation Helper --------------------
    private boolean isAdminJwt(String authHeader) {
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            String role = jwtUtil.extractRole(token);
            return "ADMIN".equalsIgnoreCase(role);
        }
        return false;
    }

// ================= Get All Fraud-Flagged Claims (Admin) =================
@GetMapping("/claims/fraud")
public ResponseEntity<?> getFraudClaimsAdmin(@RequestHeader(value = "Authorization") String authHeader) {
    try {
        if (!isAdminJwt(authHeader)) {
            return ResponseEntity.status(403).body("Access denied. Please login as Admin.");
        }

        List<Claim> claims = claimService.getAllClaims()
                .stream()
                .filter(Claim::isFraud) // only fraud-flagged
                .collect(Collectors.toList());

        List<ClaimDTO> dtos = claims.stream()
                .map(ClaimDTO::new)
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error fetching fraud claims: " + e.getMessage());
    }
}

// ================= Get All Audit Logs =================
@GetMapping("/audit/logs")
public ResponseEntity<?> getAllAuditLogs(
        @RequestHeader(value = "Authorization", required = false) String authHeader
) {
    try {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(403).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7).trim();
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        if (!"ADMIN".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Unauthorized: Not an admin");
        }

        List<AuditLog> logs = auditLogService.getAllLogs();
        return ResponseEntity.ok(logs);

    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error fetching audit logs: " + e.getMessage());
    }
}
	
	@PutMapping("/users/status")
	public ResponseEntity<?> updateUserStatus(@RequestBody UpdateStatusRequest request) 
	{
		//System.out.println("In the Update user Status mapping");
		userManagementService.updateUserStatus(request);
	    return ResponseEntity.ok("User status updated Successfully");
	}



// -------------------- Inner class for Login response --------------------
public static class LoginResponse {
    private String message;
    private String name;
    private String role;
    private String token;

    public LoginResponse(String message, String name, String role, String token) {
        this.message = message;
        this.name = name;
        this.role = role;
        this.token = token;
    }

    public String getMessage() { return message; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getToken() { return token; }
}

// -------------------- Inner class for Claim DTO --------------------
public static class ClaimDTO {
    private Long id;
    private String title;
    private String description;
    private Double amount;
    private String status;
    private String remarks;
    private java.time.LocalDateTime claimDate;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;

    private Long employeeId;
    private String employeeName;         // ✅ Added
    private Long policyId;
    private String policyName;
    private java.util.List<String> documents;
    private Long assignedHrId;
    private String assignedHrName;       // ✅ Added

    private boolean fraudFlag;           // ✅ Flag indicator
    private String fraudReason;          // ✅ Fraud reason details

    public ClaimDTO(Claim claim) {
        this.id = claim.getId();
        this.title = claim.getTitle();
        this.description = claim.getDescription();
        this.amount = claim.getAmount();
        this.status = claim.getStatus();
        this.remarks = claim.getRemarks();
        this.claimDate = claim.getClaimDate();
        this.createdAt = claim.getCreatedAt();
        this.updatedAt = claim.getUpdatedAt();

        if (claim.getEmployee() != null) {
            this.employeeId = claim.getEmployee().getId();
            this.employeeName = claim.getEmployee().getName(); // ✅ show readable employee name
        }

        if (claim.getAssignedHr() != null) {
            this.assignedHrId = claim.getAssignedHr().getId();
            this.assignedHrName = claim.getAssignedHr().getName(); // ✅ readable HR name
        }

        if (claim.getPolicy() != null) {
            this.policyId = claim.getPolicy().getId();
            this.policyName = claim.getPolicy().getPolicyName();
        } else {
            this.policyName = "N/A";
        }

        this.documents = claim.getDocuments();
        this.fraudFlag = claim.isFraud();
        this.fraudReason = claim.getFraudReason();
    }

    // -------------------- Getters --------------------
    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public Double getAmount() { return amount; }
    public String getStatus() { return status; }
    public String getRemarks() { return remarks; }
    public java.time.LocalDateTime getClaimDate() { return claimDate; }
    public java.time.LocalDateTime getCreatedAt() { return createdAt; }
    public java.time.LocalDateTime getUpdatedAt() { return updatedAt; }

    public Long getEmployeeId() { return employeeId; }
    public String getEmployeeName() { return employeeName; }     //Getter for employee name
    public Long getPolicyId() { return policyId; }
    public String getPolicyName() { return policyName; }
    public java.util.List<String> getDocuments() { return documents; }

    public Long getAssignedHrId() { return assignedHrId; }
    public String getAssignedHrName() { return assignedHrName; } // Getter for HR name

    public boolean isFraudFlag() { return fraudFlag; }
    public String getFraudReason() { return fraudReason; }
}


}
