package com.ecommerce.controller;

import com.ecommerce.dto.request.SellerReviewRequest;
import com.ecommerce.dto.response.AdminSellerResponse;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.service.AdminSellerService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/sellers")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminSellerController {

    private final AdminSellerService adminSellerService;

    @GetMapping
    public ApiResponse<Page<AdminSellerResponse>> getSellers(
            @RequestParam(required = false) SellerProfile.Status status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(
                page,
                size,
                Sort.by("createdAt").descending()
        );

        return ApiResponse.success(
                adminSellerService.getSellers(status, pageable)
        );
    }

    @GetMapping("/{sellerId}")
    public ApiResponse<AdminSellerResponse> getSellerDetail(
            @PathVariable Integer sellerId
    ) {
        return ApiResponse.success(
                adminSellerService.getSellerDetail(sellerId)
        );
    }

    @PatchMapping("/{sellerId}/review")
    public ApiResponse<AdminSellerResponse> reviewSeller(
            @PathVariable Integer sellerId,
            @Valid @RequestBody SellerReviewRequest request
    ) {
        AdminSellerResponse data = adminSellerService.reviewSeller(
                sellerId,
                request
        );

        String message = Boolean.TRUE.equals(request.getApproved())
                ? "Đã duyệt seller"
                : "Đã từ chối seller";

        return ApiResponse.success(message, data);
    }
}