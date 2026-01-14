package com.insurai.insurai_backend.service;

import java.util.List;
import java.util.Optional;

import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.repository.AgentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AgentService {

    private final AgentRepository agentRepository;

    // Get all agents
    public List<Agent> getAllAgents() {
        return agentRepository.findAll();
    }

    // Register new agent
    public Agent registerAgent(Agent agent) {
        return agentRepository.save(agent);
    }

    // Find by email
    public Optional<Agent> findByEmail(String email) {
        return agentRepository.findByEmail(email);
    }

    // ----------------- NEW METHODS for availability -----------------

    // Update availability for an agent
    public boolean setAvailability(Long agentId, boolean available) {
        Optional<Agent> optionalAgent = agentRepository.findById(agentId);
        if (optionalAgent.isPresent()) {
            Agent agent = optionalAgent.get();
            agent.setAvailable(available);   // make sure Agent.java has: private boolean available;
            agentRepository.save(agent);
            return agent.isAvailable();
        } else {
            throw new RuntimeException("Agent not found with ID: " + agentId);
        }
    }

    // Get availability for an agent
    public boolean getAvailability(Long agentId) {
        Optional<Agent> optionalAgent = agentRepository.findById(agentId);
        return optionalAgent.map(Agent::isAvailable)
                .orElseThrow(() -> new RuntimeException("Agent not found with ID: " + agentId));
    }
}
