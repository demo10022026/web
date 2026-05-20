package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminSellerStatsResponse {
    private long totalSellers;
    private long pendingSellers;
    private long approvedSellers;
    private long rejectedSellers;
    private long suspendedSellers;
    private long activeShops;
    private long suspendedShops;
    private long hiddenShops;
}
