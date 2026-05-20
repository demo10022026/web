package com.ecommerce.controller;

import com.ecommerce.dto.response.ProductDtos;
import com.ecommerce.service.impl.ProductServiceImpl;
import com.ecommerce.util.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products")
@RequiredArgsConstructor
@Tag(name = "Products")
public class ProductController {

    private final ProductServiceImpl productService;

    @GetMapping
    @Operation(summary = "Tìm kiếm & lọc sản phẩm")
    public ResponseEntity<ApiResponse<Page<ProductDtos.ProductSummary>>> getProducts(
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) Integer parentCategoryId,
            @RequestParam(required = false) Integer categoryId,
            @RequestParam(required = false) Integer brandId,
            @RequestParam(required = false) String shopName,
            @RequestParam(required = false) String brandName,
            @RequestParam(required = false) Long minPrice,
            @RequestParam(required = false) Long maxPrice,
            @RequestParam(defaultValue = "newest") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Page<ProductDtos.ProductSummary> result = productService.searchProducts(
                keyword,
                parentCategoryId,
                categoryId,
                brandId,
                shopName,
                brandName,
                minPrice,
                maxPrice,
                sort,
                page,
                size
        );

        return ResponseEntity.ok(ApiResponse.success(result));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết sản phẩm")
    public ResponseEntity<ApiResponse<ProductDtos.ProductDetail>> getDetail(
            @PathVariable Integer id
    ) {
        return ResponseEntity.ok(
                ApiResponse.success(productService.getProductDetail(id))
        );
    }

    @GetMapping("/categories")
    @Operation(summary = "Danh mục sản phẩm dạng cây")
    public ResponseEntity<ApiResponse<List<ProductDtos.CategoryDto>>> getCategories() {
        return ResponseEntity.ok(
                ApiResponse.success(productService.getCategoryTree())
        );
    }
}