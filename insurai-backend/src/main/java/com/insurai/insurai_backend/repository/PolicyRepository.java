package com.insurai.insurai_backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurai.insurai_backend.model.Policy;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, Long> {

    // Find all active policies
    List<Policy> findByPolicyStatus(String policyStatus);

    // Find policies by type
    List<Policy> findByPolicyType(String policyType);

    // Find policies by provider
    List<Policy> findByProviderName(String providerName);
}
