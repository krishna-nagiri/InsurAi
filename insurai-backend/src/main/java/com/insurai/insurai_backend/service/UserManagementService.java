package com.insurai.insurai_backend.service;

import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.exception.InvalidRoleException;
import com.insurai.insurai_backend.exception.InvalidStatusTransitionException;
import com.insurai.insurai_backend.exception.UserNotFoundException;
import com.insurai.insurai_backend.model.UpdateStatusRequest;
import com.insurai.insurai_backend.model.UserStatus;
import com.insurai.insurai_backend.repository.AgentRepository;
import com.insurai.insurai_backend.repository.EmployeeRepository;
import com.insurai.insurai_backend.repository.HrRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserManagementService {

    private final EmployeeRepository employeeRepository;
    private final AgentRepository agentRepository;
    private final HrRepository hrRepository;

    public void updateUserStatus(UpdateStatusRequest request) {

        String role = request.getRole().toUpperCase();
        Long id = request.getId();
        UserStatus newStatus = request.getStatus();

        switch (role) {
            case "EMPLOYEE":
                employeeRepository.findById(id)
                    .ifPresentOrElse(emp -> {
                        validateTransition(emp.getStatus(), newStatus);
                        emp.setStatus(newStatus);
                        employeeRepository.save(emp);
                    }, () -> {
                        throw new UserNotFoundException("Employee not found with id: " + id);
                    });
                break;

            case "AGENT":
                agentRepository.findById(id)
                    .ifPresentOrElse(agent -> {
                        validateTransition(agent.getStatus(), newStatus);
                        agent.setStatus(newStatus);
                        agentRepository.save(agent);
                    }, () -> {
                        throw new UserNotFoundException("Agent not found with id: " + id);
                    });
                break;

            case "HR":
                hrRepository.findById(id)
                    .ifPresentOrElse(hr -> {
                        validateTransition(hr.getStatus(), newStatus);
                        hr.setStatus(newStatus);
                        hrRepository.save(hr);
                    }, () -> {
                        throw new UserNotFoundException("HR not found with id: " + id);
                    });
                break;

            default:
                throw new InvalidRoleException("Invalid role: " + role);
        }
    }
    
    private void validateTransition(UserStatus currentStatus, UserStatus newStatus) {
        if (currentStatus == UserStatus.TERMINATED) {
            throw new InvalidStatusTransitionException(
                "TERMINATED users cannot be modified again"
            );
        }
    }



}
