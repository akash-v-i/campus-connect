package com.campusconnect.filestorage;

import com.campusconnect.common.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/files")
@SuppressWarnings("null")
public class FileController {

    private static final Logger log = LoggerFactory.getLogger(FileController.class);

    private final FileStorageService fileStorageService;

    public FileController(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("module") String module) {

        log.info("File upload request for module: {}", module);
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File is empty.");
        }

        String fileUrl = fileStorageService.storeFile(file, module);
        return ResponseEntity.ok(ApiResponse.success(Map.of("fileUrl", fileUrl), "File uploaded successfully"));
    }

    @GetMapping("/{module}/{fileName:.+}")
    public ResponseEntity<Resource> downloadFile(@PathVariable String module, @PathVariable String fileName) {
        try {
            Path filePath = fileStorageService.loadFileAsPath(module, fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                if (contentType == null) {
                    contentType = "application/octet-stream";
                }

                log.info("Serving file: {}, contentType: {}", filePath, contentType);

                return ResponseEntity.ok()
                        .contentType(MediaType.parseMediaType(contentType))
                        .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + resource.getFilename() + "\"")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (MalformedURLException ex) {
            log.error("File download error", ex);
            return ResponseEntity.badRequest().build();
        } catch (IOException ex) {
            log.error("Content type probe error", ex);
            return ResponseEntity.internalServerError().build();
        }
    }
}
