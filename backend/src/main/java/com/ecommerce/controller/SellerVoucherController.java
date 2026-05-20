package com.ecommerce.controller;

import com.ecommerce.dto.request.SellerVoucherRequest;
import com.ecommerce.dto.response.SellerVoucherResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerVoucherService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/seller/vouchers")
@RequiredArgsConstructor
public class SellerVoucherController {

    private final SellerVoucherService sellerVoucherService;

    @GetMapping
    public ApiResponse<Page<SellerVoucherResponse>> getMyShopVouchers(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                sellerVoucherService.getMyShopVouchers(
                        requireEmail(user),
                        keyword,
                        status,
                        page,
                        size
                )
        );
    }

    @PostMapping
    public ApiResponse<SellerVoucherResponse> createVoucher(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody SellerVoucherRequest request
    ) {
        return ApiResponse.success(
                "Tạo voucher thành công",
                sellerVoucherService.createVoucher(
                        requireEmail(user),
                        request
                )
        );
    }

    @PutMapping("/{voucherId}")
    public ApiResponse<SellerVoucherResponse> updateVoucher(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId,
            @Valid @RequestBody SellerVoucherRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật voucher thành công",
                sellerVoucherService.updateVoucher(
                        requireEmail(user),
                        voucherId,
                        request
                )
        );
    }

    @PatchMapping("/{voucherId}/expire")
    public ApiResponse<SellerVoucherResponse> expireVoucher(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer voucherId
    ) {
        return ApiResponse.success(
                "Đã tắt voucher",
                sellerVoucherService.expireVoucher(
                        requireEmail(user),
                        voucherId
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
