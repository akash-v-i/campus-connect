package com.campusconnect.users.dto;

import lombok.Data;

@Data
public class AdminUpdateUserRequest {
    private String fullName;
    private String role;
    private String status;
}
