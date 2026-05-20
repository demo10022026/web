package com.ecommerce.service.impl;

import com.ecommerce.dto.request.AdminReviewSellerRequest;
import com.ecommerce.dto.request.AdminSuspendSellerRequest;
import com.ecommerce.dto.response.AdminSellerResponse;
import com.ecommerce.dto.response.AdminSellerStatsResponse;
import com.ecommerce.entity.*;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.SellerDocumentRepository;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.service.AdminSellerService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminSellerServiceImpl implements AdminSellerService {

    private final SellerRepository sellerRepo;
    private final SellerDocumentRepository documentRepo;
    private final ShopRepository shopRepo;

    @Override
    @Transactional(readOnly = true)
    public AdminSellerStatsResponse getStats() {
        return AdminSellerStatsResponse.builder()
                .totalSellers(sellerRepo.count())
                .pendingSellers(sellerRepo.countByVerificationStatus(SellerProfile.Status.pending))
                .approvedSellers(sellerRepo.countByVerificationStatus(SellerProfile.Status.approved))
                .rejectedSellers(sellerRepo.countByVerificationStatus(SellerProfile.Status.rejected))
                .suspendedSellers(sellerRepo.countByVerificationStatus(SellerProfile.Status.suspended))
                .activeShops(shopRepo.countByShopStatus(Shop.Status.active))
                .suspendedShops(shopRepo.countByShopStatus(Shop.Status.suspended))
                .hiddenShops(shopRepo.countByShopStatus(Shop.Status.hidden))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AdminSellerResponse> listSellers(
            String status,
            String keyword,
            int page,
            int size
    ) {
        SellerProfile.Status parsedStatus = parseStatus(status);
        String cleanKeyword = normalizeText(keyword);

        Pageable pageable = PageRequest.of(
                Math.max(page, 0),
                Math.min(Math.max(size, 1), 100)
        );

        Page<SellerProfile> sellers = sellerRepo.searchSellers(
                parsedStatus,
                cleanKeyword,
                pageable
        );

        if (sellers.isEmpty()) {
            return sellers.map(seller -> toResponse(seller, List.of(), null));
        }

        List<SellerProfile> content = sellers.getContent();

        Map<Integer, List<SellerDocument>> documentsBySeller = documentRepo
                .findBySellerIn(content)
                .stream()
                .collect(Collectors.groupingBy(doc -> doc.getSeller().getSellerId()));

        Map<Integer, Shop> shopBySeller = shopRepo.findBySellerIn(content)
                .stream()
                .collect(Collectors.toMap(
                        shop -> shop.getSeller().getSellerId(),
                        shop -> shop,
                        (a, b) -> a
                ));

        return sellers.map(seller -> toResponse(
                seller,
                documentsBySeller.getOrDefault(seller.getSellerId(), List.of()),
                shopBySeller.get(seller.getSellerId())
        ));
    }

    @Override
    @Transactional(readOnly = true)
    public AdminSellerResponse getSellerDetail(Integer sellerId) {
        SellerProfile seller = findSeller(sellerId);
        List<SellerDocument> documents = documentRepo.findBySeller(seller);
        Shop shop = shopRepo.findBySeller(seller).orElse(null);

        return toResponse(seller, documents, shop);
    }

    @Override
    @Transactional
    public AdminSellerResponse reviewSeller(
            Integer sellerId,
            AdminReviewSellerRequest request
    ) {
        if (request == null || request.getApproved() == null) {
            throw new AppException(
                    "Kết quả duyệt không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_REVIEW_RESULT"
            );
        }

        if (Boolean.TRUE.equals(request.getApproved())) {
            return approveSeller(sellerId);
        }

        String reason = normalizeText(request.getRejectionReason());

        if (reason == null) {
            throw new AppException(
                    "Vui lòng nhập lý do từ chối",
                    HttpStatus.BAD_REQUEST,
                    "REJECTION_REASON_REQUIRED"
            );
        }

        return rejectSeller(sellerId, reason);
    }

    @Override
    @Transactional
    public AdminSellerResponse suspendSeller(
            Integer sellerId,
            AdminSuspendSellerRequest request
    ) {
        SellerProfile seller = findSeller(sellerId);

        if (seller.getVerificationStatus() == SellerProfile.Status.pending) {
            throw new AppException(
                    "Không thể tạm khóa seller đang chờ duyệt",
                    HttpStatus.BAD_REQUEST,
                    "SELLER_PENDING_REVIEW"
            );
        }

        seller.setVerificationStatus(SellerProfile.Status.suspended);
        seller.setRejectionReason(normalizeText(request == null ? null : request.getReason()));

        shopRepo.findBySeller(seller).ifPresent(shop -> {
            shop.setShopStatus(Shop.Status.suspended);
            shopRepo.save(shop);
        });

        SellerProfile saved = sellerRepo.save(seller);

        return getSellerDetail(saved.getSellerId());
    }

    @Override
    @Transactional
    public AdminSellerResponse reactivateSeller(Integer sellerId) {
        SellerProfile seller = findSeller(sellerId);
        User user = seller.getUser();

        seller.setVerificationStatus(SellerProfile.Status.approved);
        seller.setVerifiedAt(LocalDateTime.now());
        seller.setRejectionReason(null);

        if (user != null) {
            user.setRole(User.Role.seller);
        }

        shopRepo.findBySeller(seller).ifPresent(shop -> {
            shop.setShopStatus(Shop.Status.active);
            shopRepo.save(shop);
        });

        SellerProfile saved = sellerRepo.save(seller);

        return getSellerDetail(saved.getSellerId());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminSellerResponse> getPendingSellersLegacy() {
        return listSellers("pending", null, 0, 100)
                .getContent();
    }

    @Override
    @Transactional
    public AdminSellerResponse approveSellerLegacy(Integer sellerId) {
        return approveSeller(sellerId);
    }

    @Override
    @Transactional
    public AdminSellerResponse rejectSellerLegacy(
            Integer sellerId,
            String reason
    ) {
        String cleanReason = normalizeText(reason);

        if (cleanReason == null) {
            throw new AppException(
                    "Vui lòng nhập lý do từ chối",
                    HttpStatus.BAD_REQUEST,
                    "REJECTION_REASON_REQUIRED"
            );
        }

        return rejectSeller(sellerId, cleanReason);
    }

    private AdminSellerResponse approveSeller(Integer sellerId) {
        SellerProfile seller = findSeller(sellerId);
        User user = seller.getUser();

        seller.setVerificationStatus(SellerProfile.Status.approved);
        seller.setVerifiedAt(LocalDateTime.now());
        seller.setRejectionReason(null);

        if (user != null) {
            user.setRole(User.Role.seller);
        }

        List<SellerDocument> documents = documentRepo.findBySeller(seller);

        for (SellerDocument document : documents) {
            document.setVerificationStatus(SellerDocument.VerifyStatus.approved);
        }

        documentRepo.saveAll(documents);

        SellerProfile saved = sellerRepo.save(seller);

        return toResponse(saved, documents, shopRepo.findBySeller(saved).orElse(null));
    }

    private AdminSellerResponse rejectSeller(
            Integer sellerId,
            String reason
    ) {
        SellerProfile seller = findSeller(sellerId);

        seller.setVerificationStatus(SellerProfile.Status.rejected);
        seller.setVerifiedAt(null);
        seller.setRejectionReason(reason);

        List<SellerDocument> documents = documentRepo.findBySeller(seller);

        for (SellerDocument document : documents) {
            document.setVerificationStatus(SellerDocument.VerifyStatus.rejected);
        }

        documentRepo.saveAll(documents);

        SellerProfile saved = sellerRepo.save(seller);

        return toResponse(saved, documents, shopRepo.findBySeller(saved).orElse(null));
    }

    private SellerProfile findSeller(Integer sellerId) {
        return sellerRepo.findById(sellerId)
                .orElseThrow(() -> AppException.notFound("Seller"));
    }

    private SellerProfile.Status parseStatus(String status) {
        String clean = normalizeText(status);

        if (clean == null || clean.equals("all")) {
            return null;
        }

        try {
            return SellerProfile.Status.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Trạng thái seller không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SELLER_STATUS"
            );
        }
    }

    private AdminSellerResponse toResponse(
            SellerProfile seller,
            List<SellerDocument> documents,
            Shop shop
    ) {
        User user = seller.getUser();

        return AdminSellerResponse.builder()
                .sellerId(seller.getSellerId())

                .userId(user == null ? null : user.getUserId())
                .username(user == null ? null : user.getUsername())
                .fullName(user == null ? null : user.getFullName())
                .email(user == null ? null : user.getEmail())
                .phoneNumber(user == null ? null : user.getPhoneNumber())
                .userRole(user == null || user.getRole() == null ? null : user.getRole().name())
                .accountStatus(user == null || user.getAccountStatus() == null
                        ? null
                        : user.getAccountStatus().name())

                .identityNumber(seller.getIdentityNumber())
                .taxCode(seller.getTaxCode())
                .verificationStatus(seller.getVerificationStatus() == null
                        ? null
                        : seller.getVerificationStatus().name())
                .rejectionReason(seller.getRejectionReason())
                .verifiedAt(seller.getVerifiedAt())
                .createdAt(seller.getCreatedAt())

                .shop(toShopInfo(shop))
                .documents(documents == null
                        ? List.of()
                        : documents.stream().map(this::toDocumentInfo).toList())
                .build();
    }

    private AdminSellerResponse.ShopInfo toShopInfo(Shop shop) {
        if (shop == null) {
            return null;
        }

        return AdminSellerResponse.ShopInfo.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .description(shop.getDescription())
                .avatarUrl(shop.getAvatarUrl())
                .bannerUrl(shop.getBannerUrl())
                .shopStatus(shop.getShopStatus() == null ? null : shop.getShopStatus().name())
                .rating(shop.getRating())
                .followerCount(shop.getFollowerCount())
                .createdAt(shop.getCreatedAt())
                .build();
    }

    private AdminSellerResponse.DocumentInfo toDocumentInfo(SellerDocument document) {
        return AdminSellerResponse.DocumentInfo.builder()
                .documentId(document.getDocumentId())
                .documentType(document.getDocumentType() == null
                        ? null
                        : document.getDocumentType().name())
                .documentUrl(document.getDocumentUrl())
                .verificationStatus(document.getVerificationStatus() == null
                        ? null
                        : document.getVerificationStatus().name())
                .uploadedAt(document.getUploadedAt())
                .build();
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }
}
