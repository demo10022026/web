package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class ShopResponse {

    private Integer shopId;
    private Integer sellerId;

    private String shopName;
    private String shopSlug;
    private String description;

    private String avatarUrl;
    private String bannerUrl;

    private String shopStatus;

    private BigDecimal rating;
    private Long reviewCount;
    private Integer followerCount;

    private LocalDateTime createdAt;
}
