package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateShopRequest;
import com.ecommerce.dto.response.ShopResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerShopService;
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
@RequestMapping("/seller/shop")
@RequiredArgsConstructor
public class SellerShopController {

    private final SellerShopService sellerShopService;

    @GetMapping("/me")
    public ApiResponse<ShopResponse> getMyShop(
            @AuthenticationPrincipal UserDetails user
    ) {
        return ApiResponse.success(
                sellerShopService.getMyShop(requireEmail(user))
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ShopResponse> createShop(
            @AuthenticationPrincipal UserDetails user,
            @Valid @ModelAttribute CreateShopRequest request,
            @RequestParam(value = "avatar", required = false) MultipartFile avatar,
            @RequestParam(value = "banner", required = false) MultipartFile banner
    ) {
        return ApiResponse.success(
                "Tạo shop thành công",
                sellerShopService.createShop(
                        requireEmail(user),
                        request,
                        avatar,
                        banner
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