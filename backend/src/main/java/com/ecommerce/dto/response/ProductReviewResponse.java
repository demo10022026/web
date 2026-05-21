package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class ProductReviewResponse {

    private Integer reviewId;
    private Integer orderItemId;

    private Integer productId;
    private String productName;

    private Integer userId;
    private String username;
    private String userFullName;
    private String userAvatarUrl;

    private Integer rating;
    private String reviewContent;

    private Boolean verifiedPurchase;
    private LocalDateTime createdAt;
}
