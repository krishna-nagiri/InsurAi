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

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final AdminRepository adminRepository;
    private final EmployeeRepository employeeRepository;

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

        // Optional: Add Agent/HR logic here if needed

        throw new UsernameNotFoundException("User not found with email: " + email);
    }
}
