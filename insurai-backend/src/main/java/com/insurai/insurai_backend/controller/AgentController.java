package com.insurai.insurai_backend.controller;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
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
import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.model.AgentAvailability;
import com.insurai.insurai_backend.model.EmployeeQuery;
import com.insurai.insurai_backend.service.AgentAvailabilityService;
import com.insurai.insurai_backend.service.AgentService;
import com.insurai.insurai_backend.service.AuditLogService;
import com.insurai.insurai_backend.service.EmployeeQueryService;

import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@RestController
@RequestMapping("/agent")
@CrossOrigin(origins = "http://localhost:5173")
public class AgentController {

    private final AgentService agentService;
    private final AgentAvailabilityService availabilityService;
    private final EmployeeQueryService queryService;
    private final JwtUtil jwtUtil;  
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();
    private final AuditLogService auditLogService;

    // -------------------- Get all agents --------------------
    @GetMapping
    public ResponseEntity<List<Agent>> getAllAgents() {
        try {
            return ResponseEntity.ok(agentService.getAllAgents());
        } catch (Exception e) {
            return ResponseEntity.badRequest().build();
        }
    }

 // -------------------- Register a new agent --------------------
@PostMapping("/register")
public ResponseEntity<?> registerAgent(@RequestBody Agent agent) {
    try {
        // Encode password before saving
        agent.setPassword(passwordEncoder.encode(agent.getPassword()));
        
        // Save the agent
        Agent savedAgent = agentService.registerAgent(agent);

        // Log the registration action
        auditLogService.logAction(
            savedAgent.getId().toString(),
            savedAgent.getName(),
            "AGENT",
            "REGISTER",
            "New agent registered"
        );

        return ResponseEntity.ok(savedAgent);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body("Error registering agent: " + e.getMessage());
    }
}


    // -------------------- Agent login --------------------
    @PostMapping("/login")
    public ResponseEntity<?> loginAgent(@RequestBody Agent loginRequest) {
        try {
            Agent agent = agentService.findByEmail(loginRequest.getEmail())
                    .orElseThrow(() -> new RuntimeException("Agent not found"));

            if (!passwordEncoder.matches(loginRequest.getPassword(), agent.getPassword())) {
                return ResponseEntity.status(401).body("Invalid password");
            }

            String token = jwtUtil.generateToken(agent.getEmail(), "AGENT");

            // ✅ Audit log for successful login
            auditLogService.logAction(
                    agent.getId().toString(),
                    agent.getName(),
                    "AGENT",
                    "LOGIN",
                    "Agent logged in"
            );

            AgentLoginResponse response = new AgentLoginResponse(
                    "Login successful",
                    agent.getId(),
                    agent.getName(),
                    "agent",
                    token
            );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {
            return ResponseEntity.status(404).body(e.getMessage());
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Server error: " + e.getMessage());
        }
    }

    // -------------------- Save or schedule availability --------------------
    @PostMapping("/availability")
    public ResponseEntity<?> setAvailability(@RequestBody AvailabilityRequest request) {
        try {
            if (request.getAgentId() == null) {
                return ResponseEntity.badRequest().body("Agent ID is required");
            }

            AgentAvailability saved = availabilityService.setAvailability(
                    request.getAgentId(),
                    request.isAvailable(),
                    request.getStartTime(),
                    request.getEndTime()
            );

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Error saving availability: " + e.getMessage());
        }
    }

    // -------------------- Get latest availability --------------------
    @GetMapping("/{id}/availability")
    public ResponseEntity<?> getAvailability(@PathVariable Long id) {
        return availabilityService.getAvailability(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // -------------------- Get all agents' latest availability --------------------
    @GetMapping("/availability/all")
    public ResponseEntity<?> getAllAgentsAvailability() {
        try {
            List<AgentAvailability> allAvailability = availabilityService.getAllLatestAvailability();
            return ResponseEntity.ok(allAvailability);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching agents availability: " + e.getMessage());
        }
    }

    // -------------------- Get only online agents --------------------
    @GetMapping("/available")
    public ResponseEntity<List<Agent>> getOnlineAgents() {
        try {
            List<Agent> onlineAgents = agentService.getAllAgents().stream()
                    .filter(agent -> availabilityService.getAvailability(agent.getId())
                            .map(AgentAvailability::isAvailable)
                            .orElse(false))
                    .toList();
            return ResponseEntity.ok(onlineAgents);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(null);
        }
    }

    // -------------------- Get pending queries for a specific agent --------------------
    @GetMapping("/queries/pending/{agentId}")
    public ResponseEntity<?> getPendingQueriesForAgent(@PathVariable Long agentId) {
        List<EmployeeQuery> pendingQueries = queryService.getPendingQueriesForAgent(agentId);
        return ResponseEntity.ok(pendingQueries);
    }

// -------------------- Respond to a query with full debug logs --------------------
@PutMapping("/queries/respond/{queryId}")  // debug logs.
public ResponseEntity<?> respondToQuery(
        @PathVariable Long queryId,
        @RequestBody RespondQueryRequest request,
        @RequestHeader(value = "Authorization", required = false) String authHeader
) {
    System.out.println("\n=== [DEBUG] respondToQuery CALLED ===");
    System.out.println("QueryId: " + queryId);
    System.out.println("Request body response: " + (request != null ? request.getResponse() : "null"));
    System.out.println("Authorization header received: " + authHeader);

    try {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            System.out.println("[DEBUG] Missing or invalid Authorization header");
            return ResponseEntity.status(403).body("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7).trim();
        System.out.println("[DEBUG] Extracted token: " + token);

        String email = jwtUtil.extractEmail(token);
        String role = jwtUtil.extractRole(token);

        System.out.println("[DEBUG] Extracted email: " + email + ", role: " + role);

        if (email == null || role == null || !"AGENT".equalsIgnoreCase(role)) {
            System.out.println("[DEBUG] Role check failed. Required: AGENT, Found: " + role);
            return ResponseEntity.status(403).body("Unauthorized: not an agent");
        }

        Agent agent = agentService.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        System.out.println("[DEBUG] Agent found: " + agent.getId());

        // ✅ Let service handle the DB update and email
        EmployeeQuery updatedQuery = queryService.respondToQuery(agent.getId(), queryId, request.getResponse());
        System.out.println("[DEBUG] QueryService.respondToQuery() executed.");

        // ✅ Log the response action in audit logs
        auditLogService.logAction(
                agent.getId().toString(),
                agent.getName(),
                "AGENT",
                "RESPOND_QUERY",
                "Responded to query ID: " + queryId
        );

        // ✅ Verify the status was updated in DB
        EmployeeQuery verified = queryService.findById(queryId)
                .orElseThrow(() -> new RuntimeException("Query not found after update"));

        System.out.println("[DEBUG] Post-update DB verification -> Status: " + verified.getStatus());

        EmployeeQueryDTO dto = new EmployeeQueryDTO(
                verified.getId(),
                verified.getQueryText(),
                verified.getResponse(),
                verified.getStatus(),
                verified.getCreatedAt(),
                verified.getUpdatedAt(),
                verified.getEmployee() != null ? verified.getEmployee().getId() : null,
                verified.getAgent() != null ? verified.getAgent().getId() : null,
                verified.getPolicyName(),
                verified.getClaimType()
        );

        System.out.println("=== [DEBUG] respondToQuery COMPLETED SUCCESSFULLY ===\n");
        return ResponseEntity.ok(dto);

    } catch (RuntimeException e) {
        System.out.println("[DEBUG] RuntimeException: " + e.getMessage());
        return ResponseEntity.status(404).body(e.getMessage());
    } catch (Exception e) {
        System.out.println("[DEBUG] Exception: " + e.getMessage());
        e.printStackTrace();
        return ResponseEntity.status(500).body("Error updating query: " + e.getMessage());
    }
}


// -------------------- Get all queries (pending + resolved) for a specific agent --------------------
@GetMapping("/queries/all/{agentId}")
public ResponseEntity<?> getAllQueriesForAgent(@PathVariable Long agentId) {
    try {
        List<EmployeeQuery> allQueries = queryService.getAllQueriesForAgent(agentId);

        List<EmployeeQueryDTO> dtoList = allQueries.stream().map(q -> new EmployeeQueryDTO(
                q.getId(),
                q.getQueryText(),
                q.getResponse(),
                q.getStatus(),
                q.getCreatedAt(),
                q.getUpdatedAt(),
                q.getEmployee() != null ? q.getEmployee().getId() : null,
                q.getAgent() != null ? q.getAgent().getId() : null,
                q.getPolicyName(),  // included
                q.getClaimType()    // included
        )).toList();

        return ResponseEntity.ok(dtoList);
    } catch (Exception e) {
        return ResponseEntity.status(500).body("Error fetching queries: " + e.getMessage());
    }
}

// -------------------- Inner class for Agent login response --------------------
public static class AgentLoginResponse {
    private String message;
    private Long agentId;
    private String name;
    private String role;
    private String token;

    public AgentLoginResponse(String message, Long agentId, String name, String role, String token) {
        this.message = message;
        this.agentId = agentId;
        this.name = name;
        this.role = role;
        this.token = token;
    }

    public String getMessage() { return message; }
    public Long getAgentId() { return agentId; }
    public String getName() { return name; }
    public String getRole() { return role; }
    public String getToken() { return token; }
}

// -------------------- DTO for availability requests --------------------
public static class AvailabilityRequest {
    private Long agentId;
    private boolean available;
    private LocalDateTime startTime;
    private LocalDateTime endTime;

    public Long getAgentId() { return agentId; }
    public void setAgentId(Long agentId) { this.agentId = agentId; }

    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }

    public LocalDateTime getStartTime() { return startTime; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }

    public LocalDateTime getEndTime() { return endTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
}

// -------------------- DTO for responding to a query --------------------
public static class RespondQueryRequest {
    private String response;

    public String getResponse() { return response; }
    public void setResponse(String response) { this.response = response; }
}

// -------------------- DTO for cleaned query response --------------------
public static class EmployeeQueryDTO {
    private Long id;
    private String queryText;
    private String response;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Long employeeId;
    private Long agentId;
    private String policyName;   // included
    private String claimType;    // included

    public EmployeeQueryDTO(Long id, String queryText, String response, String status,
                            LocalDateTime createdAt, LocalDateTime updatedAt,
                            Long employeeId, Long agentId,
                            String policyName, String claimType) {
        this.id = id;
        this.queryText = queryText;
        this.response = response;
        this.status = status;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
        this.employeeId = employeeId;
        this.agentId = agentId;
        this.policyName = policyName;
        this.claimType = claimType;
    }

    public Long getId() { return id; }
    public String getQueryText() { return queryText; }
    public String getResponse() { return response; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public Long getEmployeeId() { return employeeId; }
    public Long getAgentId() { return agentId; }
    public String getPolicyName() { return policyName; }
    public String getClaimType() { return claimType; }
}


}
