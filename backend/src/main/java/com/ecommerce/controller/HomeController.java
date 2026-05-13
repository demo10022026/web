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
import java.util.Map;

@RestController
@RequestMapping("/home")
@RequiredArgsConstructor
@Tag(name = "Home")
public class HomeController {

    private final ProductServiceImpl productService;

    @GetMapping
    @Operation(summary = "Lấy dữ liệu trang chủ: flash sale, sản phẩm mới, bán chạy")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getHomeData() {
        List<ProductDtos.FlashSaleProduct> flashSale = productService.getFlashSaleProducts(8);
        List<ProductDtos.ProductSummary> newProducts  = productService.getNewProducts(8);
        List<ProductDtos.ProductSummary> bestSellers  = productService.getBestSellers(8);
        List<ProductDtos.CategoryDto>    categories   = productService.getCategoryTree();

        return ResponseEntity.ok(ApiResponse.success(Map.of(
            "flashSale",   flashSale,
            "newProducts", newProducts,
            "bestSellers", bestSellers,
            "categories",  categories
        )));
    }

    @GetMapping("/flash-sale")
    public ResponseEntity<ApiResponse<List<ProductDtos.FlashSaleProduct>>> getFlashSale(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(productService.getFlashSaleProducts(limit)));
    }

    @GetMapping("/new-products")
    public ResponseEntity<ApiResponse<List<ProductDtos.ProductSummary>>> getNewProducts(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(productService.getNewProducts(limit)));
    }

    @GetMapping("/best-sellers")
    public ResponseEntity<ApiResponse<List<ProductDtos.ProductSummary>>> getBestSellers(
            @RequestParam(defaultValue = "20") int limit) {
        return ResponseEntity.ok(ApiResponse.success(productService.getBestSellers(limit)));
    }
}
