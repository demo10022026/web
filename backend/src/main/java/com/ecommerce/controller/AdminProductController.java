package com.ecommerce.controller;

import com.ecommerce.dto.request.AdminProductStatusRequest;
import com.ecommerce.dto.request.AdminProductUpdateRequest;
import com.ecommerce.dto.response.AdminProductDetailResponse;
import com.ecommerce.dto.response.AdminProductResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.service.AdminProductService;
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
@RequestMapping("/admin/products")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MANAGER')")
public class AdminProductController {

    private final AdminProductService adminProductService;

    @GetMapping
    public ApiResponse<Page<AdminProductResponse>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Product.Status status,
            @RequestParam(required = false) Integer shopId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer brandId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        Sort sort = direction.equalsIgnoreCase("asc")
                ? Sort.by(sortBy).ascending()
                : Sort.by(sortBy).descending();

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<AdminProductResponse> data = adminProductService.getProducts(
                keyword,
                status,
                shopId,
                categoryId,
                brandId,
                pageable
        );

        return ApiResponse.success(data);
    }

    @GetMapping("/{productId}")
    public ApiResponse<AdminProductDetailResponse> getProductDetail(
            @PathVariable Integer productId
    ) {
        return ApiResponse.success(adminProductService.getProductDetail(productId));
    }

    @PutMapping("/{productId}")
    public ApiResponse<AdminProductDetailResponse> updateProduct(
            @PathVariable Integer productId,
            @Valid @RequestBody AdminProductUpdateRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật sản phẩm thành công",
                adminProductService.updateProduct(productId, request)
        );
    }

    @PatchMapping("/{productId}/status")
    public ApiResponse<AdminProductResponse> updateStatus(
            @PathVariable Integer productId,
            @Valid @RequestBody AdminProductStatusRequest request
    ) {
        return ApiResponse.success(
                "Cập nhật trạng thái sản phẩm thành công",
                adminProductService.updateStatus(productId, request)
        );
    }

    @DeleteMapping("/{productId}")
    public ApiResponse<AdminProductResponse> softDelete(
            @PathVariable Integer productId
    ) {
        return ApiResponse.success(
                "Đã ẩn sản phẩm",
                adminProductService.softDelete(productId)
        );
    }
}