package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminUserResponse {

    private Integer userId;

    private String username;

    private String fullName;

    private String email;

    private String phoneNumber;

    private String avatarUrl;

    private String gender;

    private LocalDate birthDate;

    private String role;

    private String accountStatus;

    private Boolean emailVerified;

    private Boolean phoneVerified;

    private LocalDateTime lastLoginAt;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;

    private Boolean hasSellerProfile;

    private Integer sellerId;

    private String sellerStatus;

    private String identityNumber;

    private String taxCode;

    private Integer shopId;

    private String shopName;

    private String shopSlug;

    private String shopStatus;
}
