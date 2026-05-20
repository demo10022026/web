package com.ecommerce.controller;

import com.ecommerce.dto.response.VoucherResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.VoucherService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/vouchers")
@RequiredArgsConstructor
public class VoucherController {

    private final VoucherService voucherService;

    @GetMapping("/available")
    public ApiResponse<List<VoucherResponse>> getAvailableVouchers(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String scope
    ) {
        return ApiResponse.success(
                voucherService.getAvailableVouchers(
                        requireEmail(user),
                        scope
                )
        );
    }

    @GetMapping("/my")
    public ApiResponse<List<VoucherResponse>> getMyVouchers(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(
                voucherService.getMyVouchers(
                        requireEmail(user),
                        status
                )
        );
    }

    @PostMapping("/{voucherId}/save")
    public ApiResponse<VoucherResponse> saveVoucher(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId
    ) {
        return ApiResponse.success(
                "Đã lưu voucher",
                voucherService.saveVoucher(
                        requireEmail(user),
                        voucherId
                )
        );
    }

    @DeleteMapping("/{voucherId}/save")
    public ApiResponse<Void> removeSavedVoucher(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId
    ) {
        voucherService.removeSavedVoucher(
                requireEmail(user),
                voucherId
        );

        return ApiResponse.success("Đã bỏ lưu voucher", null);
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
