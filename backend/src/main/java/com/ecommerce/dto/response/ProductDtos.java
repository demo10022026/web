package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class ProductDtos {

    /** Dùng cho danh sách: trang chủ, tìm kiếm, category */
    @Getter @Builder
    public static class ProductSummary {
        private Integer productId;
        private String productName;
        private String thumbnailUrl;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer discountPercent;
        private Integer soldCount;
        private BigDecimal averageRating;
        private String shopName;
        private Integer shopId;
        private String categoryName;
    }

    /** Dùng cho trang chi tiết sản phẩm */
    @Getter @Builder
    public static class ProductDetail {
        private Integer productId;
        private String productName;
        private String description;
        private String thumbnailUrl;
        private List<String> images;
        private List<VariantDto> variants;
        private Integer soldCount;
        private BigDecimal averageRating;
        private ShopInfo shop;
        private String categoryName;
        private String brandName;
        private LocalDateTime createdAt;
    }

    @Getter @Builder
    public static class VariantDto {
        private Integer variantId;
        private String variantName;
        private String sku;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer discountPercent;
        private Integer stockQuantity;
        private String imageUrl;
    }

    @Getter @Builder
    public static class ShopInfo {
        private Integer shopId;
        private String shopName;
        private String shopSlug;
        private String avatarUrl;
        private BigDecimal rating;
        private Integer followerCount;
    }

    /** Dùng cho flash sale */
    @Getter @Builder
    public static class FlashSaleProduct {
        private Integer productId;
        private String productName;
        private String thumbnailUrl;
        private BigDecimal salePrice;
        private BigDecimal originalPrice;
        private Integer discountPercent;
        private Integer quantityLimit;
        private Integer quantitySold;
        private Integer remainingPercent;
        private LocalDateTime endTime;
    }

    /** Dùng cho category tree */
    @Getter @Builder
    public static class CategoryDto {
        private Integer categoryId;
        private String categoryName;
        private List<CategoryDto> children;
    }
}
