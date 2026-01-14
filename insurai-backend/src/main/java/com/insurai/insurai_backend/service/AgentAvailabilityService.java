package com.insurai.insurai_backend.service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.model.AgentAvailability;
import com.insurai.insurai_backend.repository.AgentAvailabilityRepository;
import com.insurai.insurai_backend.repository.AgentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AgentAvailabilityService {

    private final AgentAvailabilityRepository availabilityRepository;
    private final AgentRepository agentRepository;

    // -------------------- Save or update availability --------------------
    public AgentAvailability setAvailability(Long agentId, boolean available, LocalDateTime startTime, LocalDateTime endTime) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));

        AgentAvailability availability = new AgentAvailability();
        availability.setAgent(agent);
        availability.setAvailable(available);
        availability.setStartTime(startTime != null ? startTime : LocalDateTime.now()); // fallback to now
        availability.setEndTime(endTime); // can be null if not provided

        return availabilityRepository.save(availability);
    }

    // -------------------- Fetch latest availability for a single agent --------------------
    public Optional<AgentAvailability> getAvailability(Long agentId) {
        Agent agent = agentRepository.findById(agentId)
                .orElseThrow(() -> new RuntimeException("Agent not found"));
        return availabilityRepository.findTopByAgentOrderByIdDesc(agent);
    }

    // -------------------- Fetch latest availability for all agents --------------------
    public List<AgentAvailability> getAllLatestAvailability() {
        List<Agent> agents = agentRepository.findAll();
        return agents.stream()
                .map(agent -> availabilityRepository.findTopByAgentOrderByIdDesc(agent).orElse(null))
                .filter(avail -> avail != null)
                .collect(Collectors.toList());
    }
}
