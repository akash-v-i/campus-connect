package com.campusconnect.users;

import com.campusconnect.users.dto.AdminUpdateUserRequest;
import com.campusconnect.users.dto.ProfileDTO;
import com.campusconnect.users.dto.UpdateProfileRequest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@SuppressWarnings("null")
public class ProfileService {

    private final ProfileRepository profileRepository;

    public ProfileService(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    private ProfileDTO mapToDTO(Profile profile) {
        return ProfileDTO.builder()
                .id(profile.getId())
                .email(profile.getEmail())
                .fullName(profile.getFullName())
                .role(profile.getRole())
                .status(profile.getStatus())
                .walletBalance(profile.getWalletBalance())
                .rewardPoints(profile.getRewardPoints())
                .isActive(profile.getIsActive())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    public ProfileDTO getMyProfile(String clerkId) {
        Profile profile = profileRepository.findById(clerkId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        return mapToDTO(profile);
    }

    public ProfileDTO updateMyProfile(String clerkId, UpdateProfileRequest req) {
        Profile profile = profileRepository.findById(clerkId)
                .orElseThrow(() -> new RuntimeException("Profile not found"));
        profile.setFullName(req.getFullName());
        profile.setUpdatedBy(clerkId);
        return mapToDTO(profileRepository.save(profile));
    }

    public Page<ProfileDTO> getAllUsers(Pageable pageable) {
        return profileRepository.findAll(pageable).map(this::mapToDTO);
    }

    public ProfileDTO getUserById(String id) {
        return mapToDTO(profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found")));
    }

    public ProfileDTO updateUserRole(String id, String role, String updatedBy) {
        List<String> allowedRoles = List.of("UNASSIGNED", "STUDENT", "PROFESSOR", "LIBRARIAN", "CANTEEN_STAFF", "ADMIN");
        if (!allowedRoles.contains(role)) {
            throw new RuntimeException("Invalid role");
        }
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        profile.setRole(role);
        profile.setUpdatedBy(updatedBy);
        return mapToDTO(profileRepository.save(profile));
    }

    public ProfileDTO activateUser(String id, String updatedBy) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        profile.setStatus("ACTIVE");
        profile.setIsActive(true);
        profile.setUpdatedBy(updatedBy);
        return mapToDTO(profileRepository.save(profile));
    }

    public ProfileDTO deactivateUser(String id, String updatedBy) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        profile.setStatus("DEACTIVATED");
        profile.setIsActive(false);
        profile.setUpdatedBy(updatedBy);
        return mapToDTO(profileRepository.save(profile));
    }

    public ProfileDTO reactivateUser(String id, String updatedBy) {
        return activateUser(id, updatedBy); // same logic
    }

    public ProfileDTO updateUserProfile(String id, AdminUpdateUserRequest req, String updatedBy) {
        Profile profile = profileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        
        if (req.getFullName() != null) profile.setFullName(req.getFullName());
        if (req.getRole() != null) {
            List<String> allowedRoles = List.of("UNASSIGNED", "STUDENT", "PROFESSOR", "LIBRARIAN", "CANTEEN_STAFF", "ADMIN");
            if (!allowedRoles.contains(req.getRole())) throw new RuntimeException("Invalid role");
            profile.setRole(req.getRole());
        }
        if (req.getStatus() != null) profile.setStatus(req.getStatus());

        profile.setUpdatedBy(updatedBy);
        return mapToDTO(profileRepository.save(profile));
    }
}
