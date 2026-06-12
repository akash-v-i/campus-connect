package com.campusconnect.audit;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@SuppressWarnings("null")
public class AuditService {

    private static final Logger log = LoggerFactory.getLogger(AuditService.class);

    private final AuditLogRepository auditLogRepository;
    private final ObjectMapper objectMapper;

    public AuditService(AuditLogRepository auditLogRepository, ObjectMapper objectMapper) {
        this.auditLogRepository = auditLogRepository;
        this.objectMapper = objectMapper;
    }

    public void logEvent(String action, String entityType, String entityId, String performedBy, Object details) {
        try {
            String detailsJson = details != null ? objectMapper.writeValueAsString(details) : null;
            AuditLog auditLog = AuditLog.builder()
                    .action(action)
                    .entityType(entityType)
                    .entityId(entityId)
                    .performedBy(performedBy)
                    .details(detailsJson)
                    .build();
            auditLogRepository.save(auditLog);
            log.info("Audit logged: action={}, entityType={}, entityId={}, performedBy={}", 
                    action, entityType, entityId, performedBy);
        } catch (Exception e) {
            log.error("Failed to serialize audit details for action={}", action, e);
        }
    }

    public Page<AuditLog> getLogs(Pageable pageable) {
        return auditLogRepository.findAll(pageable);
    }
}
