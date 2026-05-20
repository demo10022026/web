package com.ecommerce.service.impl;

import com.ecommerce.dto.request.ApplySellerRequest;
import com.ecommerce.dto.response.SellerProfileResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.*;
import com.ecommerce.service.ImageStorageService;
import com.ecommerce.service.SellerOnboardingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.ecommerce.util.UploadFolders;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class SellerOnboardingServiceImpl implements SellerOnboardingService {

    private final UserRepository           userRepo;
    private final SellerRepository         sellerRepo;
    private final SellerDocumentRepository docRepo;
    private final ImageStorageService      imageStorage;

    // ─────────────────────────────────────────────────────────
    // 1. Apply
    // ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public SellerProfileResponse apply(String userEmail, ApplySellerRequest request) {
        User user = findUser(userEmail);

        if (sellerRepo.existsByUser(user)) {
            SellerProfile existing = sellerRepo.findByUser(user).orElseThrow();

            switch (existing.getVerificationStatus()) {
                case approved:
                    throw new AppException(
                            "Bạn đã là seller",
                            HttpStatus.CONFLICT, "ALREADY_SELLER");
                case pending:
                    throw new AppException(
                            "Hồ sơ đang chờ xét duyệt",
                            HttpStatus.CONFLICT, "APPLICATION_PENDING");
                case rejected:
                    // Cho phép nộp lại
                    existing.setIdentityNumber(request.getIdentityNumber());
                    existing.setTaxCode(request.getTaxCode());
                    existing.setVerificationStatus(SellerProfile.Status.pending);
                    existing.setRejectionReason(null);
                    log.info("Seller {} nộp lại hồ sơ", userEmail);
                    return toResponse(sellerRepo.save(existing));
                default:
                    throw new AppException(
                            "Tài khoản seller bị tạm khóa, vui lòng liên hệ hỗ trợ",
                            HttpStatus.FORBIDDEN, "SELLER_SUSPENDED");
            }
        }

        SellerProfile profile = SellerProfile.builder()
                .user(user)
                .identityNumber(request.getIdentityNumber())
                .taxCode(request.getTaxCode())
                .verificationStatus(SellerProfile.Status.pending)
                .build();

        log.info("Tạo hồ sơ seller mới: {}", userEmail);
        return toResponse(sellerRepo.save(profile));
    }

    // ─────────────────────────────────────────────────────────
    // 2. Upload giấy tờ
    // ─────────────────────────────────────────────────────────
    @Override
    @Transactional
    public SellerProfileResponse.DocumentResponse uploadDocument(
            String userEmail,
            SellerDocument.DocType docType,
            MultipartFile file
    ) {
        SellerProfile profile = findProfile(userEmail);

        validateCanChangeDocument(profile);
        validateDocumentChangeLimit(profile, docType);

        String folder = UploadFolders.sellerDocument(profile.getSellerId(), docType);

        // Upload file mới trước.
        // Nếu upload lỗi thì không mất giấy tờ cũ.
        String url = imageStorage.upload(file, folder);

        // Sau khi upload thành công mới xóa bản cũ cùng loại.
        docRepo.deleteBySellerAndDocumentType(profile, docType);

        SellerDocument doc = SellerDocument.builder()
                .seller(profile)
                .documentType(docType)
                .documentUrl(url)
                .verificationStatus(SellerDocument.VerifyStatus.pending)
                .build();

        // Nếu hồ sơ từng bị từ chối, user thay giấy tờ thì đưa về chờ duyệt lại.
        if (profile.getVerificationStatus() == SellerProfile.Status.rejected) {
            profile.setVerificationStatus(SellerProfile.Status.pending);
            profile.setRejectionReason(null);
            profile.setVerifiedAt(null);
            sellerRepo.save(profile);
        }

        log.info("Seller {} thay đổi/upload {} thành công", userEmail, docType);

        return toDocResponse(docRepo.save(doc));
    }

    // ─────────────────────────────────────────────────────────
    // 3. Lấy trạng thái hồ sơ
    // ─────────────────────────────────────────────────────────
    @Override
    @Transactional(readOnly = true)
    public SellerProfileResponse getMyProfile(String userEmail) {
        return toResponse(findProfile(userEmail));
    }

    // ─────────────────────────────────────────────────────────
    // Helpers
    // ─────────────────────────────────────────────────────────
    private User findUser(String email) {
        return userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));
    }

    private SellerProfile findProfile(String email) {
        User user = findUser(email);
        return sellerRepo.findByUser(user)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa đăng ký làm seller",
                        HttpStatus.FORBIDDEN, "NOT_SELLER"));
    }

    private SellerProfileResponse toResponse(SellerProfile p) {
        List<SellerProfileResponse.DocumentResponse> docs = docRepo
                .findBySeller(p).stream()
                .map(this::toDocResponse)
                .collect(Collectors.toList());

        return SellerProfileResponse.builder()
                .sellerId(p.getSellerId())
                .fullName(p.getUser().getFullName())
                .email(p.getUser().getEmail())
                .identityNumber(p.getIdentityNumber())
                .taxCode(p.getTaxCode())
                .verificationStatus(p.getVerificationStatus().name())
                .rejectionReason(p.getRejectionReason())
                .verifiedAt(p.getVerifiedAt())
                .createdAt(p.getCreatedAt())
                .documents(docs)
                .build();
    }

    private SellerProfileResponse.DocumentResponse toDocResponse(SellerDocument d) {
        return SellerProfileResponse.DocumentResponse.builder()
                .documentId(d.getDocumentId())
                .documentType(d.getDocumentType().name())
                .documentUrl(d.getDocumentUrl())
                .verificationStatus(d.getVerificationStatus().name())
                .uploadedAt(d.getUploadedAt())
                .build();
    }

    private void validateCanChangeDocument(SellerProfile profile) {
        if (profile.getVerificationStatus() == SellerProfile.Status.approved) {
            throw new AppException(
                    "Hồ sơ đã được duyệt, không thể thay đổi giấy tờ",
                    HttpStatus.CONFLICT,
                    "SELLER_ALREADY_APPROVED"
            );
        }

        if (profile.getVerificationStatus() == SellerProfile.Status.suspended) {
            throw new AppException(
                    "Tài khoản seller đang bị tạm khóa",
                    HttpStatus.FORBIDDEN,
                    "SELLER_SUSPENDED"
            );
        }
    }

    private void validateDocumentChangeLimit(
            SellerProfile profile,
            SellerDocument.DocType docType
    ) {
        docRepo.findFirstBySellerAndDocumentTypeOrderByUploadedAtDesc(profile, docType)
                .ifPresent(existing -> {
                    if (existing.getUploadedAt() == null) {
                        return;
                    }

                    LocalDateTime nextAllowedAt = existing.getUploadedAt().plusDays(1);

                    if (LocalDateTime.now().isBefore(nextAllowedAt)) {
                        throw new AppException(
                                "Mỗi loại giấy tờ chỉ được thay đổi 1 lần trong 24 giờ. Vui lòng thử lại sau.",
                                HttpStatus.TOO_MANY_REQUESTS,
                                "DOCUMENT_CHANGE_LIMIT"
                        );
                    }
                });
    }
}
