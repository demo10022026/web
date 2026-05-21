package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class ShopFollowStatusResponse {
    private Integer shopId;
    private Boolean following;
    private Long followerCount;
}
