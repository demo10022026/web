package com.ecommerce.service.impl;

import com.ecommerce.dto.request.UpsertSellerBankAccountRequest;
import com.ecommerce.dto.response.SellerShopProfileResponse;
import com.ecommerce.entity.SellerBankAccount;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.SellerBankAccountRepository;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ImageStorageService;
import com.ecommerce.service.SellerShopProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
public class SellerShopProfileServiceImpl implements SellerShopProfileService {

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final SellerBankAccountRepository bankRepo;
    private final ImageStorageService imageStorage;

    @Override
    @Transactional(readOnly = true)
    public SellerShopProfileResponse getMyShopProfile(String email) {
        SellerProfile seller = findApprovedSeller(email);
        Shop shop = findShop(seller);
        SellerBankAccount bank = bankRepo
                .findFirstBySellerOrderByIsPrimaryDescCreatedAtDesc(seller)
                .orElse(null);

        return toResponse(shop, seller, bank);
    }

    @Override
    @Transactional
    public SellerShopProfileResponse updateMyShopProfile(
            String email,
            String shopName,
            String description,
            String shopStatus,
            MultipartFile avatar,
            MultipartFile banner
    ) {
        SellerProfile seller = findApprovedSeller(email);
        Shop shop = findShop(seller);

        String cleanShopName = normalizeRequired(shopName);
        if (cleanShopName.length() > 150) {
            throw new AppException(
                    "Tên shop tối đa 150 ký tự",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SHOP_NAME"
            );
        }

        shop.setShopName(cleanShopName);
        shop.setDescription(normalizeText(description));

        Shop.Status nextStatus = parseShopStatus(shopStatus, shop.getShopStatus());
        if (nextStatus == Shop.Status.suspended) {
            throw new AppException(
                    "Seller không thể tự chuyển shop sang trạng thái tạm khóa",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SHOP_STATUS"
            );
        }
        shop.setShopStatus(nextStatus);

        if (avatar != null && !avatar.isEmpty()) {
            ImageStorageService.UploadResult uploaded = imageStorage.uploadWithInfo(
                    avatar,
                    "shops/" + seller.getSellerId() + "/avatar"
            );
            shop.setAvatarUrl(uploaded.getUrl());
        }

        if (banner != null && !banner.isEmpty()) {
            ImageStorageService.UploadResult uploaded = imageStorage.uploadWithInfo(
                    banner,
                    "shops/" + seller.getSellerId() + "/banner"
            );
            shop.setBannerUrl(uploaded.getUrl());
        }

        Shop saved = shopRepo.save(shop);
        SellerBankAccount bank = bankRepo
                .findFirstBySellerOrderByIsPrimaryDescCreatedAtDesc(seller)
                .orElse(null);

        return toResponse(saved, seller, bank);
    }

    @Override
    @Transactional
    public SellerShopProfileResponse upsertBankAccount(
            String email,
            UpsertSellerBankAccountRequest request
    ) {
        SellerProfile seller = findApprovedSeller(email);
        Shop shop = findShop(seller);

        SellerBankAccount bank = bankRepo
                .findFirstBySellerOrderByIsPrimaryDescCreatedAtDesc(seller)
                .orElseGet(() -> SellerBankAccount.builder()
                        .seller(seller)
                        .isPrimary(true)
                        .build());

        bank.setBankName(normalizeRequired(request.getBankName()));
        bank.setAccountHolder(normalizeRequired(request.getAccountHolder()));
        bank.setAccountNumber(normalizeRequired(request.getAccountNumber()));
        bank.setIsPrimary(true);

        bankRepo.clearPrimaryBySeller(seller);
        SellerBankAccount savedBank = bankRepo.save(bank);

        return toResponse(shop, seller, savedBank);
    }

    private SellerProfile findApprovedSeller(String email) {
        User user = userRepo.findByEmail(email)
                .orElseThrow(() -> AppException.notFound("User"));

        SellerProfile seller = sellerRepo.findByUser(user)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa đăng ký seller",
                        HttpStatus.FORBIDDEN,
                        "NOT_SELLER"
                ));

        if (seller.getVerificationStatus() != SellerProfile.Status.approved) {
            throw new AppException(
                    "Hồ sơ seller chưa được duyệt",
                    HttpStatus.FORBIDDEN,
                    "SELLER_NOT_APPROVED"
            );
        }

        return seller;
    }

    private Shop findShop(SellerProfile seller) {
        return shopRepo.findBySeller(seller)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa tạo shop",
                        HttpStatus.NOT_FOUND,
                        "SHOP_NOT_FOUND"
                ));
    }

    private SellerShopProfileResponse toResponse(
            Shop shop,
            SellerProfile seller,
            SellerBankAccount bank
    ) {
        return SellerShopProfileResponse.builder()
                .shopId(shop.getShopId())
                .sellerId(seller.getSellerId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .description(shop.getDescription())
                .avatarUrl(shop.getAvatarUrl())
                .bannerUrl(shop.getBannerUrl())
                .shopStatus(shop.getShopStatus() == null ? null : shop.getShopStatus().name())
                .rating(shop.getRating())
                .followerCount(shop.getFollowerCount())
                .createdAt(shop.getCreatedAt())
                .bankAccount(toBankResponse(bank))
                .build();
    }

    private SellerShopProfileResponse.BankAccount toBankResponse(SellerBankAccount bank) {
        if (bank == null) {
            return null;
        }

        return SellerShopProfileResponse.BankAccount.builder()
                .bankAccountId(bank.getBankAccountId())
                .bankName(bank.getBankName())
                .accountHolder(bank.getAccountHolder())
                .accountNumber(bank.getAccountNumber())
                .maskedAccountNumber(maskAccountNumber(bank.getAccountNumber()))
                .isPrimary(Boolean.TRUE.equals(bank.getIsPrimary()))
                .createdAt(bank.getCreatedAt())
                .build();
    }

    private Shop.Status parseShopStatus(String value, Shop.Status fallback) {
        String clean = normalizeText(value);

        if (clean == null) {
            return fallback == null ? Shop.Status.active : fallback;
        }

        try {
            return Shop.Status.valueOf(clean);
        } catch (IllegalArgumentException e) {
            throw new AppException(
                    "Trạng thái shop không hợp lệ",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_SHOP_STATUS"
            );
        }
    }

    private String maskAccountNumber(String value) {
        String clean = normalizeText(value);
        if (clean == null) {
            return null;
        }

        if (clean.length() <= 4) {
            return clean;
        }

        return "•••• " + clean.substring(clean.length() - 4);
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private String normalizeRequired(String value) {
        String normalized = normalizeText(value);

        if (normalized == null) {
            throw new AppException(
                    "Dữ liệu không được để trống",
                    HttpStatus.BAD_REQUEST,
                    "REQUIRED_FIELD"
            );
        }

        return normalized;
    }
}
