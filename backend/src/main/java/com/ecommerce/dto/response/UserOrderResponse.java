package com.ecommerce.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Builder
public class UserOrderResponse {

    private Integer orderId;
    private String orderCode;

    private String orderStatus;

    private Integer shopId;
    private String shopName;
    private String shopSlug;

    private BigDecimal subtotalAmount;
    private BigDecimal shippingFee;
    private BigDecimal totalAmount;

    private String receiverName;
    private String receiverPhone;
    private String provinceName;
    private String districtName;
    private String wardName;
    private String shippingAddress;

    private String ghnOrderCode;
    private String trackingCode;

    private LocalDateTime createdAt;

    private List<Item> items;

    @Getter
    @Builder
    public static class Item {
        private Integer orderItemId;

        private Integer productId;
        private String productName;
        private String thumbnailUrl;

        private Integer variantId;
        private String variantName;
        private String sku;

        private Integer quantity;
        private BigDecimal price;
        private BigDecimal originalPrice;

        private Boolean reviewed;
        private Integer reviewId;
    }
}
