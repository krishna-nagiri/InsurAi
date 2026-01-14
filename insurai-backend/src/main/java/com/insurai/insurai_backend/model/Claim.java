package com.insurai.insurai_backend.model;

import java.time.LocalDateTime;
import java.util.List;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "claims")
public class Claim {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Claim title/type (Health, Accident, etc.)
    @Column(nullable = false)
    private String title;

    // Claim description
    @Column(length = 2000)
    private String description;

    // Claim amount
    @Column(nullable = false)
    private Double amount;

    // Claim date (incident/service date)
    @Column(nullable = false)
    private LocalDateTime claimDate;

    // Status: Pending, Approved, Rejected
    @Column(nullable = false)
    private String status = "Pending";

    // Optional remarks by HR
    @Column(length = 2000)
    private String remarks;

    // Timestamp when claim was created
    private LocalDateTime createdAt = LocalDateTime.now();

    // Timestamp when claim was last updated
    private LocalDateTime updatedAt = LocalDateTime.now();

    // Relationship to Employee
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "employee_id", nullable = false)
    private Employee employee;

    // Relationship to Policy
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id", nullable = false)
    private Policy policy;

    // Assigned HR for load-based assignment
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_hr_id")
    private Hr assignedHr;

    // Supporting documents (file paths)
    @ElementCollection
    @CollectionTable(name = "claim_documents", joinColumns = @JoinColumn(name = "claim_id"))
    @Column(name = "document_path")
    private List<String> documents;

    // Fraud detection fields
    @Column(nullable = false)
    private boolean fraudFlag = false;

    @Column(length = 2000)
    private String fraudReason;

    // Constructors
    public Claim() {}

    public Claim(String title, String description, Double amount, LocalDateTime claimDate, Employee employee, Policy policy, Hr assignedHr, List<String> documents) {
        this.title = title;
        this.description = description;
        this.amount = amount;
        this.claimDate = claimDate;
        this.employee = employee;
        this.policy = policy;
        this.assignedHr = assignedHr;
        this.documents = documents;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Double getAmount() {
        return amount;
    }

    public void setAmount(Double amount) {
        this.amount = amount;
    }

    public LocalDateTime getClaimDate() {
        return claimDate;
    }

    public void setClaimDate(LocalDateTime claimDate) {
        this.claimDate = claimDate;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getRemarks() {
        return remarks;
    }

    public void setRemarks(String remarks) {
        this.remarks = remarks;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Employee getEmployee() {
        return employee;
    }

    public void setEmployee(Employee employee) {
        this.employee = employee;
    }

    public Policy getPolicy() {
        return policy;
    }

    public void setPolicy(Policy policy) {
        this.policy = policy;
    }

    public Hr getAssignedHr() {
        return assignedHr;
    }

    public void setAssignedHr(Hr assignedHr) {
        this.assignedHr = assignedHr;
    }

    public List<String> getDocuments() {
        return documents;
    }

    public void setDocuments(List<String> documents) {
        this.documents = documents;
    }

    public boolean isFraud() {
        return fraudFlag;
    }

    public void setFraudFlag(boolean fraudFlag) {
        this.fraudFlag = fraudFlag;
    }

    public String getFraudReason() {
        return fraudReason;
    }

    public void setFraudReason(String fraudReason) {
        this.fraudReason = fraudReason;
    }
}
