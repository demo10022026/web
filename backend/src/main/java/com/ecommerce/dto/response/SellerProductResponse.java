package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class SellerProductResponse {

    private Integer productId;
    private Integer shopId;

    private Integer parentCategoryId;
    private String parentCategoryName;

    private Integer categoryId;
    private String categoryName;

    private Integer brandId;
    private String brandName;

    private String productName;
    private String description;
    private String thumbnailUrl;
    private String productStatus;

    private Integer soldCount;
    private BigDecimal averageRating;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    private List<VariantResponse> variants;
    private List<ImageResponse> images;

    @Getter
    @Builder
    public static class VariantResponse {
        private Integer variantId;
        private String sku;
        private String variantName;
        private BigDecimal price;
        private BigDecimal originalPrice;
        private Integer stockQuantity;
        private Integer weight;
        private Integer length;
        private Integer width;
        private Integer height;
        private String imageUrl;
    }

    @Getter
    @Builder
    public static class ImageResponse {
        private Integer imageId;
        private String imageUrl;
        private Boolean isThumbnail;
    }
}
