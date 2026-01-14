package com.insurai.insurai_backend.config;

import java.io.IOException;
import java.util.Collections;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.insurai.insurai_backend.model.Agent;
import com.insurai.insurai_backend.service.AgentService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class AgentJwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final AgentService agentService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {

        // Get the Authorization header
        String authHeader = request.getHeader("Authorization");
        String token = null;
        String email = null;

        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            token = authHeader.substring(7);
            try {
                email = jwtUtil.extractUsername(token);
            } catch (Exception e) {
                System.out.println("Invalid JWT: " + e.getMessage());
            }
        }

        // Validate token
        if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            Agent agent = agentService.findByEmail(email).orElse(null);

            if (agent != null && jwtUtil.validateToken(token, email)) {
                SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_AGENT");

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                agent, null, Collections.singletonList(authority)
                        );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) throws ServletException {
        // Exclude only login, register, pending queries, and availability fetch
        String path = request.getServletPath();
        return path.startsWith("/agent/login") ||
               path.startsWith("/agent/register") ||
               path.startsWith("/agent/queries/pending") ||
               path.startsWith("/agent/availability");
    }
}