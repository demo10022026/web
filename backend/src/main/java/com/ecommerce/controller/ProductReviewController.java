package com.ecommerce.controller;

import com.ecommerce.dto.response.ProductReviewResponse;
import com.ecommerce.dto.response.ProductReviewStatsResponse;
import com.ecommerce.service.ProductReviewService;
import com.ecommerce.util.ApiResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/products/{productId}/reviews")
@RequiredArgsConstructor
public class ProductReviewController {

    private final ProductReviewService productReviewService;

    @GetMapping("/latest")
    public ApiResponse<List<ProductReviewResponse>> getLatestReviews(
            @PathVariable Integer productId,
            @RequestParam(defaultValue = "5") int limit
    ) {
        return ApiResponse.success(
                productReviewService.getLatestProductReviews(productId, limit)
        );
    }

    @GetMapping
    public ApiResponse<Page<ProductReviewResponse>> getReviews(
            @PathVariable Integer productId,
            @RequestParam(required = false) List<Integer> ratings,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return ApiResponse.success(
                productReviewService.getProductReviews(
                        productId,
                        ratings,
                        page,
                        size
                )
        );
    }

    @GetMapping("/stats")
    public ApiResponse<ProductReviewStatsResponse> getStats(
            @PathVariable Integer productId
    ) {
        return ApiResponse.success(
                productReviewService.getProductReviewStats(productId)
        );
    }
}
