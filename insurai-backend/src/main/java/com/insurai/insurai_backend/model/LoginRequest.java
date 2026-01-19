package com.insurai.insurai_backend.model;

public class LoginRequest {
    private String email;       // optional
    private String employeeId;  // optional (new)
    private String password;    // required

    // Constructors
    public LoginRequest() {}
    public LoginRequest(String email, String employeeId, String password) {
        this.email = email;
        this.employeeId = employeeId;
        this.password = password;
    }

    // Getters & Setters
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getEmployeeId() { return employeeId; }
    public void setEmployeeId(String employeeId) { this.employeeId = employeeId; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }
}
