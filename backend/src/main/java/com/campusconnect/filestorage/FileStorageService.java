package com.campusconnect.filestorage;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Objects;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Logger log = LoggerFactory.getLogger(FileStorageService.class);

    private final Path fileStorageLocation;
    private final String backendUrl;

    public FileStorageService(@Value("${app.file-storage.root:./uploads}") String uploadDir,
                              @Value("${app.backend-url:http://localhost:8080}") String backendUrl) {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.backendUrl = backendUrl;

        try {
            Files.createDirectories(this.fileStorageLocation);
            log.info("File storage directory initialized at: {}", this.fileStorageLocation);
        } catch (Exception ex) {
            throw new RuntimeException("Could not create the directory where the uploaded files will be stored.", ex);
        }
    }

    public String storeFile(MultipartFile file, String module) {
        // Normalize file name
        String originalFileName = StringUtils.cleanPath(Objects.requireNonNull(file.getOriginalFilename()));
        String fileExtension = "";

        try {
            // Check if the file's name contains invalid characters
            if (originalFileName.contains("..")) {
                throw new IllegalArgumentException("Sorry! Filename contains invalid path sequence " + originalFileName);
            }

            int lastIndex = originalFileName.lastIndexOf('.');
            if (lastIndex != -1) {
                fileExtension = originalFileName.substring(lastIndex);
            }

            // Generate clean unique filename
            String fileName = module + "_" + UUID.randomUUID().toString() + fileExtension;

            // Target path under module folder
            Path targetModuleDir = this.fileStorageLocation.resolve(module);
            Files.createDirectories(targetModuleDir);

            Path targetLocation = targetModuleDir.resolve(fileName);
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            log.info("File saved successfully to: {}", targetLocation);

            // Return relative file endpoint path
            return backendUrl + "/api/v1/files/" + module + "/" + fileName;

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + originalFileName + ". Please try again!", ex);
        }
    }

    public Path loadFileAsPath(String module, String fileName) {
        return this.fileStorageLocation.resolve(module).resolve(fileName).normalize();
    }
}
