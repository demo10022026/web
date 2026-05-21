package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminVoucherResponse {

    private Integer voucherId;

    private String code;
    private String voucherName;

    private String discountType;
    private BigDecimal discountValue;
    private BigDecimal maxDiscountAmount;
    private BigDecimal minOrderAmount;

    private String scope;
    private Integer shopId;
    private String shopName;
    private String shopSlug;

    private Integer usageLimit;
    private Integer usedCount;
    private Integer remainingCount;
    private Integer perUserLimit;

    private Long savedCount;
    private Long userUsedCount;

    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private LocalDateTime createdAt;

    private String voucherStatus;
    private String rawStatus;
}
