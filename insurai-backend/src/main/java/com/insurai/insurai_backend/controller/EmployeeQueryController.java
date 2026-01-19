package com.insurai.insurai_backend.controller;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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

import com.insurai.insurai_backend.config.JwtUtil;
import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.model.AgentAvailability;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.EmployeeQuery;
import com.insurai.insurai_backend.repository.AgentAvailabilityRepository;
import com.insurai.insurai_backend.repository.AgentRepository;
import com.insurai.insurai_backend.repository.EmployeeRepository;
import com.insurai.insurai_backend.service.AuditLogService;
import com.insurai.insurai_backend.service.EmployeeQueryService;

@RestController
@RequestMapping("/employee")
@CrossOrigin(origins = "http://localhost:5173")
public class EmployeeQueryController {

    @Autowired
    private EmployeeQueryService queryService;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private AgentAvailabilityRepository agentAvailabilityRepository;

    @Autowired
    private JwtUtil jwtUtil;

    @Autowired
    private AuditLogService auditLogService;


// ================= Employee Submits a Query =================
@PostMapping("/queries")
public ResponseEntity<?> submitQuery(
        @RequestHeader(value = "Authorization", required = false) String authHeader,
        @RequestParam Long agentId,
        @RequestParam String queryText,
        @RequestParam String policyName,   // NEW FIELD
        @RequestParam String claimType     // NEW FIELD
) {
    try {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return ResponseEntity.status(403).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7).trim();
        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        if (!"EMPLOYEE".equalsIgnoreCase(role)) {
            return ResponseEntity.status(403).body("Unauthorized: not an employee");
        }

        Employee emp = employeeRepository.findByEmail(email).orElse(null);
        if (emp == null) {
            return ResponseEntity.status(403).body("Invalid token: employee not found");
        }

        Agent agent = agentRepository.findById(agentId).orElse(null);
        if (agent == null) {
            return ResponseEntity.badRequest().body("Invalid agent ID");
        }

        // Check agent availability
        Optional<AgentAvailability> latestAvailabilityOpt =
                agentAvailabilityRepository.findTopByAgentOrderByIdDesc(agent);

        boolean isOnline = latestAvailabilityOpt
                .map(a -> a.isAvailable() && (a.getEndTime() == null || a.getEndTime().isAfter(LocalDateTime.now())))
                .orElse(false);

        if (!isOnline) {
            return ResponseEntity.badRequest().body("Selected agent is not available");
        }

        // Submit query with policyName and claimType
        EmployeeQuery query = queryService.submitQuery(emp.getId(), agentId, queryText, policyName, claimType);

        // -------------------- Audit log --------------------
        auditLogService.logAction(
                emp.getId().toString(),
                emp.getName(),
                "EMPLOYEE",
                "SUBMIT_QUERY",
                "Submitted query to agent " + agent.getName()
        );

        return ResponseEntity.ok(query);

    } catch (Exception e) {
        return ResponseEntity.badRequest().body(e.getMessage());
    }
}


    // ================= Get all queries for logged-in employee =================
    @GetMapping("/queries")
    public ResponseEntity<?> getEmployeeQueries(
            @RequestHeader(value = "Authorization", required = false) String authHeader
    ) {
        try {
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                return ResponseEntity.status(403).body("Missing or invalid Authorization header");
            }

            String token = authHeader.substring(7).trim();
            String email = jwtUtil.extractEmail(token);
            String role = jwtUtil.extractRole(token);

            if (!"EMPLOYEE".equalsIgnoreCase(role)) {
                return ResponseEntity.status(403).body("Unauthorized: not an employee");
            }

            Employee emp = employeeRepository.findByEmail(email).orElse(null);
            if (emp == null) {
                return ResponseEntity.status(403).body("Invalid token: employee not found");
            }

            // Fetch all queries for this employee
            List<EmployeeQuery> queries = queryService.getQueriesForEmployee(emp.getId());

            // Map each query to include only relevant info including policyName and claimType
            List<Object> result = queries.stream().map(q -> {
                return new Object() {
                    public final Long id = q.getId();
                    public final String queryText = q.getQueryText();
                    public final String response = q.getResponse();
                    public final String status = q.getStatus();
                    public final String claimType = q.getClaimType();
                    public final String policyName = q.getPolicyName();
                    public final Long agentId = q.getAgent() != null ? q.getAgent().getId() : null;
                    public final String agentName = q.getAgent() != null ? q.getAgent().getName() : null;
                    public final LocalDateTime createdAt = q.getCreatedAt();
                    public final LocalDateTime updatedAt = q.getUpdatedAt();
                };
            }).collect(Collectors.toList());

            return ResponseEntity.ok(result);

        } catch (Exception e) {
            return ResponseEntity.status(500).body(e.getMessage());
        }
    }
}
