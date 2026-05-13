package com.ecommerce.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
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
            @Value("${app.cloudinary.api-secret}") String apiSecret) {
        this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret));
    }

    /**
     * Upload ảnh: ưu tiên local, fallback sang Cloudinary nếu local lỗi
     */
    public String upload(MultipartFile file, String folder) {
        if (useLocal) {
            try {
                return uploadLocal(file, folder);
            } catch (Exception e) {
                log.warn("Local upload thất bại, chuyển sang Cloudinary: {}", e.getMessage());
                return uploadCloudinary(file, folder);
            }
        }
        return uploadCloudinary(file, folder);
    }

    /**
     * Lưu file vào thư mục uploads/ trên server
     */
    private String uploadLocal(MultipartFile file, String folder) throws IOException {
        String ext = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID() + ext;

        Path dir = Paths.get(localDir, folder);
        Files.createDirectories(dir);

        Path dest = dir.resolve(filename);
        Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);

        // Trả về URL để FE có thể truy cập
        String url = baseUrl + contextPath + "/files/" + folder + "/" + filename;
        log.info("Đã lưu file local: {}", url);
        return url;
    }

    /**
     * Upload lên Cloudinary
     */
    private String uploadCloudinary(MultipartFile file, String folder) {
        try {
            Map<?, ?> result = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap("folder", "shopvn/" + folder));
            String url = (String) result.get("secure_url");
            log.info("Đã upload Cloudinary: {}", url);
            return url;
        } catch (IOException e) {
            throw new RuntimeException("Upload Cloudinary thất bại: " + e.getMessage());
        }
    }

    /**
     * Xóa file local theo URL
     */
    public void deleteLocal(String fileUrl) {
        try {
            String path = fileUrl.replace(baseUrl + contextPath + "/files/", "");
            Path file = Paths.get(localDir, path);
            Files.deleteIfExists(file);
        } catch (IOException e) {
            log.warn("Không xóa được file: {}", e.getMessage());
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) return ".jpg";
        return filename.substring(filename.lastIndexOf(".")).toLowerCase();
    }
}
