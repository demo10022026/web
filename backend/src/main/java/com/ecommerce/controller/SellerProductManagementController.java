package com.ecommerce.controller;

import com.ecommerce.dto.request.UpdateSellerProductRequest;
import com.ecommerce.dto.request.UpdateSellerProductStatusRequest;
import com.ecommerce.dto.request.UpdateSellerVariantStockRequest;
import com.ecommerce.dto.response.SellerProductResponse;
import com.ecommerce.exception.AppException;
import com.ecommerce.service.SellerProductManagementService;
import com.ecommerce.util.ApiResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
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
public class SellerProductManagementController {

    private final SellerProductManagementService sellerProductManagementService;

    @GetMapping
    public ApiResponse<Page<SellerProductResponse>> getMyProducts(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.success(
                sellerProductManagementService.getMyProducts(
                        requireEmail(user),
                        keyword,
                        status,
                        page,
                        size
                )
        );
    }

    @GetMapping("/{productId}")
    public ApiResponse<SellerProductResponse> getMyProductDetail(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId
    ) {
        return ApiResponse.success(
                sellerProductManagementService.getMyProductDetail(
                        requireEmail(user),
                        productId
                )
        );
    }

    @PutMapping("/{productId}")
    public ApiResponse<SellerProductResponse> updateProduct(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId,
            @Valid @RequestBody UpdateSellerProductRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật sản phẩm thành công",
                sellerProductManagementService.updateProduct(
                        requireEmail(user),
                        productId,
                        request
                )
        );
    }

    @PatchMapping("/{productId}/status")
    public ApiResponse<SellerProductResponse> updateProductStatus(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId,
            @Valid @RequestBody UpdateSellerProductStatusRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật trạng thái sản phẩm thành công",
                sellerProductManagementService.updateProductStatus(
                        requireEmail(user),
                        productId,
                        request
                )
        );
    }

    @PatchMapping("/{productId}/variants/{variantId}/stock")
    public ApiResponse<SellerProductResponse> updateVariantStock(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId,
            @PathVariable Integer variantId,
            @Valid @RequestBody UpdateSellerVariantStockRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật tồn kho thành công",
                sellerProductManagementService.updateVariantStock(
                        requireEmail(user),
                        productId,
                        variantId,
                        request
                )
        );
    }

    @PostMapping(
            value = "/{productId}/images",
            consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ApiResponse<SellerProductResponse> addProductImages(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId,
            @RequestParam(value = "images", required = false) List<MultipartFile> images
    ) {
        return ApiResponse.success(
                "Thêm ảnh sản phẩm thành công",
                sellerProductManagementService.addProductImages(
                        requireEmail(user),
                        productId,
                        images
                )
        );
    }

    @DeleteMapping("/{productId}/images/{imageId}")
    public ApiResponse<SellerProductResponse> deleteProductImage(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId,
            @PathVariable Integer imageId
    ) {
        return ApiResponse.success(
                "Xóa ảnh sản phẩm thành công",
                sellerProductManagementService.deleteProductImage(
                        requireEmail(user),
                        productId,
                        imageId
                )
        );
    }

    @PatchMapping("/{productId}/images/{imageId}/thumbnail")
    public ApiResponse<SellerProductResponse> setProductThumbnail(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable Integer productId,
            @PathVariable Integer imageId
    ) {
        return ApiResponse.success(
                "Đã đặt ảnh đại diện sản phẩm",
                sellerProductManagementService.setProductThumbnail(
                        requireEmail(user),
                        productId,
                        imageId
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
