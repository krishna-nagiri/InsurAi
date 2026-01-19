package com.insurai.insurai_backend.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.insurai.insurai_backend.model.Policy;
import com.insurai.insurai_backend.service.PolicyService;

@RestController
@RequestMapping("/employee")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class EmployeeController {

    private final PolicyService policyService;

    @Autowired
    public EmployeeController(PolicyService policyService) {
        this.policyService = policyService;
    }

    // -------------------- Get all active policies --------------------
    @GetMapping("/policies")
    public ResponseEntity<List<Policy>> getEmployeePolicies() {
        List<Policy> policies = policyService.getActivePolicies(); // fetch from DB
        return ResponseEntity.ok(policies);
    }
}
