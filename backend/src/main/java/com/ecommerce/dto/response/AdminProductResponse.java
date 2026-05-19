package com.ecommerce.dto.response;

import com.ecommerce.entity.Product;
import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Builder
public class AdminProductResponse {

    private Integer productId;
    private String productName;
    private String thumbnailUrl;
    private Product.Status productStatus;

    private Integer shopId;
    private String shopName;

    private Integer categoryId;
    private String categoryName;

    private Integer brandId;
    private String brandName;

    private BigDecimal minPrice;
    private BigDecimal originalPrice;
    private Integer discountPercent;

    private Integer soldCount;
    private BigDecimal averageRating;

    private Integer totalStock;
    private Integer variantCount;
    private Integer imageCount;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}