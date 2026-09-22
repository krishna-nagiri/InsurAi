package com.insurai.insurai_backend.config;

import java.util.Collections;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import com.insurai.insurai_backend.model.Admin;
import com.insurai.insurai_backend.model.Employee;
import com.insurai.insurai_backend.repository.AdminRepository;
import com.insurai.insurai_backend.repository.EmployeeRepository;
//Murali: Added Agent Login.
import com.insurari.insurai_backend.repository.AgentRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final EmployeeRepository employeeRepository;
    private final AgentRepository agentRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        // Load admin first
        Admin admin = adminRepository.findByEmail(email).orElse(null);
        if (admin != null) {
            return User.builder()
                    .username(admin.getEmail())
                    .password(admin.getPassword())
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority(admin.getSpringRole())))
                    .build();
        }

        // Load employee
        Employee emp = employeeRepository.findByEmail(email).orElse(null);
        if (emp != null) {
            String roleName = emp.getRole().name();
            String roleWithPrefix = roleName.startsWith("ROLE_") ? roleName : "ROLE_" + roleName;

            return User.builder()
                    .username(emp.getEmail())
                    .password(emp.getPassword())
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix)))
                    .build();
        }

        Agent ag = agentRepository.findByEmail(email).orElse(null);
        if(ag != null){
            String roleName = ag.getRole().name();
            String roleWithPrefix = roleName.startsWith("ROLE_AG") ? roleName : "ROLE_"+roleName;

            return User.builder().username(ag.getEmail())
                    .password(ag.getPassword()).
                    .authorities(Collections.singletonList(new SimpleGrantedAuthority(roleWithPrefix)))
                    .build();
        }

        throw new UsernameNotFoundException("User not found with email: " + email);
    }
}
