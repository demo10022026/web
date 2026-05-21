package com.ecommerce.service.impl;

import com.ecommerce.dto.response.PublicShopResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.Shop;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ReviewRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.service.PublicShopService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;

@Service
@RequiredArgsConstructor
public class PublicShopServiceImpl implements PublicShopService {

    private final ShopRepository shopRepo;
    private final ProductRepository productRepo;
    private final ReviewRepository reviewRepo;

    @Override
    @Transactional(readOnly = true)
    public PublicShopResponse getPublicShop(String shopSlugOrId) {
        Shop shop = findPublicShop(shopSlugOrId);

        long activeProducts = productRepo.countByShopAndProductStatus(
                shop,
                Product.Status.active
        );

        long reviewCount = reviewRepo.countByShop(shop);
        BigDecimal shopRating = toRating(reviewRepo.averageRatingByShop(shop));

        return PublicShopResponse.builder()
                .shopId(shop.getShopId())
                .shopName(shop.getShopName())
                .shopSlug(shop.getShopSlug())
                .description(shop.getDescription())
                .avatarUrl(shop.getAvatarUrl())
                .bannerUrl(shop.getBannerUrl())
                .shopStatus(shop.getShopStatus() == null ? null : shop.getShopStatus().name())
                .rating(shopRating)
                .reviewCount(reviewCount)
                .followerCount(shop.getFollowerCount())
                .activeProductCount(activeProducts)
                .createdAt(shop.getCreatedAt())
                .build();
    }

    private Shop findPublicShop(String shopSlugOrId) {
        String clean = shopSlugOrId == null ? "" : shopSlugOrId.trim();

        if (clean.isEmpty()) {
            throw AppException.notFound("Shop");
        }

        Shop shop;

        if (clean.matches("\\d+")) {
            shop = shopRepo.findById(Integer.parseInt(clean))
                    .orElseThrow(() -> AppException.notFound("Shop"));
        } else {
            shop = shopRepo.findByShopSlug(clean)
                    .orElseThrow(() -> AppException.notFound("Shop"));
        }

        if (shop.getShopStatus() != Shop.Status.active) {
            throw AppException.notFound("Shop");
        }

        return shop;
    }

    private BigDecimal toRating(Double rating) {
        if (rating == null) {
            return BigDecimal.ZERO;
        }

        return BigDecimal.valueOf(rating)
                .setScale(1, RoundingMode.HALF_UP);
    }
}
