package com.insurai.insurai_backend.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Claim;

@Service
public class FraudService {

    /**
     * Run fraud detection rules for a claim
     *
     * @param claim          Claim to evaluate
     * @param employeeClaims List of all previous claims by this employee
     */
    public void runFraudDetection(Claim claim, List<Claim> employeeClaims) {
        StringBuilder reasons = new StringBuilder();
        boolean fraud = false;

        // Convert claim date to LocalDate for easier comparison
        LocalDate claimDate = claim.getClaimDate().toLocalDate();
        LocalDate policyStart = claim.getPolicy().getStartDate();
        LocalDate policyEnd = claim.getPolicy().getRenewalDate(); // Replace with getEndDate() if available

        // 1. Duplicate claim: same policy, same amount, same date
        for (Claim c : employeeClaims) {
            if (c.getPolicy().getId().equals(claim.getPolicy().getId())
                    && c.getAmount().equals(claim.getAmount())
                    && c.getClaimDate().toLocalDate().equals(claimDate)) {
                fraud = true;
                reasons.append("Duplicate claim; ");
                break;
            }
        }

        // 2. Frequent claims: more than 3 claims in last 7 days
        long recentCount = employeeClaims.stream()
                .filter(c -> c.getCreatedAt().isAfter(LocalDateTime.now().minusDays(7)))
                .count();
        if (recentCount >= 3) {
            fraud = true;
            reasons.append("Frequent claims; ");
        }

        // 3. Invalid claim date: before policy start or after policy end/renewal
        if ((policyStart != null && claimDate.isBefore(policyStart))
                || (policyEnd != null && claimDate.isAfter(policyEnd))) {
            fraud = true;
            reasons.append("Invalid claim date; ");
        }

        // 4. Reused documents
        if (claim.getDocuments() != null) {
            boolean reused = employeeClaims.stream()
                    .filter(c -> c.getDocuments() != null)
                    .flatMap(c -> c.getDocuments().stream())
                    .anyMatch(doc -> claim.getDocuments().stream()
                            .anyMatch(d -> d.trim().equalsIgnoreCase(doc.trim())));
            if (reused) {
                fraud = true;
                reasons.append("Reused document; ");
            }
        }

        // 5. Unusual pattern / sudden spike in claim amount
        double avgAmount = employeeClaims.stream().mapToDouble(Claim::getAmount).average().orElse(0);
        if (avgAmount > 0 && claim.getAmount() > avgAmount * 3) {
            fraud = true;
            reasons.append("Unusual amount spike; ");
        }

        // 6. Same procedure repeatedly (multiple claims for same title in 30 days)
        long sameProcedureCount = employeeClaims.stream()
                .filter(c -> c.getTitle() != null 
                        && c.getTitle().equalsIgnoreCase(claim.getTitle())
                        && c.getClaimDate().isAfter(LocalDateTime.now().minusDays(30)))
                .count();
        if (sameProcedureCount >= 2) {
            fraud = true;
            reasons.append("Repeated procedure; ");
        }

        // 7. High-risk combinations (example: Life policy + minor illness)
        if (claim.getPolicy().getPolicyType() != null
                && claim.getPolicy().getPolicyType().equalsIgnoreCase("Life")
                && claim.getTitle() != null
                && claim.getTitle().equalsIgnoreCase("Minor Illness")) {
            fraud = true;
            reasons.append("High-risk combination; ");
        }

        // Set final fraud flag and reason
        claim.setFraudFlag(fraud);
        claim.setFraudReason(fraud ? reasons.toString().trim() : null);
    }
}
