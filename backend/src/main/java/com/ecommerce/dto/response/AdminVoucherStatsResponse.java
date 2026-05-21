package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class AdminVoucherStatsResponse {

    private long totalVouchers;
    private long activeVouchers;
    private long inactiveVouchers;
    private long upcomingVouchers;
    private long expiredVouchers;
    private long usedOutVouchers;

    private long platformVouchers;
    private long shopVouchers;

    private long totalSavedVouchers;
}
