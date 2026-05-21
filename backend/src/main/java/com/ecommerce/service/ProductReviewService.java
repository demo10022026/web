package com.ecommerce.service;

import com.ecommerce.dto.response.ProductReviewResponse;
import com.ecommerce.dto.response.ProductReviewStatsResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface ProductReviewService {

    List<ProductReviewResponse> getLatestProductReviews(
            Integer productId,
            int limit
    );

    Page<ProductReviewResponse> getProductReviews(
            Integer productId,
            List<Integer> ratings,
            int page,
            int size
    );

    ProductReviewStatsResponse getProductReviewStats(Integer productId);
}
