package com.ecommerce.service.impl;

import com.ecommerce.dto.request.CreateShopRequest;
import com.ecommerce.dto.response.ShopResponse;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.ImageStorageService;
import com.ecommerce.service.SellerShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.math.BigDecimal;
import java.text.Normalizer;
import java.time.LocalDateTime;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class SellerShopServiceImpl implements SellerShopService {

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final ImageStorageService imageStorage;

    @Override
    @Transactional(readOnly = true)
    public ShopResponse getMyShop(String email) {
        SellerProfile seller = findApprovedSeller(email);

        Shop shop = shopRepo.findBySeller(seller)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa tạo shop",
                        HttpStatus.NOT_FOUND,
                        "SHOP_NOT_FOUND"
                ));

        return toResponse(shop);
    }

    @Override
    @Transactional
    public ShopResponse createShop(
            String email,
            CreateShopRequest request,
            MultipartFile avatar,
            MultipartFile banner
    ) {
        SellerProfile seller = findApprovedSeller(email);

        if (shopRepo.existsBySeller(seller)) {
            throw new AppException(
                    "Bạn đã tạo shop rồi",
                    HttpStatus.CONFLICT,
                    "SHOP_ALREADY_EXISTS"
            );
        }

        String slug = generateUniqueSlug(request.getShopName());

        String avatarUrl = null;
        String bannerUrl = null;

        if (avatar != null && !avatar.isEmpty()) {
            validateImageFile(avatar);
            avatarUrl = imageStorage.upload(
                    avatar,
                    "shops/" + seller.getSellerId() + "/avatar"
            );
        }

        if (banner != null && !banner.isEmpty()) {
            validateImageFile(banner);
            bannerUrl = imageStorage.upload(
                    banner,
                    "shops/" + seller.getSellerId() + "/banner"
            );
        }

        Shop shop = Shop.builder()
                .seller(seller)
                .shopName(request.getShopName().trim())
                .shopSlug(slug)
                .description(normalizeText(request.getDescription()))
                .avatarUrl(avatarUrl)
                .bannerUrl(bannerUrl)
                .shopStatus(Shop.Status.active)
                .rating(BigDecimal.ZERO)
                .followerCount(0)
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(shopRepo.save(shop));
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

    private String generateUniqueSlug(String shopName) {
        String baseSlug = slugify(shopName);

        if (baseSlug.isBlank()) {
            baseSlug = "shop";
        }

        String slug = baseSlug;
        int counter = 1;

        while (shopRepo.existsByShopSlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }

        return slug;
    }

    private String slugify(String input) {
        String text = input == null
                ? ""
                : input.trim().toLowerCase(Locale.ROOT);

        text = text.replace("đ", "d");

        String normalized = Normalizer.normalize(text, Normalizer.Form.NFD)
                .replaceAll("\\p{M}", "");

        return normalized
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
    }

    private String normalizeText(String value) {
        if (value == null) {
            return null;
        }

        String trimmed = value.trim();

        return trimmed.isEmpty() ? null : trimmed;
    }

    private void validateImageFile(MultipartFile file) {
        String contentType = file.getContentType();

        if (contentType == null || !contentType.startsWith("image/")) {
            throw new AppException(
                    "Chỉ được upload file ảnh",
                    HttpStatus.BAD_REQUEST,
                    "INVALID_IMAGE_FILE"
            );
        }

        long maxSize = 5 * 1024 * 1024;

        if (file.getSize() > maxSize) {
            throw new AppException(
                    "Ảnh tối đa 5MB",
                    HttpStatus.BAD_REQUEST,
                    "IMAGE_TOO_LARGE"
            );
        }
    }

    private ShopResponse toResponse(Shop shop) {
        return ShopResponse.builder()
                .shopId(shop.getShopId())
                .sellerId(shop.getSeller().getSellerId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .description(shop.getDescription())
                .avatarUrl(shop.getAvatarUrl())
                .bannerUrl(shop.getBannerUrl())
                .shopStatus(shop.getShopStatus().name())
                .rating(shop.getRating())
                .followerCount(shop.getFollowerCount())
                .createdAt(shop.getCreatedAt())
                .build();
    }
}