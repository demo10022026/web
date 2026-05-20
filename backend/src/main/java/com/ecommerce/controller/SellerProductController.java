package com.ecommerce.controller;

import com.ecommerce.dto.request.CreateSellerProductRequest;
import com.ecommerce.dto.response.SellerProductOptionsResponse;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerProductService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/seller/products")
@RequiredArgsConstructor
public class SellerProductController {

    private final SellerProductService sellerProductService;

    @GetMapping("/options")
    public ApiResponse<SellerProductOptionsResponse> getOptions() {
        return ApiResponse.success(
                sellerProductService.getCreateOptions()
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<SellerProductResponse> createProduct(
            @AuthenticationPrincipal UserDetails user,
            @Valid @ModelAttribute CreateSellerProductRequest request,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        return ApiResponse.success(
                "Thêm sản phẩm thành công",
                sellerProductService.createProduct(
                        requireEmail(user),
                        request,
                        images
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