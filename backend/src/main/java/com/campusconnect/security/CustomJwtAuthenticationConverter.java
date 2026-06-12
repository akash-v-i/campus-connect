package com.campusconnect.security;

import com.campusconnect.users.Profile;
import com.campusconnect.users.ProfileRepository;
import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Component
@SuppressWarnings("null")
public class CustomJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    private final ProfileRepository profileRepository;

    public CustomJwtAuthenticationConverter(ProfileRepository profileRepository) {
        this.profileRepository = profileRepository;
    }

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        String clerkUserId = jwt.getSubject();
        
        Optional<Profile> profileOpt = profileRepository.findById(clerkUserId);
        
        String role = "ROLE_UNASSIGNED";
        if (profileOpt.isPresent()) {
            Profile profile = profileOpt.get();
            if (profile.getIsActive() && !profile.getIsDeleted()) {
                role = "ROLE_" + profile.getRole().toUpperCase();
            } else {
                role = "ROLE_BLOCKED";
            }
        }

        List<GrantedAuthority> authorities = Collections.singletonList(new SimpleGrantedAuthority(role));

        return new JwtAuthenticationToken(jwt, authorities, clerkUserId);
    }
}
