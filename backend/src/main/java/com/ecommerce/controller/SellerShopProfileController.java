package com.ecommerce.controller;

import com.ecommerce.dto.request.UpsertSellerBankAccountRequest;
import com.ecommerce.dto.response.SellerShopProfileResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerShopProfileService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/seller/shop/profile")
@RequiredArgsConstructor
public class SellerShopProfileController {

    private final SellerShopProfileService sellerShopProfileService;

    @GetMapping
    public ApiResponse<SellerShopProfileResponse> getMyShopProfile(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                sellerShopProfileService.getMyShopProfile(requireEmail(user))
        );
    }

    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SellerShopProfileResponse> updateMyShopProfile(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam String shopName,
            @RequestParam(required = false) String description,
            @RequestParam(required = false) String shopStatus,
            @RequestParam(required = false) MultipartFile avatar,
            @RequestParam(required = false) MultipartFile banner
    ) {
        return ApiResponse.success(
                "Cập nhật thông tin shop thành công",
                sellerShopProfileService.updateMyShopProfile(
                        requireEmail(user),
                        shopName,
                        description,
                        shopStatus,
                        avatar,
                        banner
                )
        );
    }

    @PutMapping("/bank-account")
    public ApiResponse<SellerShopProfileResponse> upsertBankAccount(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody UpsertSellerBankAccountRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật thông tin thanh toán thành công",
                sellerShopProfileService.upsertBankAccount(
                        requireEmail(user),
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
