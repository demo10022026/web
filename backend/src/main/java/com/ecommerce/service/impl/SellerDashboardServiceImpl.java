package com.ecommerce.service.impl;

import com.ecommerce.dto.response.SellerDashboardResponse;
import com.ecommerce.dto.response.ShopResponse;
import com.ecommerce.entity.Product;
import com.ecommerce.entity.ProductVariant;
import com.ecommerce.entity.SellerProfile;
import com.ecommerce.entity.Shop;
import com.ecommerce.entity.User;
import com.ecommerce.exception.AppException;
import com.ecommerce.repository.ProductRepository;
import com.ecommerce.repository.ProductVariantRepository;
import com.ecommerce.repository.SellerRepository;
import com.ecommerce.repository.ShopRepository;
import com.ecommerce.repository.UserRepository;
import com.ecommerce.service.SellerDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SellerDashboardServiceImpl implements SellerDashboardService {

    private static final int LOW_STOCK_THRESHOLD = 5;

    private final UserRepository userRepo;
    private final SellerRepository sellerRepo;
    private final ShopRepository shopRepo;
    private final ProductRepository productRepo;
    private final ProductVariantRepository variantRepo;

    @Override
    @Transactional(readOnly = true)
    public SellerDashboardResponse getDashboard(String email) {
        SellerProfile seller = findApprovedSeller(email);

        Shop shop = shopRepo.findBySeller(seller)
                .orElseThrow(() -> new AppException(
                        "Bạn chưa tạo shop",
                        HttpStatus.NOT_FOUND,
                        "SHOP_NOT_FOUND"
                ));

        long totalProducts = productRepo.countByShop(shop);
        long activeProducts = productRepo.countByShopAndProductStatus(
                shop,
                Product.Status.active
        );
        long draftProducts = productRepo.countByShopAndProductStatus(
                shop,
                Product.Status.draft
        );
        long inactiveProducts = productRepo.countByShopAndProductStatus(
                shop,
                Product.Status.inactive
        );
        long bannedProducts = productRepo.countByShopAndProductStatus(
                shop,
                Product.Status.banned
        );

        long totalSold = safeLong(productRepo.sumSoldCountByShop(shop));

        long lowStockVariants = variantRepo.countLowStockVariantsByShop(
                shop,
                LOW_STOCK_THRESHOLD
        );

        List<SellerDashboardResponse.RecentProduct> recentProducts =
                productRepo.findRecentByShop(shop, PageRequest.of(0, 5))
                        .getContent()
                        .stream()
                        .map(this::toRecentProduct)
                        .toList();

        List<SellerDashboardResponse.LowStockProduct> lowStockProducts =
                variantRepo.findLowStockVariantsByShop(
                                shop,
                                LOW_STOCK_THRESHOLD,
                                PageRequest.of(0, 5)
                        )
                        .stream()
                        .map(this::toLowStockProduct)
                        .toList();

        return SellerDashboardResponse.builder()
                .shop(toShopResponse(shop))
                .stats(SellerDashboardResponse.Stats.builder()
                        .totalProducts(totalProducts)
                        .activeProducts(activeProducts)
                        .draftProducts(draftProducts)
                        .inactiveProducts(inactiveProducts)
                        .bannedProducts(bannedProducts)
                        .totalSold(totalSold)
                        .lowStockVariants(lowStockVariants)

                        // Chưa có OrderItem theo shop trong repo hiện tại.
                        .pendingOrders(0)
                        .todayRevenue(BigDecimal.ZERO)
                        .totalRevenue(BigDecimal.ZERO)

                        .averageRating(shop.getRating())
                        .build())
                .tasks(SellerDashboardResponse.Tasks.builder()
                        .newOrders(0)
                        .lowStockProducts(lowStockVariants)
                        .needAvatar(isBlank(shop.getAvatarUrl()))
                        .needBanner(isBlank(shop.getBannerUrl()))
                        .needDescription(isBlank(shop.getDescription()))
                        .build())
                .recentProducts(recentProducts)
                .lowStockProducts(lowStockProducts)
                .build();
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

    private ShopResponse toShopResponse(Shop shop) {
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

    private SellerDashboardResponse.RecentProduct toRecentProduct(Product p) {
        return SellerDashboardResponse.RecentProduct.builder()
                .productId(p.getProductId())
                .productName(p.getProductName())
                .thumbnailUrl(p.getThumbnailUrl())
                .productStatus(p.getProductStatus().name())
                .soldCount(p.getSoldCount())
                .averageRating(p.getAverageRating())
                .createdAt(p.getCreatedAt())
                .build();
    }

    private SellerDashboardResponse.LowStockProduct toLowStockProduct(
            ProductVariant v
    ) {
        Product p = v.getProduct();

        return SellerDashboardResponse.LowStockProduct.builder()
                .productId(p.getProductId())
                .productName(p.getProductName())
                .thumbnailUrl(p.getThumbnailUrl())
                .variantId(v.getVariantId())
                .variantName(v.getVariantName())
                .sku(v.getSku())
                .stockQuantity(v.getStockQuantity())
                .build();
    }

    private long safeLong(Long value) {
        return value == null ? 0 : value;
    }

    private boolean isBlank(String value) {
        return value == null || value.trim().isEmpty();
    }
}