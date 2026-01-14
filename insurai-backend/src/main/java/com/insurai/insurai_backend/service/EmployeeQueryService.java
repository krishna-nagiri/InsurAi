package com.insurai.insurai_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.EmployeeQuery;
import com.insurai.insurai_backend.repository.AgentRepository;
import com.insurai.insurai_backend.repository.EmployeeQueryRepository;
import com.insurai.insurai_backend.repository.EmployeeRepository;

@Service
public class EmployeeQueryService {

    @Autowired
    private EmployeeQueryRepository queryRepository;

    @Autowired
    private EmployeeRepository employeeRepository;

    @Autowired
    private AgentRepository agentRepository;

    @Autowired
    private NotificationService notificationService;

    // -------------------- Submit a new query --------------------
    @Transactional
    public EmployeeQuery submitQuery(Long employeeId, Long agentId, String queryText, String policyName, String claimType) throws Exception {
        Employee employee = employeeRepository.findById(employeeId)
                .orElseThrow(() -> new Exception("Employee not found"));

        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new Exception("Agent not found"));

        if (!agent.isAvailable()) {
            throw new Exception("Selected agent is not available");
        }

        EmployeeQuery query = new EmployeeQuery();
        query.setEmployee(employee);
        query.setAgent(agent);
        query.setQueryText(queryText);
        query.setStatus("pending");
        query.setPolicyName(policyName);
        query.setClaimType(claimType);

        EmployeeQuery savedQuery = queryRepository.saveAndFlush(query);

        // Notify agent
        try {
            if (agent.getEmail() != null) {
                notificationService.sendEmployeeQueryNotificationToAgent(agent.getEmail(), savedQuery);
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send query notification to agent: " + e.getMessage());
        }

        return savedQuery;
    }

    // -------------------- Respond to a query (agent) --------------------
    @Transactional
    public EmployeeQuery respondToQuery(Long agentId, Long queryId, String response) throws Exception {
        EmployeeQuery query = queryRepository.findById(queryId)
                .orElseThrow(() -> new Exception("Query not found"));

        if (!query.getAgent().getId().equals(agentId)) {
            throw new Exception("Unauthorized: You are not assigned to this query");
        }

        // ✅ Update query fields
        query.setResponse(response);
        query.setStatus("resolved");
        query.setUpdatedAt(LocalDateTime.now());

        // ✅ Save and flush to ensure DB update
        EmployeeQuery savedQuery = queryRepository.saveAndFlush(query);
        System.out.println("✅ Query saved and flushed: ID=" + savedQuery.getId() + ", Status=" + savedQuery.getStatus());

        // ✅ Double-check from DB
        EmployeeQuery reloaded = queryRepository.findById(queryId)
                .orElseThrow(() -> new Exception("Query not found after saving"));
        System.out.println("🧾 DB Verification - Query ID=" + reloaded.getId() + ", Status=" + reloaded.getStatus());

        // ✅ Send email after confirming DB update
        try {
            if (reloaded.getEmployee() != null && reloaded.getEmployee().getEmail() != null) {
                notificationService.sendAgentResponseNotificationToEmployee(reloaded.getEmployee().getEmail(), reloaded);
                System.out.println("📧 Email sent successfully to " + reloaded.getEmployee().getEmail());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send agent response notification: " + e.getMessage());
        }

        return reloaded;
    }

    // -------------------- Respond to a query without agentId --------------------
    @Transactional
    public EmployeeQuery respondToQuery(EmployeeQuery query, String response) throws Exception {
        if (query == null) throw new Exception("Query cannot be null");

        query.setResponse(response);
        query.setStatus("resolved");
        query.setUpdatedAt(LocalDateTime.now());

        EmployeeQuery savedQuery = queryRepository.saveAndFlush(query);
        System.out.println("✅ Query (no-agent) saved and flushed. ID=" + savedQuery.getId());

        // Notify employee
        try {
            if (savedQuery.getEmployee() != null && savedQuery.getEmployee().getEmail() != null) {
                notificationService.sendAgentResponseNotificationToEmployee(savedQuery.getEmployee().getEmail(), savedQuery);
                System.out.println("📧 Email sent successfully to " + savedQuery.getEmployee().getEmail());
            }
        } catch (Exception e) {
            System.err.println("❌ Failed to send agent response notification: " + e.getMessage());
        }

        return savedQuery;
    }

    // -------------------- Fetch queries --------------------
    public List<EmployeeQuery> getAllQueries() {
        return queryRepository.findAll();
    }

    public List<EmployeeQuery> getQueriesForAgent(Long agentId) {
        return queryRepository.findByAgentId(agentId);
    }

    public List<EmployeeQuery> getQueriesForEmployee(Long employeeId) {
        return queryRepository.findByEmployeeId(employeeId);
    }

    public List<EmployeeQuery> getPendingQueriesForAgent(Long agentId) {
        return queryRepository.findByAgentIdAndStatus(agentId, "pending");
    }

    public List<EmployeeQuery> getAllPendingQueries() {
        return queryRepository.findByStatus("pending");
    }

    public List<EmployeeQuery> getAllQueriesForAgent(Long agentId) {
        return queryRepository.findByAgentId(agentId);
    }

    // -------------------- Helper methods --------------------
    public Optional<EmployeeQuery> findById(Long queryId) {
        return queryRepository.findById(queryId);
    }

    public EmployeeQuery save(EmployeeQuery query) {
        return queryRepository.saveAndFlush(query);
    }
}
