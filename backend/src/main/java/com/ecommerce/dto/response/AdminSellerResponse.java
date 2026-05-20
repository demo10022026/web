package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminSellerResponse {

    private Integer sellerId;

    private Integer userId;
    private String username;
    private String fullName;
    private String email;
    private String phoneNumber;
    private String userRole;
    private String accountStatus;

    private String identityNumber;
    private String taxCode;
    private String verificationStatus;
    private String rejectionReason;
    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;

    private ShopInfo shop;
    private List<DocumentInfo> documents;

    @Getter
    @Builder
    public static class ShopInfo {
        private Integer shopId;
        private String shopName;
        private String shopSlug;
        private String description;
        private String avatarUrl;
        private String bannerUrl;
        private String shopStatus;
        private BigDecimal rating;
        private Integer followerCount;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class DocumentInfo {
        private Integer documentId;
        private String documentType;
        private String documentUrl;
        private String verificationStatus;
        private LocalDateTime uploadedAt;
    }
}
