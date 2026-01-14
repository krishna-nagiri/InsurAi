package com.insurai.insurai_backend.model;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequest {
    private String employeeId;  // 👈 new unique field for employees
    private String name;
    private String email;
    private String password;
    private String phoneNumber;
    private String hrId;
}
