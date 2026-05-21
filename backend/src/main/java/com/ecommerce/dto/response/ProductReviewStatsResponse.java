package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.util.Map;

@Getter
@Builder
public class ProductReviewStatsResponse {

    private Integer productId;
    private BigDecimal averageRating;
    private Long reviewCount;

    /** key: số sao 1..5, value: số đánh giá */
    private Map<Integer, Long> ratingCounts;
}
