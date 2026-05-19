package com.ecommerce.controller.seller;

import com.ecommerce.dto.request.ApplySellerRequest;
import com.ecommerce.dto.response.SellerProfileResponse;
import com.ecommerce.entity.SellerDocument;
import com.ecommerce.service.SellerOnboardingService;
import com.ecommerce.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/seller")
@RequiredArgsConstructor
@SecurityRequirement(name = "Bearer Authentication")
@Tag(name = "Seller — Đăng ký (Bước 1)")
public class SellerOnboardingController {

    private final SellerOnboardingService service;

    /**
     * POST /api/seller/apply
     * Bước 1a — Nộp đơn đăng ký seller
     */
    @PostMapping("/apply")
    @Operation(summary = "Bước 1a — Nộp đơn đăng ký seller")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> apply(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ApplySellerRequest request) {

        SellerProfileResponse data = service.apply(user.getUsername(), request);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        "Đơn đã gửi. Vui lòng upload giấy tờ xác minh.", data));
    }

    /**
     * POST /api/seller/documents
     * Bước 1b — Upload giấy tờ xác minh
     * Form-data: type (citizen_id | business_license | tax_document), file
     */
    @PostMapping(value = "/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Bước 1b — Upload giấy tờ (CMND, GPKD, thuế)")
    public ResponseEntity<ApiResponse<SellerProfileResponse.DocumentResponse>> uploadDocument(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam("type") SellerDocument.DocType docType,
            @RequestParam("file") MultipartFile file) {

        if (file == null || file.isEmpty()) {
            return ResponseEntity
                    .badRequest()
                    .body(ApiResponse.error("File không được để trống", "EMPTY_FILE"));
        }

        SellerProfileResponse.DocumentResponse data =
                service.uploadDocument(user.getUsername(), docType, file);

        return ResponseEntity.ok(ApiResponse.success("Upload thành công", data));
    }

    /**
     * GET /api/seller/me
     * Lấy trạng thái hồ sơ seller hiện tại
     */
    @GetMapping("/me")
    @Operation(summary = "Xem trạng thái hồ sơ seller")
    public ResponseEntity<ApiResponse<SellerProfileResponse>> getMyProfile(
            @AuthenticationPrincipal UserDetails user) {

        return ResponseEntity.ok(
                ApiResponse.success(service.getMyProfile(user.getUsername())));
    }
}
