package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminSellerResponse {

    private Integer sellerId;

    private String fullName;
    private String email;
    private String phoneNumber;

    private String identityNumber;
    private String taxCode;

    private String verificationStatus;
    private String rejectionReason;

    private LocalDateTime verifiedAt;
    private LocalDateTime createdAt;

    private List<DocumentResponse> documents;

    @Getter
    @Builder
    public static class DocumentResponse {
        private Integer documentId;
        private String documentType;
        private String documentUrl;
        private String verificationStatus;
        private LocalDateTime uploadedAt;
    }
}