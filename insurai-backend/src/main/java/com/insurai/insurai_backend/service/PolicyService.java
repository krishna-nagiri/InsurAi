package com.insurai.insurai_backend.service;

import java.io.IOException;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.insurai.insurai_backend.model.Policy;
import com.insurai.insurai_backend.repository.PolicyRepository;

@Service
public class PolicyService {

    private final PolicyRepository policyRepository;
    private final SupabaseStorageService supabaseStorageService;

    @Autowired
    public PolicyService(PolicyRepository policyRepository,
                         SupabaseStorageService supabaseStorageService) {
        this.policyRepository = policyRepository;
        this.supabaseStorageService = supabaseStorageService;
    }

    // -------------------- Create a new policy --------------------
    public Policy createPolicy(Policy policy) {
        return policyRepository.save(policy);
    }

    // -------------------- Get all policies --------------------
    public List<Policy> getAllPolicies() {
        return policyRepository.findAll();
    }

    // -------------------- Get policy by ID --------------------
    public Optional<Policy> getPolicyById(Long id) {
        return policyRepository.findById(id);
    }

    // -------------------- Get active policies --------------------
    public List<Policy> getActivePolicies() {
        return policyRepository.findByPolicyStatus("Active");
    }

    // -------------------- Update a policy --------------------
    public Policy updatePolicy(Long id, Policy updatedPolicy) {
        return policyRepository.findById(id).map(policy -> {
            policy.setPolicyNumber(updatedPolicy.getPolicyNumber());
            policy.setPolicyName(updatedPolicy.getPolicyName());
            policy.setPolicyType(updatedPolicy.getPolicyType());
            policy.setProviderName(updatedPolicy.getProviderName());
            policy.setCoverageAmount(updatedPolicy.getCoverageAmount());
            policy.setMonthlyPremium(updatedPolicy.getMonthlyPremium());
            policy.setStartDate(updatedPolicy.getStartDate());
            policy.setRenewalDate(updatedPolicy.getRenewalDate());
            policy.setPolicyStatus(updatedPolicy.getPolicyStatus());
            policy.setPolicyDescription(updatedPolicy.getPolicyDescription());
            return policyRepository.save(policy);
        }).orElseThrow(() -> new RuntimeException("Policy not found with id " + id));
    }

    // -------------------- Delete a policy --------------------
    public void deletePolicy(Long id) {
        policyRepository.deleteById(id);
    }

    // ==========================================================
    // NEW SAFE METHOD — TRANSACTIONAL
    // ==========================================================
    @Transactional
    public Policy createPolicyWithDocuments(
            Policy policy,
            MultipartFile contract,
            MultipartFile terms,
            MultipartFile claimForm,
            MultipartFile annexure
    ) {
        try {
            // Step 1: Save policy to generate ID
            Policy savedPolicy = policyRepository.save(policy);
            Long id = savedPolicy.getId();

            // Step 2: Upload files
            if (contract != null && !contract.isEmpty()) {
                String contractUrl = uploadFileToStorage(contract, "contract", id);
                savedPolicy.setContractUrl(contractUrl);
            }

            if (terms != null && !terms.isEmpty()) {
                String termsUrl = uploadFileToStorage(terms, "terms", id);
                savedPolicy.setTermsUrl(termsUrl);
            }

            if (claimForm != null && !claimForm.isEmpty()) {
                String claimFormUrl = uploadFileToStorage(claimForm, "claim_form", id);
                savedPolicy.setClaimFormUrl(claimFormUrl);
            }

            if (annexure != null && !annexure.isEmpty()) {
                String annexureUrl = uploadFileToStorage(annexure, "annexure", id);
                savedPolicy.setAnnexureUrl(annexureUrl);
            }

            // Step 3: Save again with URLs
            return policyRepository.save(savedPolicy);

        } catch (Exception e) {
            throw new RuntimeException("Policy creation failed. Rolled back.", e);
        }
    }

    // -------------------- Upload Documents (old method kept) --------------------
    public Policy uploadDocuments(Long id,
                                  MultipartFile contract,
                                  MultipartFile terms,
                                  MultipartFile claimForm,
                                  MultipartFile annexure) {
        Policy policy = policyRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Policy not found with id " + id));

        try {
            if (contract != null && !contract.isEmpty()) {
                String contractUrl = uploadFileToStorage(contract, "contract", id);
                policy.setContractUrl(contractUrl);
            }

            if (terms != null && !terms.isEmpty()) {
                String termsUrl = uploadFileToStorage(terms, "terms", id);
                policy.setTermsUrl(termsUrl);
            }

            if (claimForm != null && !claimForm.isEmpty()) {
                String claimFormUrl = uploadFileToStorage(claimForm, "claim_form", id);
                policy.setClaimFormUrl(claimFormUrl);
            }

            if (annexure != null && !annexure.isEmpty()) {
                String annexureUrl = uploadFileToStorage(annexure, "annexure", id);
                policy.setAnnexureUrl(annexureUrl);
            }

            return policyRepository.save(policy);

        } catch (Exception e) {
            throw new RuntimeException("Failed to upload policy documents: " + e.getMessage(), e);
        }
    }

    // -------------------- Helper: Upload file to Supabase and return URL --------------------
    private String uploadFileToStorage(MultipartFile file, String type, Long policyId) throws IOException {
        String originalFileName = file.getOriginalFilename();
        String extension = getExtension(originalFileName);
        String fileName = "policies/" + policyId + "/" + type + "_" + System.currentTimeMillis() + extension;
        return supabaseStorageService.uploadFile(file, fileName);
    }

    // -------------------- Helper: Get file extension --------------------
    private String getExtension(String fileName) {
        if (fileName != null && fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf("."));
        }
        return "";
    }
}
