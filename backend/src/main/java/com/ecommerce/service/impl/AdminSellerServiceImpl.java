package com.ecommerce.service.impl;

import com.ecommerce.dto.request.SellerReviewRequest;
import com.ecommerce.dto.response.AdminSellerResponse;
import com.ecommerce.entity.SellerDocument;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.SellerDocumentRepository;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.AdminSellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminSellerServiceImpl implements AdminSellerService {

    private final SellerRepository sellerRepo;
    private final SellerDocumentRepository docRepo;
    private final UserRepository userRepo;

    @Override
    @Transactional(readOnly = true)
    public Page<AdminSellerResponse> getSellers(
            SellerProfile.Status status,
            Pageable pageable
    ) {
        Page<SellerProfile> page;

        if (status == null) {
            page = sellerRepo.findAll(pageable);
        } else {
            page = sellerRepo.findByVerificationStatus(status, pageable);
        }

        return page.map(this::toResponse);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminSellerResponse getSellerDetail(Integer sellerId) {
        SellerProfile profile = findSeller(sellerId);
        return toResponse(profile);
    }

    @Override
    @Transactional
    public AdminSellerResponse reviewSeller(
            Integer sellerId,
            SellerReviewRequest request
    ) {
        SellerProfile profile = findSeller(sellerId);

        if (profile.getVerificationStatus() != SellerProfile.Status.pending) {
            throw new AppException(
                    "Chỉ có thể duyệt hồ sơ đang chờ xử lý",
                    HttpStatus.CONFLICT,
                    "SELLER_NOT_PENDING"
            );
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            approve(profile);
        } else {
            reject(profile, request.getRejectionReason());
        }

        SellerProfile saved = sellerRepo.save(profile);
        return toResponse(saved);
    }

    private void approve(SellerProfile profile) {
        profile.setVerificationStatus(SellerProfile.Status.approved);
        profile.setVerifiedAt(LocalDateTime.now());
        profile.setRejectionReason(null);

        User user = profile.getUser();
        user.setRole(User.Role.seller);
        userRepo.save(user);

        List<SellerDocument> docs = docRepo.findBySeller(profile);
        for (SellerDocument doc : docs) {
            doc.setVerificationStatus(SellerDocument.VerifyStatus.approved);
        }
        docRepo.saveAll(docs);
    }

    private void reject(SellerProfile profile, String reason) {
        if (reason == null || reason.trim().isEmpty()) {
            throw new AppException(
                    "Vui lòng nhập lý do từ chối",
                    HttpStatus.BAD_REQUEST,
                    "REJECTION_REASON_REQUIRED"
            );
        }

        profile.setVerificationStatus(SellerProfile.Status.rejected);
        profile.setVerifiedAt(null);
        profile.setRejectionReason(reason.trim());

        List<SellerDocument> docs = docRepo.findBySeller(profile);
        for (SellerDocument doc : docs) {
            doc.setVerificationStatus(SellerDocument.VerifyStatus.rejected);
        }
        docRepo.saveAll(docs);
    }

    private SellerProfile findSeller(Integer sellerId) {
        return sellerRepo.findById(sellerId)
                .orElseThrow(() -> AppException.notFound("Hồ sơ seller"));
    }

    private AdminSellerResponse toResponse(SellerProfile p) {
        List<AdminSellerResponse.DocumentResponse> docs = docRepo
                .findBySeller(p)
                .stream()
                .map(this::toDocResponse)
                .toList();

        User user = p.getUser();

        return AdminSellerResponse.builder()
                .sellerId(p.getSellerId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .identityNumber(p.getIdentityNumber())
                .taxCode(p.getTaxCode())
                .verificationStatus(p.getVerificationStatus().name())
                .rejectionReason(p.getRejectionReason())
                .verifiedAt(p.getVerifiedAt())
                .createdAt(p.getCreatedAt())
                .documents(docs)
                .build();
    }

    private AdminSellerResponse.DocumentResponse toDocResponse(SellerDocument d) {
        return AdminSellerResponse.DocumentResponse.builder()
                .documentId(d.getDocumentId())
                .documentType(d.getDocumentType().name())
                .documentUrl(d.getDocumentUrl())
                .verificationStatus(d.getVerificationStatus().name())
                .uploadedAt(d.getUploadedAt())
                .build();
    }
}