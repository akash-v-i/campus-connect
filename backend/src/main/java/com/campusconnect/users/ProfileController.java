package com.campusconnect.users;

import com.campusconnect.common.ApiResponse;
import com.campusconnect.users.dto.AdminUpdateUserRequest;
import com.campusconnect.users.dto.ProfileDTO;
import com.campusconnect.users.dto.UpdateProfileRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1")
public class ProfileController {

    private final ProfileService profileService;

    public ProfileController(ProfileService profileService) {
        this.profileService = profileService;
    }

    @GetMapping("/profiles/me")
    public ApiResponse<ProfileDTO> getMyProfile(@AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(profileService.getMyProfile(jwt.getSubject()));
    }

    @PutMapping("/profiles/me")
    public ApiResponse<ProfileDTO> updateMyProfile(@AuthenticationPrincipal Jwt jwt, @Valid @RequestBody UpdateProfileRequest req) {
        return ApiResponse.success(profileService.updateMyProfile(jwt.getSubject(), req));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users")
    public ApiResponse<Page<ProfileDTO>> getAllUsers(Pageable pageable) {
        return ApiResponse.success(profileService.getAllUsers(pageable));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping("/admin/users/{id}")
    public ApiResponse<ProfileDTO> getUserById(@PathVariable String id) {
        return ApiResponse.success(profileService.getUserById(id));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{id}/role")
    public ApiResponse<ProfileDTO> updateUserRole(@PathVariable String id, @RequestBody Map<String, String> payload, @AuthenticationPrincipal Jwt jwt) {
        String role = payload.get("role");
        return ApiResponse.success(profileService.updateUserRole(id, role, jwt.getSubject()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{id}/activate")
    public ApiResponse<ProfileDTO> activateUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(profileService.activateUser(id, jwt.getSubject()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{id}/deactivate")
    public ApiResponse<ProfileDTO> deactivateUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(profileService.deactivateUser(id, jwt.getSubject()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{id}/reactivate")
    public ApiResponse<ProfileDTO> reactivateUser(@PathVariable String id, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(profileService.reactivateUser(id, jwt.getSubject()));
    }

    @PreAuthorize("hasRole('ADMIN')")
    @PutMapping("/admin/users/{id}/profile")
    public ApiResponse<ProfileDTO> updateUserProfile(@PathVariable String id, @RequestBody AdminUpdateUserRequest req, @AuthenticationPrincipal Jwt jwt) {
        return ApiResponse.success(profileService.updateUserProfile(id, req, jwt.getSubject()));
    }
}
