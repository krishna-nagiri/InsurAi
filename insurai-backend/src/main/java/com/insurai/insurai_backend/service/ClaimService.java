package com.insurai.insurai_backend.service;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.Hr;
import com.insurai.insurai_backend.repository.ClaimRepository;

@Service
public class ClaimService {

    @Autowired
    private ClaimRepository claimRepository;

    @Autowired
    private HrService hrService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private FraudService fraudService;

    @Autowired
    private InAppNotificationService inAppNotificationService; // ✅ Added InAppNotificationService

    /**
     * Submit a new claim with automatic HR assignment
     */
    public Claim submitClaim(Claim claim) throws Exception {
        if (claim.getAmount() > claim.getPolicy().getCoverageAmount()) {
            throw new Exception("Claim amount exceeds policy coverage!");
        }

        claim.setStatus("Pending");
        claim.setCreatedAt(LocalDateTime.now());
        claim.setUpdatedAt(LocalDateTime.now());

        if (claim.getClaimDate() == null) {
            claim.setClaimDate(LocalDateTime.now());
        }

        // Fraud detection
        try {
            if (claim.getEmployee() != null && claim.getPolicy() != null) {
                List<Claim> employeeClaims = claimRepository.findByEmployee(claim.getEmployee());
                fraudService.runFraudDetection(claim, employeeClaims);
            } else {
                claim.setFraudFlag(false);
                claim.setFraudReason(null);
            }
        } catch (Exception e) {
            System.err.println("⚠️ Fraud detection failed: " + e.getMessage());
            claim.setFraudFlag(false);
            claim.setFraudReason(null);
        }

        // Automatic HR assignment
        List<Hr> activeHrs = hrService.getAllActiveHrs();
        Hr selectedHr = null;
        if (!activeHrs.isEmpty()) {
            selectedHr = activeHrs.stream()
                    .min(Comparator.comparingInt(this::getPendingClaimCount))
                    .orElse(null);
            claim.setAssignedHr(selectedHr);
        }

        // Save claim
        Claim savedClaim = claimRepository.save(claim);

        // Send email notification to employee
        try {
            notificationService.sendClaimStatusEmail(savedClaim.getEmployee().getEmail(), savedClaim);
        } catch (Exception e) {
            System.err.println("⚠️ Failed to send claim submission email to employee: " + e.getMessage());
        }

        // Send in-app notification to employee
        inAppNotificationService.createNotification(
                "Claim Submitted",
                "Your claim #" + savedClaim.getId() + " has been submitted.",
                savedClaim.getEmployee().getId(),
                "EMPLOYEE",
                "CLAIM"
        );

        // Send email notification to assigned HR
        if (selectedHr != null && selectedHr.getEmail() != null) {
            try {
                notificationService.sendNewClaimAssignedToHr(selectedHr.getEmail(), selectedHr, savedClaim);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send claim assignment email to HR: " + e.getMessage());
            }
        }

        // Send in-app notification to assigned HR
        if (selectedHr != null) {
            inAppNotificationService.createNotification(
                    "New Claim Assigned",
                    "A new claim #" + savedClaim.getId() + " has been assigned to you.",
                    selectedHr.getId(),
                    "HR",
                    "CLAIM"
            );
        }

        return savedClaim;
    }

    private int getPendingClaimCount(Hr hr) {
        return claimRepository.countByAssignedHrAndStatus(hr, "Pending");
    }

    public List<Claim> getClaimsByEmployee(Employee employee) {
        return claimRepository.findByEmployee(employee);
    }

    public List<Claim> getClaimsByEmployeeId(String employeeId) {
        return claimRepository.findByEmployee_EmployeeId(employeeId);
    }

    public List<Claim> getAllClaims() {
        return claimRepository.findAll();
    }

    /**
     * Approve a claim and send professional email + in-app notification
     */
    public Claim approveClaim(Long claimId, String remarks) throws Exception {
        Claim claim = claimRepository.findByIdWithEmployee(claimId)
                .orElseThrow(() -> new Exception("Claim not found"));

        claim.setStatus("Approved");
        claim.setRemarks(remarks);
        claim.setUpdatedAt(LocalDateTime.now());
        Claim updatedClaim = claimRepository.save(claim);

        // Email notification
        if (updatedClaim.getEmployee() != null && updatedClaim.getEmployee().getEmail() != null) {
            try {
                notificationService.sendClaimStatusEmail(updatedClaim.getEmployee().getEmail(), updatedClaim);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send claim approval email: " + e.getMessage());
            }
        }

        // In-app notification
        inAppNotificationService.createClaimApprovedNotification(updatedClaim);

        return updatedClaim;
    }

    /**
     * Reject a claim and send professional email + in-app notification
     */
    public Claim rejectClaim(Long claimId, String remarks) throws Exception {
        Claim claim = claimRepository.findByIdWithEmployee(claimId)
                .orElseThrow(() -> new Exception("Claim not found"));

        claim.setStatus("Rejected");
        claim.setRemarks(remarks);
        claim.setUpdatedAt(LocalDateTime.now());
        Claim updatedClaim = claimRepository.save(claim);

        // Email notification
        if (updatedClaim.getEmployee() != null && updatedClaim.getEmployee().getEmail() != null) {
            try {
                notificationService.sendClaimStatusEmail(updatedClaim.getEmployee().getEmail(), updatedClaim);
            } catch (Exception e) {
                System.err.println("⚠️ Failed to send claim rejection email: " + e.getMessage());
            }
        }

        // In-app notification
        inAppNotificationService.createClaimRejectedNotification(updatedClaim);

        return updatedClaim;
    }

    public List<Claim> getClaimsByStatus(String status) {
        return claimRepository.findByStatus(status);
    }

    public List<Claim> getClaimsByEmployeeAndStatus(Employee employee, String status) {
        return claimRepository.findByEmployeeAndStatus(employee, status);
    }

    public List<Claim> getClaimsByEmployeeIdAndStatus(String employeeId, String status) {
        return claimRepository.findByEmployee_EmployeeIdAndStatus(employeeId, status);
    }

    public List<Claim> getClaimsByAssignedHr(Long hrId) {
        return claimRepository.findByAssignedHrId(hrId);
    }

    public Claim getClaimById(Long claimId) {
        return claimRepository.findById(claimId).orElse(null);
    }

    public Claim updateClaim(Claim claim) throws Exception {
        if (claim.getAmount() > claim.getPolicy().getCoverageAmount()) {
            throw new Exception("Claim amount exceeds policy coverage!");
        }

        claim.setUpdatedAt(LocalDateTime.now());
        return claimRepository.save(claim);
    }

    public List<Claim> getAllClaimsForAdmin() {
        return claimRepository.findAll();
    }

    public List<Claim> getFraudClaimsByAssignedHr(Long hrId) {
        return claimRepository.findByAssignedHrIdAndFraudFlag(hrId, true);
    }
}
