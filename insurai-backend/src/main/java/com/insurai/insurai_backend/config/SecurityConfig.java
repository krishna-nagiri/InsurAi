package com.insurai.insurai_backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class SecurityConfig {

    private final EmployeeJwtAuthenticationFilter employeeJwtAuthenticationFilter;
    private final AgentJwtAuthenticationFilter agentJwtAuthenticationFilter;
    private final HrJwtAuthenticationFilter hrJwtAuthenticationFilter; // Added

    public SecurityConfig(EmployeeJwtAuthenticationFilter employeeJwtAuthenticationFilter,
                          AgentJwtAuthenticationFilter agentJwtAuthenticationFilter,
                          HrJwtAuthenticationFilter hrJwtAuthenticationFilter) { // Added
        this.employeeJwtAuthenticationFilter = employeeJwtAuthenticationFilter;
        this.agentJwtAuthenticationFilter = agentJwtAuthenticationFilter;
        this.hrJwtAuthenticationFilter = hrJwtAuthenticationFilter; // Added
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> {}) // Keep global CORS
            .authorizeHttpRequests(auth -> auth
                // Employee claim endpoints
                .requestMatchers("/employee/claims/**").hasRole("EMPLOYEE")
                .requestMatchers("/employee/queries/**").hasRole("EMPLOYEE")
                .requestMatchers("/uploads/**").permitAll()
                .requestMatchers("/hr/claims").hasAnyRole("HR")
                .requestMatchers("/admin/claims").hasAnyRole("ADMIN")
                .requestMatchers("/hr/claims/fraud").hasRole("HR")
                .requestMatchers("/admin/claims/fraud").hasRole("ADMIN")
                // Notifications endpoints
               .requestMatchers("/notifications/*/read").hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_HR", "ROLE_ADMIN")  // Allow notifications to be marked as Read
               .requestMatchers("/notifications/user/**").hasAnyAuthority("ROLE_EMPLOYEE", "ROLE_HR", "ROLE_ADMIN")
               .requestMatchers("/notifications/**").hasAnyRole("HR", "ADMIN")
               
               //Chatbot
               .requestMatchers("/employee/chatbot").hasRole("EMPLOYEE")

                // Public endpoints
                .requestMatchers(
                    "/auth/**",
                    "/hr",
                    "/agent",
                    "/auth/forgot-password",
                    "/auth/reset-password/**", 
                    "/admin/login",
                    "/employee/login",
                    "/agent/login",
                    "/employee/register",
                    "/employee/policies",
                    "/hr/login",
                    "/agent/queries/pending/**",
                    "/employees/**"
                ).permitAll()

                // Agent endpoints
                .requestMatchers("/agent/queries/respond/**", "/agent/queries/all/**").hasRole("AGENT")

                // Employee endpoints (other than claims/queries)
                .requestMatchers("/employee/**").hasRole("EMPLOYEE")

                // Claim endpoints for HR/Admin
                .requestMatchers(
                	"/claims/approve/**",
                    "/claims/reject/**",
                    "/claims/all"
                ).hasAnyRole("HR", "ADMIN")

                // Everything else requires authentication
                .anyRequest().authenticated()
            )
            .httpBasic(httpBasic -> httpBasic.disable())
            .formLogin(formLogin -> formLogin.disable());
        
        //System.out.println("In Security config : "); // debug.

        // Add JWT filters in order
        http.addFilterBefore(employeeJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(agentJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        http.addFilterBefore(hrJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class); // Added

        return http.build();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration authConfig) throws Exception {
        return authConfig.getAuthenticationManager();
    }

    // Global CORS configuration
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                        .allowedOrigins("http://localhost:5173", "http://localhost:8080")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}