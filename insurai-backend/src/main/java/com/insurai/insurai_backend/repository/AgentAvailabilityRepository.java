package com.insurai.insurai_backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.model.AgentAvailability;

@Repository
public interface AgentAvailabilityRepository extends JpaRepository<AgentAvailability, Long> {

    // ✅ Get the latest availability record for a specific agent
    Optional<AgentAvailability> findTopByAgentOrderByIdDesc(Agent agent);

    // ✅ Get all agent availability records sorted by ID descending
    List<AgentAvailability> findAllByOrderByIdDesc();
}
