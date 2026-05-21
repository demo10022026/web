package com.ecommerce.service.impl;

import com.ecommerce.dto.response.ProductReviewResponse;
import com.ecommerce.dto.response.ProductReviewStatsResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Review;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.service.ProductReviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductReviewServiceImpl implements ProductReviewService {

    private final ProductRepository productRepo;
    private final ReviewRepository reviewRepo;

    @Override
    public List<ProductReviewResponse> getLatestProductReviews(
            Integer productId,
            int limit
    ) {
        Product product = findActiveProduct(productId);

        int safeLimit = Math.min(Math.max(limit, 1), 20);

        return reviewRepo.findByProductOrderByCreatedAtDesc(
                        product,
                        PageRequest.of(0, safeLimit)
                )
                .getContent()
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public Page<ProductReviewResponse> getProductReviews(
            Integer productId,
            List<Integer> ratings,
            int page,
            int size
    ) {
        Product product = findActiveProduct(productId);
        List<Integer> cleanRatings = normalizeRatings(ratings);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 50)
        );

        Page<Review> reviews = cleanRatings.isEmpty()
                ? reviewRepo.findByProductOrderByCreatedAtDesc(product, pageable)
                : reviewRepo.findByProductAndRatingInOrderByCreatedAtDesc(
                        product,
                        cleanRatings,
                        pageable
                );

        return reviews.map(this::toResponse);
    }

    @Override
    public ProductReviewStatsResponse getProductReviewStats(Integer productId) {
        Product product = findActiveProduct(productId);

        long reviewCount = reviewRepo.countByProduct(product);
        Double avg = reviewRepo.averageRatingByProduct(product);

        Map<Integer, Long> ratingCounts = new LinkedHashMap<>();
        for (int rating = 5; rating >= 1; rating--) {
            ratingCounts.put(rating, reviewRepo.countByProductAndRating(product, rating));
        }

        return ProductReviewStatsResponse.builder()
                .productId(product.getProductId())
                .averageRating(avg == null
                        ? BigDecimal.ZERO
                        : BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP))
                .reviewCount(reviewCount)
                .ratingCounts(ratingCounts)
                .build();
    }

    private Product findActiveProduct(Integer productId) {
        return productRepo.findById(productId)
                .filter(product -> product.getProductStatus() == Product.Status.active)
                .orElseThrow(() -> AppException.notFound("Sản phẩm"));
    }

    private List<Integer> normalizeRatings(List<Integer> ratings) {
        if (ratings == null || ratings.isEmpty()) {
            return List.of();
        }

        return ratings.stream()
                .filter(rating -> rating != null && rating >= 1 && rating <= 5)
                .distinct()
                .sorted()
                .toList();
    }

    private ProductReviewResponse toResponse(Review review) {
        Product product = review.getProduct();
        User user = review.getUser();
        OrderItemSafe orderItem = getOrderItemSafe(review);

        return ProductReviewResponse.builder()
                .reviewId(review.getReviewId())
                .orderItemId(orderItem.orderItemId())

                .productId(product == null ? null : product.getProductId())
                .productName(product == null ? null : product.getProductName())

                .userId(user == null ? null : user.getUserId())
                .username(user == null ? null : user.getUsername())
                .userFullName(user == null ? null : user.getFullName())
                .userAvatarUrl(user == null ? null : user.getAvatarUrl())

                .rating(review.getRating())
                .reviewContent(review.getReviewContent())
                .verifiedPurchase(orderItem.orderItemId() != null)
                .createdAt(review.getCreatedAt())
                .build();
    }

    private OrderItemSafe getOrderItemSafe(Review review) {
        if (review.getOrderItem() == null) {
            return new OrderItemSafe(null);
        }

        return new OrderItemSafe(review.getOrderItem().getOrderItemId());
    }

    private record OrderItemSafe(Integer orderItemId) {
    }
}
