package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class FollowingShopResponse {
    private Integer shopId;
    private String shopName;
    private String shopSlug;
    private String avatarUrl;
    private String bannerUrl;
    private String description;
    private String shopStatus;
    private BigDecimal rating;
    private Integer followerCount;
    private LocalDateTime followedAt;
}
