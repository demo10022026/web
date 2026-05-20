package com.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
public class ImageStorageService {

    private final Cloudinary cloudinary;

    @Value("${app.upload.local-dir:uploads}")
    private String localDir;

    @Value("${app.upload.use-local:true}")
    private boolean useLocal;

    @Value("${server.servlet.context-path:/api}")
    private String contextPath;

    @Value("${app.upload.base-url:http://localhost:8080}")
    private String baseUrl;

    public ImageStorageService(
            @Value("${app.cloudinary.cloud-name}") String cloudName,
            @Value("${app.cloudinary.api-key}") String apiKey,
            @Value("${app.cloudinary.api-secret}") String apiSecret
    ) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret
        ));
    }

    @Getter
    @AllArgsConstructor
    public static class UploadResult {
        private String url;
        private String publicId;
        private String resourceType;
    }

    /**
     * Method cũ: giữ lại để code cũ không lỗi.
     * Chỉ trả URL.
     */
    public String upload(MultipartFile file, String folder) {
        return uploadWithInfo(file, folder).getUrl();
    }

    /**
     * Method mới: trả cả URL + publicId.
     * Dùng cho product_images.public_id để sau này xóa được file thật.
     */
    public UploadResult uploadWithInfo(MultipartFile file, String folder) {
        validateFile(file);

        if (useLocal) {
            try {
                return uploadLocalWithInfo(file, folder);
            } catch (Exception e) {
                log.warn(
                        "Local upload thất bại, chuyển sang Cloudinary: {}",
                        e.getMessage()
                );

                return uploadCloudinaryWithInfo(file, folder);
            }
        }

        return uploadCloudinaryWithInfo(file, folder);
    }

    private UploadResult uploadLocalWithInfo(
            MultipartFile file,
            String folder
    ) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;

        String normalizedFolder = normalizePath(folder);

        Path dir = Paths.get(localDir, normalizedFolder);
        Files.createDirectories(dir);

        Path dest = dir.resolve(filename);
        Files.copy(
                file.getInputStream(),
                dest,
                StandardCopyOption.REPLACE_EXISTING
        );

        String publicId = normalizedFolder + "/" + filename;
        String url = normalizeBaseUrl(baseUrl)
                + contextPath
                + "/files/"
                + publicId;

        log.info("Đã lưu file local: {}", url);

        return new UploadResult(url, publicId, "local");
    }

    private UploadResult uploadCloudinaryWithInfo(
            MultipartFile file,
            String folder
    ) {
        try {
            String normalizedFolder = normalizePath(folder);
            String cloudinaryFolder = "shopvn/" + normalizedFolder;

            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", cloudinaryFolder,
                            "resource_type", "auto"
                    )
            );

            String url = (String) result.get("secure_url");
            String publicId = (String) result.get("public_id");
            String resourceType = (String) result.get("resource_type");

            if (url == null || url.isBlank()) {
                throw new RuntimeException("Cloudinary không trả về secure_url");
            }

            if (publicId == null || publicId.isBlank()) {
                throw new RuntimeException("Cloudinary không trả về public_id");
            }

            if (resourceType == null || resourceType.isBlank()) {
                resourceType = "image";
            }

            log.info("Đã upload Cloudinary: {} | publicId={}", url, publicId);

            return new UploadResult(url, publicId, resourceType);
        } catch (Exception e) {
            log.error("Upload Cloudinary thất bại", e);

            throw new RuntimeException(
                    "Upload Cloudinary thất bại: " + e.getMessage()
            );
        }
    }

    /**
     * Xóa theo publicId.
     *
     * Với local:
     * publicId dạng: products/shop-1/xxx.jpg
     *
     * Với Cloudinary:
     * publicId dạng: shopvn/products/shop-1/xxx
     */
    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        String cleanPublicId = normalizePath(publicId);

        if (isCloudinaryPublicId(cleanPublicId)) {
            deleteCloudinary(cleanPublicId, "image");
            return;
        }

        deleteLocalByPublicId(cleanPublicId);
    }

    /**
     * Dùng khi biết rõ resourceType: image / video / raw.
     */
    public void delete(String publicId, String resourceType) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        String cleanPublicId = normalizePath(publicId);

        if (isCloudinaryPublicId(cleanPublicId)) {
            deleteCloudinary(
                    cleanPublicId,
                    resourceType == null || resourceType.isBlank()
                            ? "image"
                            : resourceType
            );
            return;
        }

        deleteLocalByPublicId(cleanPublicId);
    }

    /**
     * Method cũ: xóa local theo URL.
     * Giữ lại để code cũ không lỗi.
     */
    public void deleteLocal(String fileUrl) {
        if (fileUrl == null || fileUrl.isBlank()) {
            return;
        }

        try {
            String prefix = normalizeBaseUrl(baseUrl)
                    + contextPath
                    + "/files/";

            String publicId = fileUrl.replace(prefix, "");

            deleteLocalByPublicId(publicId);
        } catch (Exception e) {
            log.warn("Không xóa được file local từ URL: {}", e.getMessage());
        }
    }

    private void deleteCloudinary(
            String publicId,
            String resourceType
    ) {
        try {
            Map<?, ?> result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.asMap(
                            "resource_type", resourceType,
                            "invalidate", true
                    )
            );

            log.info(
                    "Đã gọi xóa Cloudinary asset: publicId={}, result={}",
                    publicId,
                    result
            );
        } catch (Exception e) {
            log.warn(
                    "Không xóa được Cloudinary asset {}: {}",
                    publicId,
                    e.getMessage()
            );
        }
    }

    private void deleteLocalByPublicId(String publicId) {
        if (publicId == null || publicId.isBlank()) {
            return;
        }

        try {
            String cleanPublicId = normalizePath(publicId);

            Path file = Paths.get(localDir, cleanPublicId);
            Files.deleteIfExists(file);

            log.info("Đã xóa file local: {}", file);
        } catch (IOException e) {
            log.warn("Không xóa được file local: {}", e.getMessage());
        }
    }

    private boolean isCloudinaryPublicId(String publicId) {
        return publicId != null && publicId.startsWith("shopvn/");
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return ".jpg";
        }

        return filename
                .substring(filename.lastIndexOf("."))
                .toLowerCase();
    }

    private String normalizePath(String path) {
        if (path == null) {
            return "";
        }

        String normalized = path
                .replace("\\", "/")
                .replaceAll("^/+", "")
                .replaceAll("/+$", "");

        while (normalized.contains("//")) {
            normalized = normalized.replace("//", "/");
        }

        return normalized;
    }

    private String normalizeBaseUrl(String value) {
        if (value == null || value.isBlank()) {
            return "http://localhost:8080";
        }

        return value.replaceAll("/+$", "");
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File upload không được để trống");
        }

        long maxSize = 5L * 1024 * 1024;

        if (file.getSize() > maxSize) {
            throw new RuntimeException("File upload tối đa 5MB");
        }

        String contentType = file.getContentType();

        if (contentType == null ||
                !(contentType.equals("image/jpeg")
                        || contentType.equals("image/png")
                        || contentType.equals("image/webp")
                        || contentType.equals("application/pdf"))) {
            throw new RuntimeException("Chỉ hỗ trợ JPG, PNG, WEBP hoặc PDF");
        }
    }
}