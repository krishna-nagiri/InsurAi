package com.insurai.insurai_backend.dto;

import com.insurai.insurai_backend.model.UserStatus;
import lombok.Data;

@Data
public class UpdateStatusRequest {
    private String role;
    private Long id;
    private UserStatus status;
}
