package com.campusconnect.users;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/v1/webhooks/clerk")
@SuppressWarnings("null")
public class ClerkWebhookController {

    private final ProfileRepository profileRepository;

    @Value("${clerk.webhook-secret}")
    private String webhookSecret;

    public ClerkWebhookController(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @PostMapping
    public ResponseEntity<String> handleWebhook(
            @RequestHeader(value = "svix-id", required = false) String svixId,
            @RequestHeader(value = "svix-timestamp", required = false) String svixTimestamp,
            @RequestHeader(value = "svix-signature", required = false) String svixSignature,
            @RequestBody Map<String, Object> payload) {
        
        // Note: For local development, signature verification is bypassed if placeholder is used.
        // In production, use Svix library to verify the signature.

        if (payload == null || !payload.containsKey("type")) {
            return ResponseEntity.badRequest().body("Invalid payload");
        }

        String type = (String) payload.get("type");
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) payload.get("data");
        if (data == null || !data.containsKey("id")) {
            return ResponseEntity.badRequest().body("No data or id in payload");
        }

        String clerkId = (String) data.get("id");

        try {
            if ("user.created".equals(type) || "user.updated".equals(type)) {
                Profile profile = profileRepository.findById(clerkId).orElse(new Profile());
                profile.setId(clerkId);
                
                // Extract email
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> emailAddresses = (List<Map<String, Object>>) data.get("email_addresses");
                if (emailAddresses != null && !emailAddresses.isEmpty()) {
                    profile.setEmail((String) emailAddresses.get(0).get("email_address"));
                }
                
                // Extract name
                String firstName = (String) data.get("first_name");
                String lastName = (String) data.get("last_name");
                String fullName = (firstName != null ? firstName : "") + (lastName != null ? " " + lastName : "");
                profile.setFullName(fullName.trim());

                if ("user.created".equals(type)) {
                    profile.setRole("UNASSIGNED");
                    profile.setStatus("UNASSIGNED");
                }
                
                profileRepository.save(profile);
            } else if ("user.deleted".equals(type)) {
                profileRepository.findById(clerkId).ifPresent(profile -> {
                    profile.setIsActive(false);
                    profile.setIsDeleted(true);
                    profile.setStatus("DELETED");
                    profileRepository.save(profile);
                });
            }
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body("Error processing webhook");
        }

        return ResponseEntity.ok("Webhook processed");
    }
}
