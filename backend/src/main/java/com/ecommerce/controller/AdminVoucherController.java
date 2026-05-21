package com.ecommerce.controller;

import com.ecommerce.dto.response.AdminVoucherShopLookupResponse;
import com.ecommerce.dto.request.AdminUpdateVoucherStatusRequest;
import com.ecommerce.dto.request.AdminVoucherRequest;
import com.ecommerce.dto.response.AdminVoucherResponse;
import com.ecommerce.dto.response.AdminVoucherStatsResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.AdminVoucherService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/admin/vouchers")
@RequiredArgsConstructor
public class AdminVoucherController {

    private final AdminVoucherService adminVoucherService;

    @GetMapping
    public ApiResponse<Page<AdminVoucherResponse>> getVouchers(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String scope,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        requireEmail(user);

        return ApiResponse.success(
                adminVoucherService.getVouchers(
                        scope,
                        status,
                        keyword,
                        page,
                        size
                )
        );
    }

    @GetMapping("/stats")
    public ApiResponse<AdminVoucherStatsResponse> getStats(
            @AuthenticationPrincipal UserDetails user
    ) {
        requireEmail(user);

        return ApiResponse.success(adminVoucherService.getStats());
    }

    @GetMapping("/{voucherId}")
    public ApiResponse<AdminVoucherResponse> getVoucherDetail(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId
    ) {
        requireEmail(user);

        return ApiResponse.success(
                adminVoucherService.getVoucherDetail(voucherId)
        );
    }

    @GetMapping("/shops/{shopId}")
    public ApiResponse<AdminVoucherShopLookupResponse> getShopLookup(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer shopId
    ) {
        requireEmail(user);

        return ApiResponse.success(
                adminVoucherService.getShopLookup(shopId)
        );
    }

    @PostMapping
    public ApiResponse<AdminVoucherResponse> createVoucher(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody AdminVoucherRequest request
    ) {
        return ApiResponse.success(
                "Tạo voucher thành công",
                adminVoucherService.createVoucher(
                        requireEmail(user),
                        request
                )
        );
    }

    @PutMapping("/{voucherId}")
    public ApiResponse<AdminVoucherResponse> updateVoucher(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId,
            @Valid @RequestBody AdminVoucherRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật voucher thành công",
                adminVoucherService.updateVoucher(
                        requireEmail(user),
                        voucherId,
                        request
                )
        );
    }

    @PatchMapping("/{voucherId}/status")
    public ApiResponse<AdminVoucherResponse> updateVoucherStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId,
            @Valid @RequestBody AdminUpdateVoucherStatusRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật trạng thái voucher thành công",
                adminVoucherService.updateVoucherStatus(
                        requireEmail(user),
                        voucherId,
                        request
                )
        );
    }

    private String requireEmail(UserDetails user) {
        if (user == null) {
            throw new AppException(
                    "Phiên đăng nhập đã hết hạn",
                    HttpStatus.UNAUTHORIZED,
                    "UNAUTHORIZED"
            );
        }

        return user.getUsername();
    }
}
