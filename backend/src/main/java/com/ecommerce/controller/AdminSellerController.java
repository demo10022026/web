package com.ecommerce.controller;

import com.ecommerce.dto.request.AdminReviewSellerRequest;
import com.ecommerce.dto.request.AdminSuspendSellerRequest;
import com.ecommerce.dto.response.AdminSellerResponse;
import com.ecommerce.dto.response.AdminSellerStatsResponse;
import com.ecommerce.service.AdminSellerService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/admin/sellers")
@RequiredArgsConstructor
public class AdminSellerController {

    private final AdminSellerService adminSellerService;

    @GetMapping("/stats")
    public ApiResponse<AdminSellerStatsResponse> getStats() {
        return ApiResponse.success(adminSellerService.getStats());
    }

    @GetMapping
    public ApiResponse<Page<AdminSellerResponse>> listSellers(
            @RequestParam(required = false, defaultValue = "pending") String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(adminSellerService.listSellers(
                status,
                keyword,
                page,
                size
        ));
    }

    @GetMapping("/active")
    public ApiResponse<Page<AdminSellerResponse>> listActiveSellers(
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return ApiResponse.success(adminSellerService.listSellers(
                "approved",
                keyword,
                page,
                size
        ));
    }

    @GetMapping("/{sellerId}")
    public ApiResponse<AdminSellerResponse> getSellerDetail(
            @PathVariable Integer sellerId
    ) {
        return ApiResponse.success(adminSellerService.getSellerDetail(sellerId));
    }

    @PatchMapping("/{sellerId}/review")
    public ApiResponse<AdminSellerResponse> reviewSeller(
            @PathVariable Integer sellerId,
            @Valid @RequestBody AdminReviewSellerRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật kết quả duyệt seller thành công",
                adminSellerService.reviewSeller(sellerId, request)
        );
    }

    @PatchMapping("/{sellerId}/suspend")
    public ApiResponse<AdminSellerResponse> suspendSeller(
            @PathVariable Integer sellerId,
            @RequestBody(required = false) AdminSuspendSellerRequest request
    ) {
        return ApiResponse.success(
                "Đã tạm khóa seller",
                adminSellerService.suspendSeller(sellerId, request)
        );
    }

    @PatchMapping("/{sellerId}/reactivate")
    public ApiResponse<AdminSellerResponse> reactivateSeller(
            @PathVariable Integer sellerId
    ) {
        return ApiResponse.success(
                "Đã kích hoạt lại seller",
                adminSellerService.reactivateSeller(sellerId)
        );
    }

    // Legacy endpoints để không vỡ code cũ.
    @GetMapping("/pending")
    public ApiResponse<List<AdminSellerResponse>> getPendingSellersLegacy() {
        return ApiResponse.success(adminSellerService.getPendingSellersLegacy());
    }

    @PutMapping("/{sellerId}/approve")
    public ApiResponse<AdminSellerResponse> approveSellerLegacy(
            @PathVariable Integer sellerId
    ) {
        return ApiResponse.success(
                "Đã duyệt seller",
                adminSellerService.approveSellerLegacy(sellerId)
        );
    }

    @PutMapping("/{sellerId}/reject")
    public ApiResponse<AdminSellerResponse> rejectSellerLegacy(
            @PathVariable Integer sellerId,
            @RequestBody Map<String, String> body
    ) {
        return ApiResponse.success(
                "Đã từ chối seller",
                adminSellerService.rejectSellerLegacy(
                        sellerId,
                        body == null ? null : body.get("reason")
                )
        );
    }
}
