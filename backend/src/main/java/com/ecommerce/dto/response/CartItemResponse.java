package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;

@Getter
@Builder
public class CartItemResponse {

    private Integer cartItemId;

    private Integer productId;
    private String productName;
    private String thumbnailUrl;
    private String productStatus;

    private Integer variantId;
    private String variantName;
    private String sku;
    private String variantImageUrl;

    private BigDecimal price;
    private BigDecimal originalPrice;
    private Integer discountPercent;

    private Integer quantity;
    private Integer stockQuantity;

    private BigDecimal itemTotal;
}