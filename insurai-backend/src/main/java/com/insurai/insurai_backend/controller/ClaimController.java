package com.insurai.insurai_backend.controller;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.insurai.insurai_backend.config.JwtUtil;
import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.Policy;
import com.insurai.insurai_backend.repository.EmployeeRepository;
import com.insurai.insurai_backend.repository.PolicyRepository;
import com.insurai.insurai_backend.service.AuditLogService;
import com.insurai.insurai_backend.service.ClaimService;

@RestController
@RequestMapping("/employee/claims")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ClaimController {

    @Autowired
    private ClaimService claimService;

    @Autowired
    private PolicyRepository policyRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private JwtUtil jwtUtil;

   @Autowired
    private AuditLogService auditLogService;

    private final String uploadDir = "C:/Users/Jeevan/Documents/InsurAi/insurai-backend/uploads/";

// -------------------- Submit Claim --------------------
@PostMapping("")
public ResponseEntity<?> submitClaim(
        @RequestHeader(value = "Authorization", required = false) String authHeader,
        @RequestParam Long policyId,
        @RequestParam String title,
        @RequestParam String description,
        @RequestParam Double amount,
        @RequestParam String date,
        @RequestParam(required = false) List<MultipartFile> documents
) {
    try {
        // Validate token
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(403).body("Unauthorized: Missing token");
        }
        String token = authHeader.substring(7).trim();
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);
        if (!"EMPLOYEE".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Unauthorized: Not an employee");
        }

        Employee employee = employeeRepository.findByEmail(email).orElse(null);
        if (employee == null) {
            return ResponseEntity.status(403).body("Unauthorized: Invalid token");
        }

        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        // Handle document uploads safely
        List<String> documentPaths = (documents != null) ?
                documents.stream().map(file -> storeFile(file)).collect(Collectors.toList())
                : List.of();

        LocalDateTime claimDate = LocalDateTime.parse(date + "T00:00:00");

        Claim claim = new Claim(title, description, amount, claimDate, employee, policy, null, documentPaths);

        Claim savedClaim = claimService.submitClaim(claim);

        // ✅ Audit log for claim submission
        auditLogService.logAction(
                employee.getId().toString(),
                employee.getName(),
                "EMPLOYEE",
                "SUBMIT_CLAIM",
                "Submitted claim for policy ID: " + policyId
        );

        return ResponseEntity.ok(new ClaimDTO(savedClaim));

    } catch (Exception e) {
        return ResponseEntity.status(400).body("Error submitting claim: " + e.getMessage());
    }
}

// -------------------- Update Claim --------------------
@PostMapping("/update")
public ResponseEntity<?> updateClaim(
        @RequestHeader(value = "Authorization", required = false) String authHeader,
        @RequestParam Long claimId,
        @RequestParam Long policyId,
        @RequestParam String title,
        @RequestParam String description,
        @RequestParam Double amount,
        @RequestParam String date,
        @RequestParam(required = false) List<MultipartFile> documents
) {
    try {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(403).body("Unauthorized: Missing token");
        }

        String token = authHeader.substring(7).trim();
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);
        if (!"EMPLOYEE".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Unauthorized: Not an employee");
        }

        Employee employee = employeeRepository.findByEmail(email).orElse(null);
        if (employee == null) {
            return ResponseEntity.status(403).body("Unauthorized: Invalid token");
        }

        Claim claim = claimService.getClaimById(claimId);
        if (claim == null || !claim.getEmployee().getId().equals(employee.getId())) {
            return ResponseEntity.status(403).body("Unauthorized: Cannot edit this claim");
        }

        Policy policy = policyRepository.findById(policyId)
                .orElseThrow(() -> new RuntimeException("Policy not found"));

        claim.setTitle(title);
        claim.setDescription(description);
        claim.setAmount(amount);
        claim.setClaimDate(LocalDateTime.parse(date + "T00:00:00"));
        claim.setPolicy(policy);

        if (documents != null && !documents.isEmpty()) {
            List<String> documentPaths = documents.stream()
                    .map(file -> storeFile(file))
                    .collect(Collectors.toList());
            claim.getDocuments().addAll(documentPaths);
        }

        Claim updatedClaim = claimService.updateClaim(claim);

        // ✅ Audit log for claim update
        auditLogService.logAction(
                employee.getId().toString(),
                employee.getName(),
                "EMPLOYEE",
                "UPDATE_CLAIM",
                "Updated claim ID: " + claimId + " for policy ID: " + policyId
        );

        return ResponseEntity.ok(new ClaimDTO(updatedClaim));

    } catch (Exception e) {
        return ResponseEntity.status(400).body("Error updating claim: " + e.getMessage());
    }
}


// -------------------- Get Employee Claims --------------------
@GetMapping("")
public ResponseEntity<?> getEmployeeClaims(
        @RequestHeader(value = "Authorization", required = false) String authHeader
) {
    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
        return ResponseEntity.status(403).body("Missing or invalid Authorization header");
    }

    String token = authHeader.substring(7).trim();
    String email = jwtUtil.extractEmail(token);
    String role = jwtUtil.extractRole(token);

    if (!"EMPLOYEE".equalsIgnoreCase(role)) {
        return ResponseEntity.status(403).body("Access denied: Not an employee");
    }

    Employee employee = employeeRepository.findByEmail(email).orElse(null);
    if (employee == null) {
        return ResponseEntity.status(403).body("Invalid token: employee not found");
    }

    List<Claim> claims = claimService.getClaimsByEmployee(employee);
    List<ClaimDTO> claimDTOs = claims.stream().map(ClaimDTO::new).collect(Collectors.toList());

    // -------------------- Audit Log --------------------
    auditLogService.logAction(
            employee.getId().toString(),
            employee.getName(),
            "EMPLOYEE",
            "VIEW_CLAIMS",
            "Fetched all claims for employee"
    );

    return ResponseEntity.ok(claimDTOs);
}


    // -------------------- Get All Claims (for admin) --------------------
    @GetMapping("/all")
    public ResponseEntity<?> getAllClaims() {
        try {
            List<Claim> claims = claimService.getAllClaims();
            List<ClaimDTO> claimDTOs = claims.stream().map(ClaimDTO::new).collect(Collectors.toList());
            return ResponseEntity.ok(claimDTOs);
        } catch (Exception e) {
            return ResponseEntity.status(400).body("Error fetching all claims: " + e.getMessage());
        }
    }

    // -------------------- Helper: Store file safely --------------------
    private String storeFile(MultipartFile file) {
        try {
            String uniqueName = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path filePath = Paths.get(uploadDir + uniqueName);
            Files.createDirectories(filePath.getParent());
            Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
            return "/uploads/" + uniqueName;
        } catch (IOException e) {
            throw new RuntimeException("Failed to store file " + file.getOriginalFilename(), e);
        }
    }

    // -------------------- Claim DTO --------------------
    public static class ClaimDTO {
        private Long id;
        private String title;
        private String description;
        private Double amount;
        private String status;
        private String remarks;
        private LocalDateTime claimDate;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private Long employeeId;
        private Long policyId;
        private List<String> documents;
        private Long assignedHrId;

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
            this.employeeId = (claim.getEmployee() != null) ? claim.getEmployee().getId() : null;
            this.policyId = (claim.getPolicy() != null) ? claim.getPolicy().getId() : null;
            this.documents = claim.getDocuments();
            this.assignedHrId = (claim.getAssignedHr() != null) ? claim.getAssignedHr().getId() : null;
        }

        // Getters
        public Long getId() { return id; }
        public String getTitle() { return title; }
        public String getDescription() { return description; }
        public Double getAmount() { return amount; }
        public String getStatus() { return status; }
        public String getRemarks() { return remarks; }
        public LocalDateTime getClaimDate() { return claimDate; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public LocalDateTime getUpdatedAt() { return updatedAt; }
        public Long getEmployeeId() { return employeeId; }
        public Long getPolicyId() { return policyId; }
        public List<String> getDocuments() { return documents; }
        public Long getAssignedHrId() { return assignedHrId; }
    }
}
