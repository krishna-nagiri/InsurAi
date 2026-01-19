package com.insurai.insurai_backend.model;

import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
public class UpdateStatusRequest {
	
    private String role;
    private Long id;
    private UserStatus status;
}
