package com.ecommerce.dto.response;

import com.ecommerce.entity.Product;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class AdminProductDetailResponse {

    private Integer productId;
    private String productName;
    private String description;
    private String thumbnailUrl;
    private Product.Status productStatus;

    private Integer shopId;
    private String shopName;
    private String shopSlug;

    private Integer categoryId;
    private String categoryName;

    private Integer brandId;
    private String brandName;

    private Integer soldCount;
    private BigDecimal averageRating;

    private BigDecimal minPrice;
    private BigDecimal originalPrice;
    private Integer discountPercent;

    private Integer totalStock;

    private List<VariantInfo> variants;
    private List<ImageInfo> images;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    @Getter
    @Builder
    public static class VariantInfo {
        private Integer variantId;
        private String variantName;
        private String sku;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer discountPercent;
        private Integer stockQuantity;
        private Integer weight;
        private Integer length;
        private Integer width;
        private Integer height;
        private String imageUrl;
        private LocalDateTime createdAt;
    }

    @Getter
    @Builder
    public static class ImageInfo {
        private Integer imageId;
        private String imageUrl;
        private Boolean isThumbnail;
        private LocalDateTime createdAt;
    }
}