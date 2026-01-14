package com.insurai.insurai_backend.model;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "policies")
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String policyNumber; // Unique Policy ID

    @Column(nullable = false)
    private String policyName;

    @Column(nullable = false)
    private String policyType; // Health, Life, Accident, Corporate Benefit, etc.

    @Column(nullable = false)
    private String providerName;

    @Column(nullable = false)
    private Double coverageAmount;

    @Column(nullable = false)
    private Double monthlyPremium;

    @Column(nullable = false)
    private LocalDate startDate; // Policy start date

    @Column(nullable = false)
    private LocalDate renewalDate;

    @Column(nullable = false)
    private String policyStatus = "Active"; // Default Active

    @Column(columnDefinition = "TEXT")
    private String policyDescription;

    // === Uploaded document URLs ===
    private String contractUrl;   // Main Insurance Contract / Policy Document
    private String termsUrl;      // Terms & Conditions
    private String claimFormUrl;  // Claim Form template
    private String annexureUrl;   // Annexures / Riders

    // Constructors
    public Policy() {}

    public Policy(
            String policyNumber,
            String policyName,
            String policyType,
            String providerName,
            Double coverageAmount,
            Double monthlyPremium,
            LocalDate startDate,
            LocalDate renewalDate,
            String policyStatus,
            String policyDescription,
            String contractUrl,
            String termsUrl,
            String claimFormUrl,
            String annexureUrl
    ) {
        this.policyNumber = policyNumber;
        this.policyName = policyName;
        this.policyType = policyType;
        this.providerName = providerName;
        this.coverageAmount = coverageAmount;
        this.monthlyPremium = monthlyPremium;
        this.startDate = startDate;
        this.renewalDate = renewalDate;
        this.policyStatus = policyStatus;
        this.policyDescription = policyDescription;
        this.contractUrl = contractUrl;
        this.termsUrl = termsUrl;
        this.claimFormUrl = claimFormUrl;
        this.annexureUrl = annexureUrl;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPolicyNumber() { return policyNumber; }
    public void setPolicyNumber(String policyNumber) { this.policyNumber = policyNumber; }

    public String getPolicyName() { return policyName; }
    public void setPolicyName(String policyName) { this.policyName = policyName; }

    public String getPolicyType() { return policyType; }
    public void setPolicyType(String policyType) { this.policyType = policyType; }

    public String getProviderName() { return providerName; }
    public void setProviderName(String providerName) { this.providerName = providerName; }

    public Double getCoverageAmount() { return coverageAmount; }
    public void setCoverageAmount(Double coverageAmount) { this.coverageAmount = coverageAmount; }

    public Double getMonthlyPremium() { return monthlyPremium; }
    public void setMonthlyPremium(Double monthlyPremium) { this.monthlyPremium = monthlyPremium; }

    public LocalDate getStartDate() { return startDate; }
    public void setStartDate(LocalDate startDate) { this.startDate = startDate; }

    public LocalDate getRenewalDate() { return renewalDate; }
    public void setRenewalDate(LocalDate renewalDate) { this.renewalDate = renewalDate; }

    public String getPolicyStatus() { return policyStatus; }
    public void setPolicyStatus(String policyStatus) { this.policyStatus = policyStatus; }

    public String getPolicyDescription() { return policyDescription; }
    public void setPolicyDescription(String policyDescription) { this.policyDescription = policyDescription; }

    public String getContractUrl() { return contractUrl; }
    public void setContractUrl(String contractUrl) { this.contractUrl = contractUrl; }

    public String getTermsUrl() { return termsUrl; }
    public void setTermsUrl(String termsUrl) { this.termsUrl = termsUrl; }

    public String getClaimFormUrl() { return claimFormUrl; }
    public void setClaimFormUrl(String claimFormUrl) { this.claimFormUrl = claimFormUrl; }

    public String getAnnexureUrl() { return annexureUrl; }
    public void setAnnexureUrl(String annexureUrl) { this.annexureUrl = annexureUrl; }

    @Override
    public String toString() {
        return "Policy{" +
                "id=" + id +
                ", policyNumber='" + policyNumber + '\'' +
                ", policyName='" + policyName + '\'' +
                ", policyType='" + policyType + '\'' +
                ", providerName='" + providerName + '\'' +
                ", coverageAmount=" + coverageAmount +
                ", monthlyPremium=" + monthlyPremium +
                ", startDate=" + startDate +
                ", renewalDate=" + renewalDate +
                ", policyStatus='" + policyStatus + '\'' +
                ", policyDescription='" + policyDescription + '\'' +
                ", contractUrl='" + contractUrl + '\'' +
                ", termsUrl='" + termsUrl + '\'' +
                ", claimFormUrl='" + claimFormUrl + '\'' +
                ", annexureUrl='" + annexureUrl + '\'' +
                '}';
    }
}
