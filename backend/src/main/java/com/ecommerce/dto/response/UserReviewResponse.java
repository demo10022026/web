package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class UserReviewResponse {

    private Integer reviewId;

    private Integer orderItemId;

    private Integer productId;
    private String productName;

    private Integer rating;
    private String reviewContent;

    private LocalDateTime createdAt;
}
