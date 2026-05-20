package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class SellerShopProfileResponse {

    private Integer shopId;
    private Integer sellerId;

    private String shopName;
    private String shopSlug;
    private String description;
    private String avatarUrl;
    private String bannerUrl;
    private String shopStatus;

    private BigDecimal rating;
    private Integer followerCount;
    private LocalDateTime createdAt;

    private BankAccount bankAccount;

    @Getter
    @Builder
    public static class BankAccount {
        private Integer bankAccountId;
        private String bankName;
        private String accountHolder;
        private String accountNumber;
        private String maskedAccountNumber;
        private Boolean isPrimary;
        private LocalDateTime createdAt;
    }
}
