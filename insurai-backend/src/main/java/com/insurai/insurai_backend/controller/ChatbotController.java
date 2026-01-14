package com.insurai.insurai_backend.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import com.insurai.insurai_backend.model.Claim;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.model.EmployeeQuery;
import com.insurai.insurai_backend.model.Policy;
import com.insurai.insurai_backend.service.ClaimService;
import com.insurai.insurai_backend.service.EmployeeQueryService;
import com.insurai.insurai_backend.service.EmployeeService;
import com.insurai.insurai_backend.service.NotificationService;
import com.insurai.insurai_backend.service.PolicyService;

import jakarta.annotation.PostConstruct;

@RestController
@RequestMapping("/employee/chatbot")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ChatbotController {

    @Value("${COHERE_API_KEY:}")
    private String cohereApiKey;

    private final ClaimService claimService;
    private final EmployeeService employeeService;
    private final PolicyService policyService;
    private final EmployeeQueryService queryService;
    private final NotificationService notificationService;

    public ChatbotController(
            ClaimService claimService,
            EmployeeService employeeService,
            PolicyService policyService,
            EmployeeQueryService queryService,
            NotificationService notificationService
    ) {
        this.claimService = claimService;
        this.employeeService = employeeService;
        this.policyService = policyService;
        this.queryService = queryService;
        this.notificationService = notificationService;
    }

    @PostConstruct
    public void init() {
        if (cohereApiKey.isEmpty()) {
            System.out.println("⚠️ Cohere API key not set! Cohere responses will not work.");
        } else {
            System.out.println("✅ Cohere API key loaded successfully.");
        }
    }

    @PostMapping
    public ResponseEntity<Map<String, String>> chat(@RequestBody Map<String, String> req) {
        String message = req.get("message");
        if (message == null || message.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("response", "Please type a question to continue."));
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("response", "Invalid or missing Employee JWT token."));
        }

        String email = auth.getName();
        Employee employee = employeeService.findByEmail(email);
        if (employee == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("response", "Employee not found."));
        }

        String msg = message.toLowerCase().trim();

        // --- Handle greetings/small talk ---
        String localResponse = handleLocalResponse(msg, employee);
        if (localResponse != null) return ResponseEntity.ok(Map.of("response", localResponse));

        // --- Load employee-specific data ---
        List<Claim> claims = claimService.getClaimsByEmployeeId(employee.getEmployeeId());
        List<Policy> policies = policyService.getAllPolicies();
        List<EmployeeQuery> queries = queryService.getQueriesForEmployee(employee.getId());

        // --- Detect intent ---
        String intent = detectIntent(msg);

        switch (intent) {
            case "CLAIM_TRACK":
                return ResponseEntity.ok(Map.of("response", handleClaimTracking(msg, claims)));
            case "CLAIM_LIST":
                return ResponseEntity.ok(Map.of("response", handleClaimList(claims)));
            case "POLICY_EXPIRY":
                return ResponseEntity.ok(Map.of("response", handlePolicyExpiry(policies)));
            case "POLICY_COVERAGE":
                return ResponseEntity.ok(Map.of("response", handlePolicyCoverage(policies, msg)));
            case "POLICY_RENEW":
                return ResponseEntity.ok(Map.of("response", handlePolicyRenew(policies, msg)));
            case "POLICY_PREMIUM":
                return ResponseEntity.ok(Map.of("response", handlePolicyPremium(policies, msg)));
            case "EMP_QUERY_LAST_REPLY":
                return ResponseEntity.ok(Map.of("response", handleLastQueryReply(queries)));
            case "EMP_QUERY_SUBMIT":
                return ResponseEntity.ok(Map.of("response", "Please submit your query using the query submission form."));
            case "EMP_QUERY_AGENT":
                return ResponseEntity.ok(Map.of("response", handleAssignedAgent(queries)));
            case "EMP_QUERY_TIME":
                return ResponseEntity.ok(Map.of("response", handleQueryTime(queries)));
            case "GENERAL":
            default:
                String aiResponse = callCohereChat(msg, employee, claims, policies, queries);
                return ResponseEntity.ok(Map.of("response", aiResponse));
        }
    }

    // ----------------------------------------
    // Intent Detection
    // ----------------------------------------
    private String detectIntent(String msg) {
        msg = msg.toLowerCase();
        if (msg.matches(".*\\b(track|status)\\b.*\\bclaim\\b.*")) return "CLAIM_TRACK";
        if (msg.matches(".*\\b(my claims|list claims)\\b.*")) return "CLAIM_LIST";
        if (msg.matches(".*\\b(policy|policies)\\b.*")) {
            if (msg.contains("expire")) return "POLICY_EXPIRY";
            if (msg.contains("coverage")) return "POLICY_COVERAGE";
            if (msg.contains("renew")) return "POLICY_RENEW";
            if (msg.contains("premium")) return "POLICY_PREMIUM";
            return "POLICY_INFO";
        }
        if (msg.matches(".*\\b(agent reply|last query reply)\\b.*")) return "EMP_QUERY_LAST_REPLY";
        if (msg.matches(".*\\b(submit|ask)\\b.*\\bquery\\b.*")) return "EMP_QUERY_SUBMIT";
        if (msg.matches(".*\\b(assigned agent)\\b.*")) return "EMP_QUERY_AGENT";
        if (msg.matches(".*\\b(query time|how long).*\\bresolve\\b.*")) return "EMP_QUERY_TIME";
        return "GENERAL";
    }

    // ----------------------------------------
    // Local handlers
    // ----------------------------------------
    private String handleLocalResponse(String msg, Employee employee) {
        if (msg.matches(".*\\b(hi|hello|hey)\\b.*")) {
            return "Hello 👋 " + employee.getName() + "! How can I assist you today — claims, policies, or support?";
        }
        if (msg.contains("how are you")) return "I'm doing great, thank you! How about you?";
        if (msg.contains("bye")) return "Goodbye! Have a great day 👋";
        if (msg.contains("thank")) return "You're welcome! 😊";
        return null;
    }

    // ----------------------------------------
    // Claims handlers
    // ----------------------------------------
    private String handleClaimTracking(String msg, List<Claim> claims) {
        if (claims.isEmpty()) return "You don’t have any claims at the moment.";
        var match = msg.replaceAll("[^0-9]", "").trim();
        if (!match.isEmpty()) {
            long claimId = Long.parseLong(match);
            return claims.stream()
                    .filter(c -> c.getId() == claimId)
                    .findFirst()
                    .map(c -> String.format("Claim #%d is currently: %s (%s)", c.getId(), c.getStatus(), c.getDescription()))
                    .orElse("No claim found with ID #" + claimId + ".");
        }
        return "Please specify the claim number, e.g., 'track claim 123'.";
    }

    private String handleClaimList(List<Claim> claims) {
        if (claims.isEmpty()) return "You currently have no claims filed.";
        return "Here are your claims:\n" + claims.stream()
                .map(c -> String.format("• Claim #%d — %s (%s)", c.getId(), c.getStatus(), c.getDescription()))
                .collect(Collectors.joining("\n"));
    }

    // ----------------------------------------
    // Policies handlers
    // ----------------------------------------
    private String handlePolicyExpiry(List<Policy> policies) {
        if (policies.isEmpty()) return "You have no active policies.";
        return policies.stream()
                .map(p -> String.format("Policy %s expires on %s", p.getPolicyName(), p.getRenewalDate()))
                .collect(Collectors.joining("\n"));
    }

    private String handlePolicyCoverage(List<Policy> policies, String msg) {
        String policyName = msg.replaceAll(".*coverage of (policy )?", "").trim();
        Policy policy = policies.stream()
                .filter(p -> p.getPolicyName().equalsIgnoreCase(policyName))
                .findFirst()
                .orElse(null);
        return policy != null ? String.format("Policy %s covers: %s", policy.getPolicyName(), policy.getPolicyType())
                              : "Policy not found.";
    }

    private String handlePolicyRenew(List<Policy> policies, String msg) {
        String policyName = msg.replaceAll(".*renew (policy )?", "").trim();
        Policy policy = policies.stream()
                .filter(p -> p.getPolicyName().equalsIgnoreCase(policyName))
                .findFirst()
                .orElse(null);
        return policy != null ? String.format("You can renew policy %s. Please proceed in the policies section.", policy.getPolicyName())
                              : "Policy not found.";
    }

    private String handlePolicyPremium(List<Policy> policies, String msg) {
        String policyName = msg.replaceAll(".*premium of (policy )?", "").trim();
        Policy policy = policies.stream()
                .filter(p -> p.getPolicyName().equalsIgnoreCase(policyName))
                .findFirst()
                .orElse(null);
        return policy != null ? String.format("The premium for policy %s is $%.2f", policy.getPolicyName())
                              : "Policy not found.";
    }

    // ----------------------------------------
    // Employee Queries handlers
    // ----------------------------------------
    private String handleLastQueryReply(List<EmployeeQuery> queries) {
        if (queries.isEmpty()) return "You have no queries submitted.";
        EmployeeQuery last = queries.get(queries.size() - 1);
        return last.getResponse() != null ? "Agent replied: " + last.getResponse()
                                         : "The agent has not replied to your last query yet.";
    }

    private String handleAssignedAgent(List<EmployeeQuery> queries) {
        if (queries.isEmpty()) return "You have no queries submitted.";
        EmployeeQuery last = queries.get(queries.size() - 1);
        return last.getAgent() != null ? "Your assigned agent is: " + last.getAgent().getName()
                                       : "No agent assigned yet.";
    }

    private String handleQueryTime(List<EmployeeQuery> queries) {
        if (queries.isEmpty()) return "You have no queries submitted.";
        EmployeeQuery last = queries.get(queries.size() - 1);
        return last.getStatus().equalsIgnoreCase("resolved") ? "Your query has been resolved."
                : "Your query is pending. The estimated resolution time is 24-48 hours.";
    }

    // ----------------------------------------
    // Cohere Chat API for general questions
    // ----------------------------------------
    private String callCohereChat(String userInput, Employee employee, List<Claim> claims, List<Policy> policies, List<EmployeeQuery> queries) {
        if (cohereApiKey.isEmpty()) {
            return "Cohere API key is not set. I can answer only claims and policy questions for now.";
        }

        try {
            RestTemplate restTemplate = new RestTemplate();
            String url = "https://api.cohere.ai/v1/chat";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("Authorization", "Bearer " + cohereApiKey);

            String prompt = String.format("""
                    You are InsurAI, an intelligent insurance assistant.
                    Use the data below to answer the employee's question accurately.

                    Employee: %s

                    Claims:
                    %s

                    Policies:
                    %s

                    Queries:
                    %s

                    Question: %s
                    Guidelines: Answer concisely, clearly, friendly tone, max 100 words.
                    """,
                    employee.getName(),
                    claims.stream().map(c -> "Claim #" + c.getId() + " — " + c.getStatus() + " (" + c.getDescription() + ")").collect(Collectors.joining("\n")),
                    policies.stream().map(p -> p.getPolicyName() + " (Renewal: " + p.getRenewalDate() + ")").collect(Collectors.joining("\n")),
                    queries.stream().map(q -> q.getQueryText() + " -> " + (q.getResponse() != null ? q.getResponse() : "Pending")).collect(Collectors.joining("\n")),
                    userInput
            );

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", "command-a-03-2025");
            requestBody.put("message", prompt);
            requestBody.put("conversation_id", "employee_" + employee.getEmployeeId());

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            ResponseEntity<Map> response = restTemplate.postForEntity(url, entity, Map.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                String aiText = (String) response.getBody().get("text");
                if (aiText != null) return aiText.trim();
            }

            return "I couldn’t find a clear answer at the moment.";

        } catch (Exception e) {
            e.printStackTrace();
            return "I’m having trouble connecting to InsurAI’s knowledge base right now. Please try again later.";
        }
    }
}
